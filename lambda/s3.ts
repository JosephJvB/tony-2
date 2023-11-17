import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

export const putFile = async (filePath: string, contents: string) => {
  const client = new S3Client()

  const putFileCmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: filePath,
    Body: contents,
  })

  await client.send(putFileCmd)
}