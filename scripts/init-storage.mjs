import { CreateBucketCommand, HeadBucketCommand, S3Client } from "@aws-sdk/client-s3"
import nextEnv from "@next/env"

nextEnv.loadEnvConfig(process.cwd())
const bucket = process.env.S3_BUCKET ?? "snap-skills"
const client = new S3Client({
  endpoint: process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000",
  region: process.env.S3_REGION ?? "us-east-1",
  forcePathStyle: true,
  credentials: { accessKeyId: process.env.S3_ACCESS_KEY ?? "snaplocal", secretAccessKey: process.env.S3_SECRET_KEY ?? "snaplocalpassword" },
})
try {
  await client.send(new HeadBucketCommand({ Bucket: bucket }))
  console.log(`Bucket ${bucket} already exists.`)
} catch (error) {
  if (error.$metadata?.httpStatusCode !== 404) throw error
  await client.send(new CreateBucketCommand({ Bucket: bucket }))
  console.log(`Created bucket ${bucket}.`)
}
