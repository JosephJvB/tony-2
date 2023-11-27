import * as spotifyLookups from '../../lambda/tasks/spotifyLookups'
import * as spotify from '../../lambda/spotify'
import {
  createBestTrack,
  createList,
  createMissingTrack,
  createSpotifyTrack,
} from '../factories'

describe('spotifyLookups.ts', () => {
  // jest.spyOn(console, 'log').mockImplementation(jest.fn())
  const getByBatchSpy = jest.spyOn(spotifyLookups, 'getByBatch')
  const findTracksSpy = jest.spyOn(spotifyLookups, 'findTracks')
  const getTracksSpy = jest
    .spyOn(spotify, 'getTracks')
    .mockImplementation(jest.fn())
  const findTrackSpy = jest
    .spyOn(spotify, 'findTrack')
    .mockImplementation(jest.fn())

  // hard 2 mock
  describe('#spotifyLookups.default', () => {
    it('videoTracks x0, sheetTracks x0, byBatch x0, byFind x0', async () => {
      const videoTracksConfig = {
        byBatch: 0,
        byFind: 0,
        total: 0,
      }
      const sheetTracksConfig = {
        byBatch: 0,
        byFind: 0,
        total: 0,
      }
      const videoTracks = createList(createBestTrack, videoTracksConfig.total)
      const sheetTracks = createList(
        createMissingTrack,
        sheetTracksConfig.total
      )

      const byBatch: spotify.SpotifyTrack[] = []
      const byFind: spotify.SpotifyTrack[] = []
      videoTracks.forEach((t, i) => {
        if (i < videoTracksConfig.byBatch) {
          const st = createSpotifyTrack(byBatch.length)
          t.spotifyId = st.id
          byBatch.push(st)
        }
        if (i < videoTracksConfig.byFind) {
          byFind.push(createSpotifyTrack(byFind.length))
        }
      })
      sheetTracks.forEach((t, i) => {
        if (i < sheetTracksConfig.byBatch) {
          const st = createSpotifyTrack(byBatch.length)
          t.spotify_ids = st.id
          byBatch.push(st)
        }
      })

      // const results = await
    })
  })
})
