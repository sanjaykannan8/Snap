import { CreateBucketCommand, DeleteObjectCommand, GetObjectCommand, HeadBucketCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function config(endpoint: string) {
  const accessKeyId = process.env.S3_ACCESS_KEY ?? (process.env.NODE_ENV !== "production" ? "snaplocal" : "")
  const secretAccessKey = process.env.S3_SECRET_KEY ?? (process.env.NODE_ENV !== "production" ? "snaplocalpassword" : "")
  if (!accessKeyId || !secretAccessKey) throw new Error("Object storage credentials are not configured")
  return { endpoint, region: process.env.S3_REGION ?? "us-east-1", forcePathStyle: true, credentials: { accessKeyId, secretAccessKey } }
}

const endpoint = process.env.S3_ENDPOINT ?? "http://127.0.0.1:9000"
const publicEndpoint = process.env.S3_PUBLIC_ENDPOINT ?? endpoint
const bucket = process.env.S3_BUCKET ?? "snap-skills"
const client = () => new S3Client(config(endpoint))
const publicClient = () => new S3Client(config(publicEndpoint))

export async function uploadSkill(key: string, content: string) {
  await client().send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: content, ContentType: "text/markdown; charset=utf-8" }))
}
export async function removeSkillObject(key: string) {
  await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
}
export async function readSkillObject(key: string) {
  const result = await client().send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!result.Body) throw new Error("Skill object is empty")
  return result.Body.transformToString()
}
export async function presignSkill(key: string) {
  return getSignedUrl(publicClient(), new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn: 300 })
}
export async function ensureBucket() {
  try { await client().send(new HeadBucketCommand({ Bucket: bucket })) }
  catch (error) {
    const status = (error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode
    if (status !== 404) throw error
    await client().send(new CreateBucketCommand({ Bucket: bucket }))
  }
}
