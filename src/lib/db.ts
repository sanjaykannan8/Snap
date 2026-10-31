import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, TransactWriteCommand } from "@aws-sdk/lib-dynamodb"

import type { Session } from "@/lib/auth"

const tableName = process.env.DYNAMODB_TABLE ?? "Snap"
const isLocal = Boolean(process.env.DYNAMODB_ENDPOINT)
const client = new DynamoDBClient({
  endpoint: process.env.DYNAMODB_ENDPOINT,
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  ...(isLocal ? { credentials: { accessKeyId: "local", secretAccessKey: "local" } } : {}),
})
const db = DynamoDBDocumentClient.from(client, { marshallOptions: { removeUndefinedValues: true } })

type UserRecord = { PK: string; SK: "PROFILE"; email: string; name: string; passwordHash: string; createdAt: string }
export type StoredSkill = { id: string; name: string; description: string; body?: string; objectKey?: string; createdAt: string }

const userPk = (email: string) => `USER#${email}`
const skillsPk = (email: string) => `USER#${email}`

export async function createUser(input: { email: string; name: string; passwordHash: string }): Promise<Session> {
  const email = input.email.trim().toLowerCase()
  const name = input.name.trim() || email.split("@")[0] || "Snap user"
  await db.send(new PutCommand({
    TableName: tableName,
    Item: { PK: userPk(email), SK: "PROFILE", email, name, passwordHash: input.passwordHash, createdAt: new Date().toISOString() } satisfies UserRecord,
    ConditionExpression: "attribute_not_exists(PK)",
  }))
  return { email, name }
}

export async function getUser(email: string) {
  const result = await db.send(new GetCommand({ TableName: tableName, Key: { PK: userPk(email), SK: "PROFILE" } }))
  return result.Item as UserRecord | undefined
}

export async function listSkills(email: string): Promise<StoredSkill[]> {
  const result = await db.send(new QueryCommand({
    TableName: tableName,
    KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
    ExpressionAttributeValues: { ":pk": skillsPk(email), ":prefix": "SKILL#" },
  }))
  return (result.Items ?? []).map(({ id, name, description, body, objectKey, createdAt }) => ({ id, name, description, body, objectKey, createdAt })) as StoredSkill[]
}

export async function saveSkill(email: string, skill: StoredSkill) {
  await db.send(new PutCommand({
    TableName: tableName,
    Item: { PK: skillsPk(email), SK: `SKILL#${skill.id}`, ...skill },
    ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)",
  }))
  return skill
}

export async function getSkill(email: string, id: string): Promise<StoredSkill | null> {
  const result = await db.send(new GetCommand({ TableName: tableName, Key: { PK: skillsPk(email), SK: `SKILL#${id}` }, ConsistentRead: true }))
  return (result.Item as StoredSkill | undefined) ?? null
}

export async function deleteSkill(email: string, id: string) {
  await db.send(new DeleteCommand({
    TableName: tableName,
    Key: { PK: skillsPk(email), SK: `SKILL#${id}` },
    ConditionExpression: "attribute_exists(PK)",
  }))
}

export type ApiKeyInfo = { id: string; name: string; prefix: string; createdAt: string }

export async function createApiKey(email: string, hash: string, info: ApiKeyInfo) {
  await db.send(new TransactWriteCommand({ TransactItems: [
    { Put: { TableName: tableName, Item: { PK: `APIKEY#${hash}`, SK: "KEY", email, ...info }, ConditionExpression: "attribute_not_exists(PK)" } },
    { Put: { TableName: tableName, Item: { PK: userPk(email), SK: `APIKEY#${info.id}`, hash, ...info }, ConditionExpression: "attribute_not_exists(PK) AND attribute_not_exists(SK)" } },
  ] }))
}

export async function listApiKeys(email: string): Promise<ApiKeyInfo[]> {
  const result = await db.send(new QueryCommand({ TableName: tableName, KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)", ExpressionAttributeValues: { ":pk": userPk(email), ":sk": "APIKEY#" } }))
  return (result.Items ?? []).map(({ id, name, prefix, createdAt }) => ({ id, name, prefix, createdAt })) as ApiKeyInfo[]
}

export async function getApiKeyOwner(hash: string): Promise<string | null> {
  const result = await db.send(new GetCommand({ TableName: tableName, Key: { PK: `APIKEY#${hash}`, SK: "KEY" }, ConsistentRead: true }))
  return typeof result.Item?.email === "string" ? result.Item.email : null
}

export async function revokeApiKey(email: string, id: string) {
  const key = { PK: userPk(email), SK: `APIKEY#${id}` }
  const record = await db.send(new GetCommand({ TableName: tableName, Key: key, ConsistentRead: true }))
  if (typeof record.Item?.hash !== "string") return false
  await db.send(new TransactWriteCommand({ TransactItems: [
    { Delete: { TableName: tableName, Key: key, ConditionExpression: "attribute_exists(PK)" } },
    { Delete: { TableName: tableName, Key: { PK: `APIKEY#${record.Item.hash}`, SK: "KEY" }, ConditionExpression: "email = :email", ExpressionAttributeValues: { ":email": email } } },
  ] }))
  return true
}
