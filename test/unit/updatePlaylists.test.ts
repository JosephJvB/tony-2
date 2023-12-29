import * as spotify from '../../lib/spotify'
import * as updatePlaylists from '../../lib/tony2-lambda/tasks/updatePlaylists'
import {
  createFoundTrack,
  createList,
  createLoadedSpotifyPlaylist,
  createSpotifyPlaylist,
} from '../factories'

describe('updatePlaylists.ts', () => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn())
  const createPlaylistSpy = jest
    .spyOn(spotify, 'createPlaylist')
    .mockImplementation(jest.fn())
  const addPlaylistItemsSpy = jest
    .spyOn(spotify, 'addPlaylistItems')
    .mockImplementation(jest.fn())
  const updatePlaylistDescriptionSpy = jest
    .spyOn(spotify, 'updatePlaylistDescription')
    .mockImplementation(jest.fn())

  describe('#updatePlaylists.default', () => {
    it('handles empty inputs', async () => {
      const foundTracks = createList(createFoundTrack, 0)
      const playlists = createList(createLoadedSpotifyPlaylist, 0, 0)

      await updatePlaylists.default(foundTracks, playlists)

      expect(createPlaylistSpy).toHaveBeenCalledTimes(0)
      expect(addPlaylistItemsSpy).toHaveBeenCalledTimes(0)
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledTimes(0)
    })

    it('updates latest playlist only', async () => {
      const currentYear = new Date().getFullYear()
      const foundTracks = createList(createFoundTrack, 11, {
        year: currentYear,
      })
      const playlists = createList(createLoadedSpotifyPlaylist, 5, 100)

      const latestPlaylist = playlists[playlists.length - 1]
      latestPlaylist.name = `${spotify.PLAYLIST_NAME_PREFIX}${currentYear}`

      await updatePlaylists.default(foundTracks, playlists)

      const foundIds = foundTracks.map((t) => t.id)
      expect(createPlaylistSpy).toHaveBeenCalledTimes(0)
      expect(addPlaylistItemsSpy).toHaveBeenCalledTimes(1)
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        latestPlaylist.id,
        foundIds
      )
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledTimes(0)
    })

    it('updates latest playlist only, excludes duplicate ids', async () => {
      const currentYear = new Date().getFullYear()
      const foundTracks = createList(createFoundTrack, 11, {
        year: currentYear,
      })
      const playlists = createList(createLoadedSpotifyPlaylist, 5, 100)

      const latestPlaylist = playlists[playlists.length - 1]
      latestPlaylist.name = `${spotify.PLAYLIST_NAME_PREFIX}${currentYear}`
      latestPlaylist.trackIds = foundTracks.slice(0, 4).map((t) => t.id)

      await updatePlaylists.default(foundTracks, playlists)

      const foundIds = foundTracks.map((t) => t.id)
      expect(createPlaylistSpy).toHaveBeenCalledTimes(0)
      expect(addPlaylistItemsSpy).toHaveBeenCalledTimes(1)
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        latestPlaylist.id,
        foundIds.slice(4)
      )
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledTimes(0)
    })

    it('updates latest playlist and one track from older playlist', async () => {
      const currentYear = new Date().getFullYear()
      const pastYear = currentYear - 5
      const foundTracks = createList(createFoundTrack, 11, {
        year: currentYear,
      })
      const pastTracks = createList(createFoundTrack, 2, {
        year: pastYear,
      })
      const playlists = createList(createLoadedSpotifyPlaylist, 5, 100)

      const latestPlaylist = playlists[playlists.length - 1]
      latestPlaylist.name = `${spotify.PLAYLIST_NAME_PREFIX}${currentYear}`

      const pastPlaylist = playlists[0]
      pastPlaylist.name = `${spotify.PLAYLIST_NAME_PREFIX}${pastYear}`
      pastPlaylist.description = 'oops description is out of date!'

      await updatePlaylists.default([...pastTracks, ...foundTracks], playlists)

      const foundIds = foundTracks.map((t) => t.id)
      const pastIds = pastTracks.map((t) => t.id)
      expect(createPlaylistSpy).toHaveBeenCalledTimes(0)
      expect(addPlaylistItemsSpy).toHaveBeenCalledTimes(2)
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(pastPlaylist.id, pastIds)
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        latestPlaylist.id,
        foundIds
      )
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledTimes(1)
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledWith(
        pastPlaylist.id,
        spotify.PLAYLIST_DESCRIPTION
      )
    })

    it('creates two new playlists', async () => {
      const newYear1 = new Date().getFullYear()
      const newYear2 = newYear1 + 1
      const oldYear = newYear1 - 1
      const p1Tracks = createList(createFoundTrack, 100, {
        year: newYear1,
      })
      const p2Tracks = createList(createFoundTrack, 100, {
        year: newYear2,
      })
      const existingTracks = createList(createFoundTrack, 11, {
        year: oldYear,
      })
      const allTracks = [...p1Tracks, ...p2Tracks, ...existingTracks]

      const oldPlaylist = createLoadedSpotifyPlaylist(oldYear, 100)

      const newPlaylist1 = createSpotifyPlaylist(newYear1, 0)
      const newPlaylist2 = createSpotifyPlaylist(newYear2, 0)

      createPlaylistSpy.mockResolvedValueOnce(newPlaylist1)
      createPlaylistSpy.mockResolvedValueOnce(newPlaylist2)

      await updatePlaylists.default(allTracks, [oldPlaylist])

      const p1TrackIds = p1Tracks.map((t) => t.id)
      const p2TrackIds = p2Tracks.map((t) => t.id)
      const existingTrackIds = existingTracks.map((t) => t.id)
      expect(createPlaylistSpy).toHaveBeenCalledTimes(2)
      expect(createPlaylistSpy).toHaveBeenCalledWith(newYear1)
      expect(createPlaylistSpy).toHaveBeenCalledWith(newYear2)
      expect(addPlaylistItemsSpy).toHaveBeenCalledTimes(3)
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        newPlaylist1.id,
        p1TrackIds
      )
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        newPlaylist2.id,
        p2TrackIds
      )
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        oldPlaylist.id,
        existingTrackIds
      )
      expect(addPlaylistItemsSpy).toHaveBeenCalledWith(
        oldPlaylist.id,
        existingTrackIds
      )
      expect(updatePlaylistDescriptionSpy).toHaveBeenCalledTimes(0)
    })
  })
})
