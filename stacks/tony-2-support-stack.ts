import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { join } from 'path'
import { SupportLambdaEnv } from '../lib/support-lambda/supportLambda'
import { MAIN_STACK_ID } from '../bin/tony-2'

export type SupportStackProps = cdk.StackProps & {
  backupsBucketName: string
}

export class Tony2SupportStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SupportStackProps) {
    super(scope, id, props)

    const webAssetsBucket = new cdk.aws_s3.Bucket(this, 'webAssets', {
      versioned: false,
      bucketName: `${MAIN_STACK_ID.toLowerCase()}-web-assets`,
    })

    const webAssetsCache = new cdk.aws_cloudfront.Distribution(
      this,
      'webAssets',
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(webAssetsBucket),
        },
      }
    )

    const backupsBucket = cdk.aws_s3.Bucket.fromBucketName(
      this,
      'backups',
      props.backupsBucketName
    )

    const lambdaEnv: SupportLambdaEnv = {
      DESTINATION_S3_BUCKET_NAME: webAssetsBucket.bucketName,
      WEB_ASSETS_CACHE_ID: webAssetsCache.distributionId,
    }

    const supportLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      's3Support',
      {
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        entry: join(__dirname, '../lib/support-lambda/supportLambda.ts'),
        handler: 'handler',
        environment: lambdaEnv,
      }
    )

    const copyFileQueue = new cdk.aws_sqs.Queue(this, 'copyAssets', {
      queueName: `${MAIN_STACK_ID}-copy-assets`,
    })

    webAssetsBucket.grantWrite(supportLambda)

    webAssetsCache.grantCreateInvalidation(supportLambda)

    backupsBucket.grantRead(supportLambda)
    backupsBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(supportLambda)
    )
  }
}
