"""Opt-in live MCP benchmark with disposable local DynamoDB and MinIO fixtures.

No provider credentials or user data are written to the report. Requires the
Compose dynamodb/minio services and a reachable System One endpoint.
"""
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import platform
import random
import secrets
import socket
import statistics
import subprocess
import sys
import time
from datetime import datetime, timezone

import boto3
from botocore.config import Config
import httpx


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--model-url', required=True, help='Full /v1/systemone URL')
    parser.add_argument('--model', default='Cloudflare/clef-flash')
    parser.add_argument('--repeats', type=int, default=2)
    parser.add_argument('--output', default='../docs/benchmarks/routing-results.json')
    args = parser.parse_args()
    if args.repeats < 1:
        parser.error('--repeats must be positive')
    fixture_path = Path(__file__).with_name('routing-fixtures.json')
    fixture = json.loads(fixture_path.read_text())
    run = secrets.token_hex(6)
    table_name, bucket = f'SnapBenchmark-{run}', f'snap-benchmark-{run}'
    key = 'snap_' + secrets.token_urlsafe(32)
    email = 'benchmark@example.invalid'
    db = boto3.resource('dynamodb', endpoint_url='http://127.0.0.1:8000', region_name='us-east-1', aws_access_key_id='local', aws_secret_access_key='local')
    storage = boto3.client('s3', endpoint_url='http://127.0.0.1:9000', region_name='us-east-1', aws_access_key_id='snaplocal', aws_secret_access_key='snaplocalpassword', config=Config(signature_version='s3v4', s3={'addressing_style':'path'}))
    table = None
    process = None
    bucket_created = False
    rows = []
    try:
        table = db.create_table(TableName=table_name, KeySchema=[{'AttributeName':'PK','KeyType':'HASH'},{'AttributeName':'SK','KeyType':'RANGE'}], AttributeDefinitions=[{'AttributeName':'PK','AttributeType':'S'},{'AttributeName':'SK','AttributeType':'S'}], BillingMode='PAY_PER_REQUEST')
        table.wait_until_exists()
        storage.create_bucket(Bucket=bucket)
        bucket_created = True
        table.put_item(Item={'PK':'APIKEY#'+hashlib.sha256(key.encode()).hexdigest(),'SK':'KEY','email':email})
        for skill in fixture['skills']:
            text=f"---\nname: {skill['name']}\ndescription: {skill['description']}\n---\n# {skill['name']}\nFollow the task-specific checks for this skill."
            storage.put_object(Bucket=bucket, Key=f"{skill['name']}/SKILL.md", Body=text.encode())
        with socket.socket() as sock:
            sock.bind(('127.0.0.1',0))
            port=sock.getsockname()[1]
        env={**os.environ,'ROUTING_PROVIDER':'local','LOCAL_SYSTEMONE_URL':args.model_url,'LOCAL_SYSTEMONE_MODEL':args.model,'LOCAL_SYSTEMONE_API_KEY':os.getenv('BENCHMARK_MODEL_KEY','local'),'SKILL_MATCH_THRESHOLD':'0.42','DYNAMODB_ENDPOINT':'http://127.0.0.1:8000','DYNAMODB_REGION':'us-east-1','DYNAMODB_TABLE':table_name,'S3_ENDPOINT':'http://127.0.0.1:9000','S3_PUBLIC_ENDPOINT':'http://127.0.0.1:9000','S3_ACCESS_KEY':'snaplocal','S3_SECRET_KEY':'snaplocalpassword','S3_BUCKET':bucket,'S3_REGION':'us-east-1','MCP_HOST':'127.0.0.1','MCP_PORT':str(port),'MCP_ALLOWED_ORIGINS':''}
        process=subprocess.Popen([sys.executable,'server.py'],cwd=Path(__file__).parent,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        base=f'http://127.0.0.1:{port}'
        with httpx.Client(base_url=base,timeout=45,headers={'X-Snap-API-Key':key,'Accept':'application/json, text/event-stream'}) as client:
            for _ in range(100):
                if process.poll() is not None:
                    raise RuntimeError('Benchmark MCP server exited during startup')
                try:
                    if client.get('/health').status_code==200:break
                except httpx.ConnectError:pass
                time.sleep(.1)
            else:raise RuntimeError('Benchmark MCP server did not become ready')
            def rpc(method,params):
                response=client.post('/mcp',json={'jsonrpc':'2.0','id':1,'method':method,'params':params})
                response.raise_for_status()
                data=response.json()
                if 'error' in data or data.get('result',{}).get('isError'):
                    raise RuntimeError('MCP call failed')
                return data['result']
            rpc('initialize',{'protocolVersion':'2025-06-18','capabilities':{},'clientInfo':{'name':'snap-benchmark','version':'1'}})
            rng=random.Random(20261101)
            for size in (10,30,64):
                catalog=fixture['skills'][:size].copy()
                rng.shuffle(catalog)
                with table.batch_writer() as batch:
                    for skill in catalog:
                        batch.put_item(Item={'PK':f'USER#{email}','SK':f"SKILL#{skill['name']}",'id':skill['name'],**skill,'objectKey':f"{skill['name']}/SKILL.md"})
                # One excluded warm-up per catalog, including storage read/signing.
                rpc('tools/call',{'name':'get_skill','arguments':{'problem':fixture['cases'][0]['problem']}})
                for repeat in range(args.repeats):
                    cases=fixture['cases'].copy()
                    rng.shuffle(cases)
                    for case in cases:
                        start=time.perf_counter()
                        row={'size':size,'repeat':repeat+1,**case}
                        try:
                            result=rpc('tools/call',{'name':'get_skill','arguments':{'problem':case['problem']}})
                            row['latency_ms']=round((time.perf_counter()-start)*1000,3)
                            text=result['content'][0]['text']
                            match=None if text=='No matching skill found.' else json.loads(text)
                            row.update(selected=match['name'] if match else None,confidence=match['confidence'] if match else None)
                        except Exception as error:
                            row.update(latency_ms=round((time.perf_counter()-start)*1000,3),error=type(error).__name__)
                        rows.append(row)
                        print(f"{len(rows)}/{len(fixture['cases'])*3*args.repeats} calls; {size} skills",flush=True)
                with table.batch_writer() as batch:
                    for skill in catalog:batch.delete_item(Key={'PK':f'USER#{email}','SK':f"SKILL#{skill['name']}"})
        summary=[]
        for size in (10,30,64):
            group=[r for r in rows if r['size']==size]
            positive=[r for r in group if r['expected'] is not None]
            negative=[r for r in group if r['expected'] is None]
            times=sorted(r['latency_ms'] for r in group if 'error' not in r)
            summary.append({'skills':size,'positive_correct':sum('error' not in r and r.get('selected')==r['expected'] for r in positive),'positive_total':len(positive),'no_match_correct':sum('error' not in r and r.get('selected') is None for r in negative),'no_match_total':len(negative),'p50_ms':round(statistics.median(times),3) if times else None,'p95_ms':times[math.ceil(.95*len(times))-1] if times else None,'errors':sum('error' in r for r in group)})
        report={'created_at':datetime.now(timezone.utc).isoformat(),'model_requested':args.model,'provider':'local System One; remote LAN inference','threshold':.42,'seed':20261101,'repeats':args.repeats,'warmups_per_size':1,'client_platform':platform.platform(),'python':platform.python_version(),'fixture_sha256':hashlib.sha256(fixture_path.read_bytes()).hexdigest(),'timing_scope':'Warm sequential HTTP tools/call round trip: API-key validation, DynamoDB catalog lookup, live model inference, matched object read, URL signing, MCP serialization. Excludes initialization, warm-ups, agent reasoning and optional URL download.','summary':summary,'results':rows}
        output=Path(args.output)
        output.parent.mkdir(parents=True,exist_ok=True)
        output.write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(summary,indent=2))
        if any(r['errors'] for r in summary):raise RuntimeError('Benchmark completed with request errors; inspect report')
    finally:
        if process:
            process.terminate()
            try:process.wait(timeout=10)
            except subprocess.TimeoutExpired:process.kill();process.wait()
        if table:table.delete()
        if bucket_created:
            objects=storage.list_objects_v2(Bucket=bucket).get('Contents',[])
            if objects:storage.delete_objects(Bucket=bucket,Delete={'Objects':[{'Key':o['Key']} for o in objects]})
            storage.delete_bucket(Bucket=bucket)


if __name__=='__main__':main()
