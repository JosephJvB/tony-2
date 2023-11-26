import {
  PLAYLIST_DESCRIPTION,
  SpotifyTrack,
  addPlaylistItems,
  createPlaylist,
  getYearFromPlaylistName,
  updatePlaylistDescription,
} from '../spotify'
import { LoadedSpotifyPlaylist } from './getData'
import { FoundTrack } from './getTrackDiff'

export default async function (
  nextTracks: FoundTrack[],
  spotifyPlaylists: LoadedSpotifyPlaylist[]
) {
  const trackMap = new Map<number, SpotifyTrack[]>()
  nextTracks.forEach((t) => {
    const soFar = trackMap.get(t.year) ?? []
    trackMap.set(t.year, [...soFar, t])
  })

  const playlistMap = new Map<number, LoadedSpotifyPlaylist>()
  spotifyPlaylists.forEach((p) => {
    const y = getYearFromPlaylistName(p.name)
    if (y) {
      playlistMap.set(y, p)
    }
  })

  for (const [year, tracks] of trackMap.entries()) {
    const loadedPlaylist = playlistMap.get(year)
    let playlistId = loadedPlaylist?.id
    let playlistDescription = loadedPlaylist?.description

    if (!loadedPlaylist) {
      const createdPaylist = await createPlaylist(year)
      playlistId = createdPaylist.id
      playlistDescription = createdPaylist.description
    }

    if (!playlistId) {
      const vars = JSON.stringify({
        year,
      })
      throw new Error(`failed to find/create playlistId, ${vars}`)
    }

    const existingTrackIds = new Set<string>(loadedPlaylist?.trackIds ?? [])
    const toAdd = [
      ...new Set(
        tracks.filter((t) => !existingTrackIds.has(t.id)).map((t) => t.id)
      ),
    ]
    if (toAdd.length) {
      await addPlaylistItems(playlistId, toAdd)
    }

    if (playlistDescription !== PLAYLIST_DESCRIPTION) {
      await updatePlaylistDescription(playlistId, PLAYLIST_DESCRIPTION)
    }
  }
}
