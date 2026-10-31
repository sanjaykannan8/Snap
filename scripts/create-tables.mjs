import { CreateTableCommand, DescribeTableCommand, DynamoDBClient, ResourceInUseException } from "@aws-sdk/client-dynamodb";

const endpoint = process.env.DYNAMODB_ENDPOINT ?? "http://127.0.0.1:8000";
const tableName = process.env.DYNAMODB_TABLE ?? "Snap";
const client = new DynamoDBClient({
  endpoint,
  region: process.env.DYNAMODB_REGION ?? "us-east-1",
  credentials: { accessKeyId: "local", secretAccessKey: "local" },
});

try {
  await client.send(new DescribeTableCommand({ TableName: tableName }));
  console.log(`Table ${tableName} already exists.`);
} catch (error) {
  if (error.name !== "ResourceNotFoundException") throw error;
  try {
    await client.send(new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
      ],
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    }));
    console.log(`Created table ${tableName}.`);
  } catch (createError) {
    if (!(createError instanceof ResourceInUseException)) throw createError;
  }
}
