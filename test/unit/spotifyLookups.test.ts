import * as spotifyLookups from '../../lambda/tasks/spotifyLookups'
import * as spotify from '../../lambda/spotify'
import {
  createBestTrack,
  createList,
  createMissingTrack,
  createSpotifyTrack,
} from '../factories'
import { BestTrack } from '../../lambda/tasks/extractTracks'

describe('spotifyLookups.ts', () => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn())
  const getByBatchSpy = jest.spyOn(spotifyLookups, 'getByBatch')
  const findTracksSpy = jest.spyOn(spotifyLookups, 'findTracks')
  const getTracksSpy = jest.spyOn(spotify, 'getTracks')
  const findTrackSpy = jest.spyOn(spotify, 'findTrack')

  describe('#spotifyLookups.default', () => {
    // clear mock.resolved/returnValues() between tests
    // calling mockReset on getByBatchSpy/findTracksSpy causes issues
    beforeEach(() => {
      getTracksSpy.mockReset()
      findTrackSpy.mockReset()
    })

    it('videoTracks x0, sheetTracks x0, byBatch x0, byFind x0', async () => {
      const numVideoTracks = 0
      const numSheetTracks = 0
      const numByBatch = 0
      const numByFind = 0

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const toMap: BestTrack[] = []
      const byBatch = createList((i) => {
        const st = createSpotifyTrack(i)
        const m = toMap[i]
        if (m) m.spotifyId = st.id
        return st
      }, numByBatch)
      const byFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < 0; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      for (let i = 0; i < 0; i++) {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [byFind[i]].filter((t) => !!t),
          },
        })
      }

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(numByBatch)
      expect(results.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy.mock.calls[0][0]).toHaveLength(0)
      expect(getTracksSpy).toHaveBeenCalledTimes(0)

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy.mock.calls[0][0]).toHaveLength(0)
      expect(findTrackSpy).toHaveBeenCalledTimes(0)
    })

    // my assumption for what a typical flow will be
    // x12 tracks, no spotifyIds, i can't find one track
    it('videoTracks x12, sheetTracks x0, byBatch x0, byFind x11', async () => {
      const numVideoTracks = 12
      const numSheetTracks = 0
      const numByBatch = 0
      const numByFind = 11

      const videoTracks = createList(createBestTrack, numVideoTracks, {
        spotifyId: null,
      })
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const toMap: BestTrack[] = []
      const byBatch = createList((i) => {
        const st = createSpotifyTrack(i)
        const m = toMap[i]
        if (m) m.spotifyId = st.id
        return st
      }, numByBatch)
      const byFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < 0; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      for (let i = 0; i < 12; i++) {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [byFind[i]].filter((t) => !!t),
          },
        })
      }

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(numByBatch)
      expect(results.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy.mock.calls[0][0]).toHaveLength(numByBatch)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy.mock.calls[0][0]).toHaveLength(12)
      expect(findTrackSpy).toHaveBeenCalledTimes(12)
    })

    // cant find one of tonys
    // Ive added x3 ids to the spreadsheet
    it('videoTracks x12, sheetTracks x3, byBatch x3, byFind x11', async () => {
      const numVideoTracks = 12
      const numSheetTracks = 3
      const numByBatch = 3
      const numByFind = 11

      const videoTracks = createList(createBestTrack, numVideoTracks, {
        spotifyId: null,
      })
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const toMap: BestTrack[] = []
      const byBatch = createList((i) => {
        const st = createSpotifyTrack(i)
        const m = toMap[i]
        if (m) m.spotifyId = st.id
        return st
      }, numByBatch)
      const byFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < 3; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      for (let i = 0; i < 12; i++) {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [byFind[i]].filter((t) => !!t),
          },
        })
      }

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(numByBatch)
      expect(results.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy.mock.calls[0][0]).toHaveLength(numByBatch)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy.mock.calls[0][0]).toHaveLength(12)
      expect(findTrackSpy).toHaveBeenCalledTimes(12)
    })

    // tony links one with spotifyId
    it('videoTracks x12, sheetTracks x0, byBatch x1, byFind x10', async () => {
      const numVideoTracks = 12
      const numSheetTracks = 0
      const numByBatch = 1
      const numByFind = 10

      const videoTracks = createList(createBestTrack, numVideoTracks, {
        spotifyId: null,
      })
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      // pseudo videoTrack[0] has spotifyId
      const toMap = [videoTracks[0]]
      const byBatch = createList((i) => {
        const st = createSpotifyTrack(i)
        if (toMap[i]) toMap[i].spotifyId = st.id
        return st
      }, numByBatch)
      const byFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < 1; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      for (let i = 0; i < 11; i++) {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [byFind[i]].filter((t) => !!t),
          },
        })
      }

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(numByBatch)
      expect(results.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy.mock.calls[0][0]).toHaveLength(numByBatch)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy.mock.calls[0][0]).toHaveLength(11)
      expect(findTrackSpy).toHaveBeenCalledTimes(11)
    })

    // one sheet track has many ids
    it('videoTracks x12, sheetTracks x0, byBatch x3, byFind x11', async () => {
      const numVideoTracks = 12
      const numSheetTracks = 1
      const numByBatch = 3
      const numByFind = 11

      const videoTracks = createList(createBestTrack, numVideoTracks, {
        spotifyId: null,
      })
      const sheetTracks = createList(createMissingTrack, numSheetTracks, {
        spotify_ids: 'id_0,id_1,id_3',
      })

      const toMap: BestTrack[] = []
      const byBatch = createList((i) => {
        const st = createSpotifyTrack(i)
        if (toMap[i]) toMap[i].spotifyId = st.id
        return st
      }, numByBatch)
      const byFind = createList(createSpotifyTrack, numByFind)

      for (let i = 0; i < 3; i += 50) {
        getTracksSpy.mockResolvedValueOnce({
          tracks: byBatch.slice(i, i + 50),
        })
      }
      for (let i = 0; i < 12; i++) {
        findTrackSpy.mockResolvedValueOnce({
          tracks: {
            href: `href_${i}`,
            items: [byFind[i]].filter((t) => !!t),
          },
        })
      }

      const results = await spotifyLookups.default(videoTracks, sheetTracks)

      expect(results.spotifyIdMap.size).toBe(numByBatch)
      expect(results.customIdMap.size).toBe(numByFind)

      expect(getByBatchSpy).toHaveBeenCalledTimes(1)
      expect(getByBatchSpy.mock.calls[0][0]).toHaveLength(numByBatch)
      expect(getTracksSpy).toHaveBeenCalledTimes(Math.ceil(numByBatch / 50))

      expect(findTracksSpy).toHaveBeenCalledTimes(1)
      expect(findTracksSpy.mock.calls[0][0]).toHaveLength(12)
      expect(findTrackSpy).toHaveBeenCalledTimes(12)
    })
  })
})
