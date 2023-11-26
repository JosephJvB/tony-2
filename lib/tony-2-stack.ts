import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'

export class Tony2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const backupsBucket = new cdk.aws_s3.Bucket(this, 'backups', {
      versioned: false,
      bucketName: `${id}-backups`,
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
      // run weekly, tuesday, 9am
      // cron(0 9 ? * TUE *)
      schedule: cdk.aws_events.Schedule.cron({
        weekDay: 'TUE',
        hour: '9',
        minute: '0',
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
      handler: 'index.handler',
      events: [],
      environment: {
        GOOGLE_CLIENT_EMAIL_SSM: googleClientEmail.parameterName,
        GOOGLE_PRIVATE_KEY_SSM: googlePrivateKey.parameterName,
        S3_BUCKET: backupsBucket.bucketName,
        SPOTIFY_CLIENT_ID_SSM: spotifyClientId.parameterName,
        SPOTIFY_SECRET_SSM: spotifySecret.parameterName,
        SPOTIFY_SPOTIFY_REFRESH_TOKEN_SSM_SSM:
          spotifyRefreshToken.parameterName,
        YOUTUBE_API_KEY_SSM: youtubeApiKey.parameterName,
      },
    })

    googleClientEmail.grantRead(daKingOfDaHighway)
    googlePrivateKey.grantRead(daKingOfDaHighway)
    spotifyClientId.grantRead(daKingOfDaHighway)
    spotifySecret.grantRead(daKingOfDaHighway)
    spotifyRefreshToken.grantRead(daKingOfDaHighway)
    youtubeApiKey.grantRead(daKingOfDaHighway)
    backupsBucket.grantWrite(daKingOfDaHighway)
    cronEvent.addTarget(
      new cdk.aws_events_targets.LambdaFunction(daKingOfDaHighway)
    )
  }
}
