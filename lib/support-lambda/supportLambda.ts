import { S3Event } from 'aws-lambda'
import { basename, join } from 'path'
import { copyFile } from '../s3'

export type SupportLambdaEnv = {
  DESTINATION_S3_BUCKET_NAME: string
  WEB_ASSETS_CACHE_ID: string
}

export const PATH_BASE = 'json/'

export const handler = async (event: S3Event) => {
  try {
    console.log(JSON.stringify(event))

    for (const r of event.Records) {
      const source = `s3://${join(r.s3.bucket.name, r.s3.object.key)}`

      const destination = {
        bucket: process.env.DESTINATION_S3_BUCKET_NAME,
        key: join(PATH_BASE, basename(r.s3.object.key)),
      }

      console.log(
        'copy:',
        source,
        '>',
        `s3://${join(destination.bucket, destination.key)}`
      )
      await copyFile(source, destination, {
        ACL: 'public-read',
      })
    }
  } catch (e) {
    console.error(e)
    console.error('handler failed')
  }
}
