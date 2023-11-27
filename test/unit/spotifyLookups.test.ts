import * as spotifyLookups from '../../lambda/tasks/spotifyLookups'
import * as spotify from '../../lambda/spotify'
import {
  createBestTrack,
  createList,
  createMissingTrack,
  createSpotifyTrack,
} from '../factories'

describe('spotifyLookups.ts', () => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn())
  const getByBatchSpy = jest.spyOn(spotifyLookups, 'getByBatch')
  const findTracksSpy = jest.spyOn(spotifyLookups, 'findTracks')
  const getTracksSpy = jest
    .spyOn(spotify, 'getTracks')
    .mockImplementation(jest.fn())
  const findTrackSpy = jest
    .spyOn(spotify, 'findTrack')
    .mockImplementation(jest.fn())

  describe('#spotifyLookups.default', () => {
    it('nextTracks x0, missingTracks x0, byBatch x0, byFind x0', async () => {
      const numNextTracks = 0
      const numMissingTracks = 0
      const numByBatch = 0
      const numByFind = 0

      const nextTracks = createList(createBestTrack, numNextTracks)
      const nextMissingTracks = createList(createMissingTrack, numMissingTracks)
      const foundByBatch = createList(createSpotifyTrack, numByBatch)
      const foundByFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < numByBatch; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: foundByBatch.slice(i, i + 50),
        })
      }
      foundByFind.forEach((t) => {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: '',
            items: [t],
          },
        })
      })

      const result = await spotifyLookups.default(nextTracks, nextMissingTracks)

      expect(result.spotifyIdMap.size).toBe(numByBatch)
      expect(result.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))
      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTrackSpy).toHaveBeenCalledTimes(numByFind)
    })

    it('nextTracks x100, missingTracks x5, byBatch x0, byFind x105', async () => {
      const numNextTracks = 100
      const numMissingTracks = 5
      const numByBatch = 0
      const numByFind = 105

      const nextTracks = createList(createBestTrack, numNextTracks)
      const nextMissingTracks = createList(createMissingTrack, numMissingTracks)
      const foundByBatch = createList(createSpotifyTrack, numByBatch)
      const foundByFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < numByBatch; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: foundByBatch.slice(i, i + 50),
        })
      }
      foundByFind.forEach((t) => {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: '',
            items: [t],
          },
        })
      })

      const result = await spotifyLookups.default(nextTracks, nextMissingTracks)

      expect(result.spotifyIdMap.size).toBe(numByBatch)
      expect(result.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))
      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTrackSpy).toHaveBeenCalledTimes(numByFind)
    })
  })
})
