import { join } from 'path'
import { putFile } from '../s3'
import { getS3FriendlyDate } from '../util'
import { getYoutubePlaylistItems } from '../youtube'
import { SHEETS, getRows, rowToTrack, rowToVideo } from '../googleSheets'
import {
  getMyPlaylists,
  getPlaylistItems,
  getYearFromPlaylistName,
  setAccessToken,
} from '../spotify'

export default async function () {
  const filesToSave: Array<{
    name: string
    data: string
  }> = []

  console.log('  > getYoutubePlaylistItems()')
  const youtubeVideos = await getYoutubePlaylistItems()
  filesToSave.push({
    name: 'youtube-playlist-items.json',
    data: JSON.stringify(youtubeVideos, null, 2),
  })

  console.log('  > getRows(missing-tracks)')
  const missingTrackRows = await getRows(
    SHEETS.MISSING_TRACKS.NAME,
    SHEETS.MISSING_TRACKS.RANGES.ALL_ROWS
  )
  const missingTracks = missingTrackRows.map((r) => rowToTrack(r))
  filesToSave.push({
    name: 'spreadsheet-missing-tracks.json',
    data: JSON.stringify(missingTracks, null, 2),
  })

  console.log('  > getRows(parsed-youtube-videos)')
  const parsedVideoRows = await getRows(
    SHEETS.PARSED_VIDEOS.NAME,
    SHEETS.PARSED_VIDEOS.RANGES.ALL_ROWS
  )
  const parsedVideos = parsedVideoRows.map((r) => rowToVideo(r))
  filesToSave.push({
    name: 'spreadsheet-parsed-youtube-videos.json',
    data: JSON.stringify(parsedVideos, null, 2),
  })

  const spotifyPlaylists: Array<{
    id: string
    name: string
    trackIds: string[]
  }> = []
  await setAccessToken()
  const allSpotifyPlaylists = await getMyPlaylists()
  for (const playlist of allSpotifyPlaylists) {
    const year = getYearFromPlaylistName(playlist.name)
    if (year === null) {
      continue
    }

    const items = await getPlaylistItems(playlist.id)
    spotifyPlaylists.push({
      id: playlist.id,
      name: playlist.name,
      trackIds: items.map((i) => i.track.id),
    })
  }
  filesToSave.push({
    name: 'spotify-playlists.json',
    data: JSON.stringify(spotifyPlaylists, null, 2),
  })

  const s3Dir = getS3FriendlyDate(new Date())
  await Promise.all(
    filesToSave.map(async (f) => {
      const fileName = join(s3Dir, f.name)
      await putFile(fileName, f.data)
    })
  )

  return {
    youtubeVideos,
    parsedVideos,
    missingTracks,
    spotifyPlaylists,
  }
}
