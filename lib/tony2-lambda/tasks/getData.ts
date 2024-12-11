import { join } from 'path'
import { putFile } from '../../s3'
import { getS3FriendlyDate } from '../../util'
import { getYoutubePlaylistItems } from '../../youtube'
import { SHEETS, getRows, rowToTrack, rowToVideo } from '../../googleSheets'
import {
  getMyPlaylists,
  getPlaylistItems,
  getYearFromPlaylistName,
} from '../../spotify'

export type LoadedSpotifyPlaylist = {
  id: string
  name: string
  description: string
  trackIds: string[]
}

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
  const allMissingTracks = missingTrackRows.map((r) => rowToTrack(r))
  filesToSave.push({
    name: 'spreadsheet-missing-tracks.json',
    data: JSON.stringify(allMissingTracks, null, 2),
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

  const spotifyPlaylists: Array<LoadedSpotifyPlaylist> = []
  console.log('  > getMyPlaylists()')
  const allSpotifyPlaylists = await getMyPlaylists()
  console.log('  > found', allSpotifyPlaylists.length, 'spotify playlists')
  console.log(
    'is there a null one?',
    allSpotifyPlaylists.filter((p) => !p).length
  )
  for (const playlist of allSpotifyPlaylists) {
    const year = getYearFromPlaylistName(playlist.name)
    if (year === null) {
      continue
    }

    const items = await getPlaylistItems(playlist.id)
    spotifyPlaylists.push({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      trackIds: items.map((i) => i.track.id),
    })
  }
  console.log('  > loaded tracks for', spotifyPlaylists.length, 'playlists')
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

  const beenParsed = new Set(parsedVideos.map((v) => v.id))
  const toParse = youtubeVideos.filter((v) => !beenParsed.has(v.id))

  const missingTracksToFind = allMissingTracks.filter((t) => !!t.spotify_ids)

  return {
    parsedVideos,
    toParse,
    allMissingTracks,
    missingTracksToFind,
    spotifyPlaylists,
  }
}
