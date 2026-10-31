"""Exercise real DynamoDB, Workers AI, and MinIO using isolated temporary records."""
import hashlib
import json
import os
import secrets
import uuid

import boto3
import httpx
from dotenv import load_dotenv
from starlette.testclient import TestClient

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))
for name, value in {"DYNAMODB_ENDPOINT": "http://127.0.0.1:8000", "S3_ENDPOINT": "http://127.0.0.1:9000", "S3_PUBLIC_ENDPOINT": "http://127.0.0.1:9000", "S3_ACCESS_KEY": "snaplocal", "S3_SECRET_KEY": "snaplocalpassword"}.items():
    os.environ.setdefault(name, value)

import server

test_id = uuid.uuid4().hex
email = f"integration-{test_id}@example.invalid"
api_key = "snap_" + secrets.token_urlsafe(32)
hash_key = hashlib.sha256(api_key.encode()).hexdigest()
key_record = {"PK": f"APIKEY#{hash_key}", "SK": "KEY"}
skill_keys = [{"PK": f"USER#{email}", "SK": f"SKILL#{identifier}"} for identifier in ("pdf", "sql")]
object_key = f"integration-tests/{test_id}/SKILL.md"
bucket = os.getenv("S3_BUCKET", "snap-skills")
content = "---\nname: pdf-extract\ndescription: Extract text and tables from PDF files.\n---\n# PDF extraction\nExtract tables from the PDF.\n"
table = server.dynamodb_table()
s3 = boto3.client("s3", endpoint_url=os.environ["S3_ENDPOINT"], region_name=os.getenv("S3_REGION", "us-east-1"), aws_access_key_id=os.environ["S3_ACCESS_KEY"], aws_secret_access_key=os.environ["S3_SECRET_KEY"])

try:
    s3.put_object(Bucket=bucket, Key=object_key, Body=content.encode(), ContentType="text/markdown")
    table.put_item(Item={**key_record, "email": email}, ConditionExpression="attribute_not_exists(PK)")
    table.put_item(Item={**skill_keys[0], "id": "pdf", "name": "pdf-extract", "description": "Extract text and tables from PDF files.", "objectKey": object_key}, ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)")
    table.put_item(Item={**skill_keys[1], "id": "sql", "name": "sql-review", "description": "Review SQL query performance and database indexes."}, ConditionExpression="attribute_not_exists(PK) AND attribute_not_exists(SK)")
    headers = {"x-snap-api-key": api_key, "accept": "application/json, text/event-stream"}
    with TestClient(server.app) as client:
        response = client.post("/mcp", headers=headers, json={"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "get_skill", "arguments": {"problem": "Extract text and tables from this PDF file"}}})
        response.raise_for_status()
        result = response.json()["result"]
        if result.get("isError"):
            raise RuntimeError("MCP tool returned an error")
        match = json.loads(result["content"][0]["text"])
        if match.get("name") != "pdf-extract":
            raise RuntimeError("Clef did not select the expected PDF skill")
        download = httpx.get(match["url"], timeout=15)
        download.raise_for_status()
        if download.text != content:
            raise RuntimeError("Downloaded skill content did not match")
        print("PASS: real MCP authentication, DynamoDB lookup, Clef selection, MinIO signing and download")
finally:
    for key in [key_record, *skill_keys]:
        table.delete_item(Key=key)
    s3.delete_object(Bucket=bucket, Key=object_key)
