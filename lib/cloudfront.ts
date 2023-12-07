import {
  CloudFrontClient,
  CreateInvalidationCommand,
} from '@aws-sdk/client-cloudfront'

const client = new CloudFrontClient()

export const invalidatePaths = async (paths: string[]) => {
  const cmd = new CreateInvalidationCommand({
    DistributionId: process.env.WEB_ASSETS_CACHE_ID,
    InvalidationBatch: {
      Paths: {
        Quantity: paths.length,
        Items: paths,
      },
      CallerReference: Date.now().toString(),
    },
  })

  await client.send(cmd)
}
