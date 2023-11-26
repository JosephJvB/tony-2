import { setAccessToken, setBasicToken } from './spotify'
import { loadSsmParams } from './ssm'
import extractTracks from './tasks/extractTracks'
import getData from './tasks/getData'
import getTrackDiff from './tasks/getTrackDiff'
import spotifyLookups from './tasks/spotifyLookups'
import updatePlaylists from './tasks/updatePlaylists'
import updateSpreadsheets from './tasks/updateSpreadsheets'

export const handler = async () => {
  try {
    // 1. load credentials
    await loadSsmParams()
    // spotify
    await setBasicToken()
    await setAccessToken()

    /**
     * get data:
     * - Spreadsheet: already parsed youtube videos
     * - Spreadsheet: missing tracks
     * - YoutubeAPI: playlist items
     * - SpotifyAPI: playlist items
     */
    const data = await getData()

    // 3. parse youtube video descriptions
    const extracted = extractTracks(data.toParse)
    console.log('  >', extracted.nextTracks.length, 'youtube tracks to find')

    // 4. find tracks in spotify
    const maps = await spotifyLookups(extracted.nextTracks, data.missingTracks)

    // 5. get diff
    const diff = getTrackDiff(extracted.nextTracks, data.missingTracks, maps)

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
