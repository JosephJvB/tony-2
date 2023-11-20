import {
  SpotifyPlaylist,
  SpotifyTrack,
  addPlaylistItems,
  createPlaylist,
  getYearFromPlaylistName,
} from './spotify'
import extractTracks from './tasks/extractTracks'
import getData from './tasks/getData'
import spotifyLookups from './tasks/spotifyLookups'

export const handler = async () => {
  try {
    const data = await getData()

    const parsedVideoIds = new Set<string>()
    data.parsedVideos.forEach((v) => parsedVideoIds.add(v.id))

    const toExtract = data.youtubeVideos.filter(
      (v) => !parsedVideoIds.has(v.id)
    )
    console.log('  >', toExtract.length, 'best track videos to pull from')

    const fromVideoDescriptions = extractTracks(toExtract)
    console.log('  >', fromVideoDescriptions.length, 'youtube tracks to find')

    const fromSpreadsheet = data.missingTracks.filter((t) => !!t.spotify_id)
    console.log(
      '  >',
      fromSpreadsheet.length,
      'manually added spotify ids from spreadsheet'
    )

    const maps = await spotifyLookups(fromVideoDescriptions, fromSpreadsheet)

    // this needs to move out to a task
    const byYear = new Map<number, SpotifyTrack[]>()
    fromVideoDescriptions.forEach((t) => {
      const found =
        (t.spotifyId && maps.spotifyIdMap.get(t.spotifyId)) ??
        maps.customIdMap.get(t.id)
      if (!found) {
        return
      }

      const soFar = byYear.get(t.year) ?? []
      byYear.set(t.year, [...soFar, found])
    })

    fromSpreadsheet.forEach((t) => {
      const found =
        (t.spotify_id && maps.spotifyIdMap.get(t.spotify_id)) ??
        maps.customIdMap.get(t.id)
      if (!found) {
        return
      }

      const year = new Date(t.date).getUTCFullYear()

      const soFar = byYear.get(year) ?? []
      byYear.set(year, [...soFar, found])
    })

    for (const [year, tracks] of byYear.entries()) {
      const loadedPlaylist = data.spotifyPlaylists.find(
        (p) => getYearFromPlaylistName(p.name) == year
      )
      let playlistId = loadedPlaylist?.id
      const existingTrackIds = new Set<string>(loadedPlaylist?.trackIds ?? [])

      if (!loadedPlaylist) {
        const createdPaylist = await createPlaylist(year)
        playlistId = createdPaylist.id
      }
      if (!playlistId) {
        const vars = JSON.stringify({
          year,
        })
        throw new Error(`failed to find/create playlistId, ${vars}`)
      }

      const toAdd = [
        ...new Set(
          tracks.filter((t) => !existingTrackIds.has(t.id)).map((t) => t.id)
        ),
      ]
      if (toAdd.length) {
        await addPlaylistItems(playlistId, toAdd)
      }
    }
  } catch (e) {
    console.error('handler failed')
    console.error(e)
  }
}
