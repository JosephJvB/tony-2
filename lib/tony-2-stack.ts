import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class Tony2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const backupsBucket = new cdk.aws_s3.Bucket(this, 'backups', {
      versioned: false,
      bucketName: 'tony2-backups',
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
    })

    const cronEvent = new cdk.aws_events.Rule(this, 'dailyEvent', {
      // weekly track roundup videos released on a monday,
      // run weekly, tuesday, 9am
      // cron(0 9 ? * TUE *)
      schedule: cdk.aws_events.Schedule.cron({
        weekDay: 'TUE',
        hour: '9',
        minute: '0',
      }),
    })

    // lets try do this all all in one lambda I guess
    // can split it later
    // get youtube playlist items
    // get spreadsheet rows:
    //  - parsedYoutubeVideos
    //  - missingTracks
    // get spotifyPlaylists & items for valid years
    //  - videos not parsed
    //  - tracks with spotifyId from missingTracks
    const daKingOfDaHighway = new cdk.aws_lambda.Function(this, 'kodh', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      code: cdk.aws_lambda.Code.fromAsset('dist/lambda'),
      handler: 'kodh/index.handler',
      events: [],
      environment: {
        S3_BUCKET: backupsBucket.bucketName,
      },
    })

    backupsBucket.grantWrite(daKingOfDaHighway)
    cronEvent.addTarget(
      new cdk.aws_events_targets.LambdaFunction(daKingOfDaHighway)
    )
  }
}
