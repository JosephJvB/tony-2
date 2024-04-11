import {
  PLAYLIST_DESCRIPTION,
  SpotifyTrack,
  addPlaylistItems,
  createPlaylist,
  getYearFromPlaylistName,
  updatePlaylistDescription,
} from '../../spotify'
import { LoadedSpotifyPlaylist } from './getData'
import { FoundTrack } from './getTrackDiff'

export default async function (
  nextTracks: FoundTrack[],
  spotifyPlaylists: LoadedSpotifyPlaylist[]
) {
  const nextTracksByYear = new Map<number, SpotifyTrack[]>()
  nextTracks.forEach((t) => {
    const soFar = nextTracksByYear.get(t.year) ?? []
    nextTracksByYear.set(t.year, [...soFar, t])
  })

  console.log('  >', nextTracksByYear.size, 'playlists to update')

  const playlistByYear = new Map<number, LoadedSpotifyPlaylist>()
  spotifyPlaylists.forEach((p) => {
    const y = getYearFromPlaylistName(p.name)
    if (y) {
      playlistByYear.set(y, p)
    }
  })

  for (const [year, nextTracks] of nextTracksByYear.entries()) {
    const existingPlaylist = playlistByYear.get(year)

    let playlistId = existingPlaylist?.id
    let playlistDescription = existingPlaylist?.description
    const existingTrackIds = new Set(existingPlaylist?.trackIds ?? [])

    if (!existingPlaylist) {
      console.log('  > creating playlist for year', year)
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

    console.log('  > playlist', year, 'has', existingTrackIds.size, 'tracks')
    const toAdd = [
      ...new Set(
        nextTracks.filter((t) => !existingTrackIds.has(t.id)).map((t) => t.id)
      ),
    ]
    console.log('  > adding', toAdd.length, 'tracks to playlist', year)

    if (toAdd.length) {
      await addPlaylistItems(playlistId, toAdd)
    }

    if (playlistDescription !== PLAYLIST_DESCRIPTION) {
      await updatePlaylistDescription(playlistId, PLAYLIST_DESCRIPTION)
    }
  }
}
