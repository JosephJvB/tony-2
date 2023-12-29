import { setAccessToken, setBasicToken } from '../spotify'
import { loadSsmParams } from '../ssm'
import extractTracks from './tasks/extractTracks'
import getData from './tasks/getData'
import getTrackDiff from './tasks/getTrackDiff'
import spotifyLookups from './tasks/spotifyLookups'
import updatePlaylists from './tasks/updatePlaylists'
import updateSpreadsheets from './tasks/updateSpreadsheets'

export type LambdaEnv = {
  GOOGLE_CLIENT_EMAIL_SSM: string
  GOOGLE_PRIVATE_KEY_SSM: string
  S3_BUCKET: string
  SPOTIFY_CLIENT_ID_SSM: string
  SPOTIFY_SECRET_SSM: string
  SPOTIFY_REFRESH_TOKEN_SSM: string
  YOUTUBE_API_KEY_SSM: string
}

export const handler = async () => {
  try {
    // 1. load credentials
    //    ssm
    await loadSsmParams()
    //    spotify
    await setBasicToken()
    await setAccessToken()

    /**
     * 2. get data & save backups to s3
     *    Spreadsheet: already parsed youtube videos
     *    Spreadsheet: missing tracks
     *    YoutubeAPI: playlist items
     *    SpotifyAPI: playlists & items
     */
    const data = await getData()

    const hasChanges = !data.toParse.length && !data.missingTracksToFind.length
    if (!hasChanges) {
      console.warn('no videos & no missing tracks to find, exiting early')
      return
    }

    // 3. parse youtube video descriptions
    const extracted = extractTracks(data.toParse)
    console.log('  >', extracted.nextTracks.length, 'youtube tracks to find')

    // 4. find tracks in spotify
    const maps = await spotifyLookups(
      extracted.nextTracks,
      data.missingTracksToFind
    )

    // 5. get diff
    const diff = getTrackDiff(extracted.nextTracks, data.allMissingTracks, maps)

    // 6. update playlists
    await updatePlaylists(diff.found, data.spotifyPlaylists)

    // 7. update spreadsheets [parsedVideos, missing]
    await updateSpreadsheets(
      [...data.parsedVideos, ...extracted.nextVideoRows],
      diff.missing
    )
  } catch (e) {
    console.error('handler failed')
    console.error(e)
  }
}
