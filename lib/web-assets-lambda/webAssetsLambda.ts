import { S3Event, S3EventRecord, SQSEvent } from 'aws-lambda'
import { basename, join } from 'path'
import { copyFile } from '../s3'
import { invalidatePaths } from '../cloudfront'

export type WebAssetsLambdaEnv = {
  DESTINATION_S3_BUCKET_NAME: string
  CLOUDFRONT_CACHE_ID: string
}

export const PATH_BASE = 'json/'

export const handler = async (event: S3Event) => {
  try {
    console.log(JSON.stringify(event))
    console.log('event.Records.length', event.Records.length)

    const cloudfrontPaths: string[] = []
    for (const eventRecord of event.Records) {
      const source = `/${join(
        eventRecord.s3.bucket.name,
        eventRecord.s3.object.key
      )}`

      const destination = {
        bucket: process.env.DESTINATION_S3_BUCKET_NAME,
        key: join(PATH_BASE, basename(eventRecord.s3.object.key)),
      }

      console.log(
        'copy:',
        `s3:/${source}`,
        '>',
        `s3://${join(destination.bucket, destination.key)}`
      )

      console.log({
        source,
        destination,
      })
      await copyFile(source, destination, {
        ACL: 'public-read',
      })

      cloudfrontPaths.push(destination.key)
    }

    console.log({
      cloudfrontPaths,
    })
    await invalidatePaths(cloudfrontPaths)
  } catch (e) {
    console.error(e)
    console.error('handler failed')
  }
}
