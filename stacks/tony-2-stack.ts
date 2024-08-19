import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { join } from 'path'
import { LambdaEnv } from '../lib/tony2-lambda/tony2Lambda'

export class Tony2Stack extends cdk.Stack {
  public readonly backupsBucket: cdk.aws_s3.Bucket

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    this.backupsBucket = new cdk.aws_s3.Bucket(this, 'backups', {
      versioned: false,
      bucketName: `${id.toLowerCase()}-backups`,
      blockPublicAccess: cdk.aws_s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'expire-old-backups',
          expiration: cdk.Duration.days(300),
        },
      ],
    })

    const cronEvent = new cdk.aws_events.Rule(this, 'dailyEvent', {
      // weekly track roundup videos released on a monday,
      // run weekly, tuesday, 7am
      // cron(0 7? * TUE *)
      // schedule: cdk.aws_events.Schedule.cron({
      //   weekDay: 'TUE',
      //   hour: '7',
      //   minute: '0',
      // }),
      // but i'm gonna have it run daily so it'll handle failures better
      // 8:15 so maybe I can listen to new songs on my bike to work
      schedule: cdk.aws_events.Schedule.cron({
        hour: '8',
        minute: '15',
      }),
    })

    const googlePrivateKey =
      cdk.aws_ssm.StringParameter.fromStringParameterName(
        this,
        'GooglePrivateKeyParam',
        `/${id}/google/private-key`
      )
    const googleClientEmail =
      cdk.aws_ssm.StringParameter.fromStringParameterName(
        this,
        'GoogleClientEmailParam',
        `/${id}/google/client-email`
      )
    const youtubeApiKey = cdk.aws_ssm.StringParameter.fromStringParameterName(
      this,
      'YoutubeApiKeyParam',
      `/${id}/youtube/api-key`
    )
    const spotifyClientId = cdk.aws_ssm.StringParameter.fromStringParameterName(
      this,
      'SpotifyClientIdParam',
      `/${id}/spotify/client-id`
    )
    const spotifySecret = cdk.aws_ssm.StringParameter.fromStringParameterName(
      this,
      'SpotifySecretParam',
      `/${id}/spotify/secret`
    )
    const spotifyRefreshToken =
      cdk.aws_ssm.StringParameter.fromStringParameterName(
        this,
        'SpotifyRefreshTokenParam',
        `/${id}/spotify/refresh-token`
      )

    const lambdaEnv: LambdaEnv = {
      S3_BUCKET: this.backupsBucket.bucketName,
      GOOGLE_CLIENT_EMAIL_SSM: googleClientEmail.parameterName,
      GOOGLE_PRIVATE_KEY_SSM: googlePrivateKey.parameterName,
      SPOTIFY_CLIENT_ID_SSM: spotifyClientId.parameterName,
      SPOTIFY_SECRET_SSM: spotifySecret.parameterName,
      SPOTIFY_REFRESH_TOKEN_SSM: spotifyRefreshToken.parameterName,
      YOUTUBE_API_KEY_SSM: youtubeApiKey.parameterName,
    }

    const daKingOfDaHighway = new cdk.aws_lambda_nodejs.NodejsFunction(
      this,
      'kodh',
      {
        memorySize: 1024,
        timeout: cdk.Duration.minutes(3),
        runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
        entry: join(__dirname, '../lib/tony2-lambda/tony2Lambda.ts'),
        handler: 'handler',
        environment: lambdaEnv,
      }
    )

    googleClientEmail.grantRead(daKingOfDaHighway)
    googlePrivateKey.grantRead(daKingOfDaHighway)
    spotifyClientId.grantRead(daKingOfDaHighway)
    spotifySecret.grantRead(daKingOfDaHighway)
    spotifyRefreshToken.grantRead(daKingOfDaHighway)
    youtubeApiKey.grantRead(daKingOfDaHighway)
    this.backupsBucket.grantWrite(daKingOfDaHighway)
    cronEvent.addTarget(
      new cdk.aws_events_targets.LambdaFunction(daKingOfDaHighway)
    )
  }
}
