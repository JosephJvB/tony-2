import { setAccessToken, setBasicToken } from './spotify'
import extractTracks from './tasks/extractTracks'
import getData from './tasks/getData'
import getDiff from './tasks/getDiff'
import spotifyLookups from './tasks/spotifyLookups'
import updatePlaylists from './tasks/updatePlaylists'
import updateSpreadsheets from './tasks/updateSpreadsheets'

export const handler = async () => {
  try {
    // 1. auth
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
    const fromVideoDescriptions = extractTracks(data.toParse)
    console.log('  >', fromVideoDescriptions.length, 'youtube tracks to find')

    // 4. find tracks in spotify
    const maps = await spotifyLookups(fromVideoDescriptions, data.missingTracks)

    // 5. get diff
    const diff = getDiff(fromVideoDescriptions, data.missingTracks, maps)

    // 6. update playlists
    await updatePlaylists(diff.found, data.spotifyPlaylists)

    // 7. update spreadsheets [parsedVideos, missing]
    await updateSpreadsheets(data.allVideos, diff.missing)
  } catch (e) {
    console.error('handler failed')
    console.error(e)
  }
}
