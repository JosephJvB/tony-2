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

  describe('#spotifyLookups.default', () => {
    it('videoTracks x0, sheetTracks x0, byBatch x0, byFind x0', async () => {
      const videoTracks = createList(createBestTrack, 0)
      const sheetTracks = createList(createMissingTrack, 0)

      const byBatch = createList(createSpotifyTrack, 0)
      const byFind = createList(createSpotifyTrack, 0)

      for (let i = 0; i < byBatch.length; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      byFind.forEach((t, i) => {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [t],
          },
        })
      })

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(0)
      expect(results.customIdMap.size).toBe(0)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy).toHaveBeenCalledWith([])
      expect(getTracksSpy).toHaveBeenCalledTimes(0)

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy).toHaveBeenCalledWith([])
      expect(findTrackSpy).toHaveBeenCalledTimes(0)
    })
  })
})
