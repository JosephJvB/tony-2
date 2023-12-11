import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { join } from 'path'
import { MAIN_STACK_ID } from '../bin/tony-2'
import { WebAssetsLambdaEnv } from '../lib/web-assets-lambda/webAssetsLambda'

export type SupportStackProps = cdk.StackProps & {
  backupsBucketName: string
}

export class Tony2WebAssetsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SupportStackProps) {
    super(scope, id, props)

    const webAssetsBucket = new cdk.aws_s3.Bucket(this, 'webAssetsBucket', {
      versioned: false,
      bucketName: `${MAIN_STACK_ID.toLowerCase()}-web-assets`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const webAssetsCache = new cdk.aws_cloudfront.Distribution(
      this,
      'webAssetsCache',
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

    const lambdaEnv: WebAssetsLambdaEnv = {
      DESTINATION_S3_BUCKET_NAME: webAssetsBucket.bucketName,
      CLOUDFRONT_CACHE_ID: webAssetsCache.distributionId,
    }

    const copyWebAssetsLambda = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'copyWebAssetsLambda',
      {
        memorySize: 256,
        timeout: cdk.Duration.seconds(10),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        entry: join(__dirname, '../lib/web-assets-lambda/webAssetsLambda.ts'),
        handler: 'handler',
        environment: lambdaEnv,
      }
    )

    webAssetsBucket.grantWrite(copyWebAssetsLambda)

    webAssetsCache.grantCreateInvalidation(copyWebAssetsLambda)

    backupsBucket.grantRead(copyWebAssetsLambda)
    backupsBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(copyWebAssetsLambda)
    )
  }
}
