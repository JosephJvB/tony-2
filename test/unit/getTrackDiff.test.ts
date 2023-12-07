import { SpotifyTrack } from '../../lib/spotify'
import * as getTrackDiff from '../../lib/tony2-lambda/tasks/getTrackDiff'
import {
  createBestTrack,
  createList,
  createMissingTrack,
  createSpotifyTrack,
} from '../factories'

describe('getTrackDiff.ts', () => {
  describe('#getTrackDiff.default', () => {
    it('handles empty inputs', () => {
      const numVideoTracks = 0
      const numSheetTracks = 0

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const spotifyTracks = createList(
        createSpotifyTrack,
        numVideoTracks + numSheetTracks
      )

      const spotifyIdMap = new Map<string, SpotifyTrack>()
      const customIdMap = new Map<string, SpotifyTrack>()

      for (let i = 0; i < 0; i++) {
        const t = spotifyTracks[i]
        if (t) spotifyIdMap.set(t.id, t)
      }
      for (let i = 0; i < 0; i++) {
        const st = spotifyTracks[i]
        const vt = videoTracks[i]
        if (st && vt) customIdMap.set(vt.id, st)
      }

      const results = getTrackDiff.default(videoTracks, sheetTracks, {
        spotifyIdMap,
        customIdMap,
      })

      expect(results.found).toHaveLength(0)
      expect(results.missing).toHaveLength(0)
    })

    it('finds all but one videoTrack', () => {
      const numVideoTracks = 12
      const numSheetTracks = 0

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const spotifyTracks = createList(
        createSpotifyTrack,
        numVideoTracks + numSheetTracks
      )

      const spotifyIdMap = new Map<string, SpotifyTrack>()
      const customIdMap = new Map<string, SpotifyTrack>()

      for (let i = 0; i < 0; i++) {
        const t = spotifyTracks[i]
        if (t) spotifyIdMap.set(t.id, t)
      }

      // one missing videoTrack
      const found = numVideoTracks - 1
      for (let i = 0; i < found; i++) {
        const st = spotifyTracks[i]
        const vt = videoTracks[i]
        if (st && vt) customIdMap.set(vt.id, st)
      }

      const results = getTrackDiff.default(videoTracks, sheetTracks, {
        spotifyIdMap,
        customIdMap,
      })

      expect(results.found).toHaveLength(11)
      expect(results.missing).toHaveLength(1)
    })

    it('missing tracks stay missing', () => {
      const numVideoTracks = 12
      const numSheetTracks = 100

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const spotifyTracks = createList(
        createSpotifyTrack,
        numVideoTracks + numSheetTracks
      )

      const spotifyIdMap = new Map<string, SpotifyTrack>()
      const customIdMap = new Map<string, SpotifyTrack>()

      for (let i = 0; i < 0; i++) {
        const t = spotifyTracks[i]
        if (t) spotifyIdMap.set(t.id, t)
      }

      // one missing videoTrack
      const found = numVideoTracks - 1
      for (let i = 0; i < found; i++) {
        const st = spotifyTracks[i]
        const vt = videoTracks[i]
        if (st && vt) customIdMap.set(vt.id, st)
      }

      const results = getTrackDiff.default(videoTracks, sheetTracks, {
        spotifyIdMap,
        customIdMap,
      })

      expect(results.found).toHaveLength(11)
      expect(results.missing).toHaveLength(101)
    })

    it('some missing tracks are resolved', () => {
      const numVideoTracks = 12
      const numSheetTracks = 100

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const spotifyTracks = createList(
        createSpotifyTrack,
        numVideoTracks + numSheetTracks
      )

      const spotifyIdMap = new Map<string, SpotifyTrack>()
      const customIdMap = new Map<string, SpotifyTrack>()

      // 3 sheetTracks found
      for (let i = 0; i < 3; i++) {
        const t = spotifyTracks[i]
        const st = sheetTracks[i]
        st.spotify_ids = t.id
        if (t) spotifyIdMap.set(t.id, t)
      }

      // one missing videoTrack
      const found = numVideoTracks - 1
      for (let i = 0; i < found; i++) {
        const st = spotifyTracks[i]
        const vt = videoTracks[i]
        if (st && vt) customIdMap.set(vt.id, st)
      }

      const results = getTrackDiff.default(videoTracks, sheetTracks, {
        spotifyIdMap,
        customIdMap,
      })

      expect(results.found).toHaveLength(14)
      expect(results.missing).toHaveLength(98)
    })

    it('missing tracks can have multiple found tracks', () => {
      const numVideoTracks = 12
      const numSheetTracks = 100

      const videoTracks = createList(createBestTrack, numVideoTracks)
      const sheetTracks = createList(createMissingTrack, numSheetTracks)

      const spotifyTracks = createList(
        createSpotifyTrack,
        numVideoTracks + numSheetTracks
      )

      const spotifyIdMap = new Map<string, SpotifyTrack>()
      const customIdMap = new Map<string, SpotifyTrack>()

      // 3 sheetTracks found
      // each has x3 spotifyTracks associated
      // = 9
      for (let i = 0; i < 3; i++) {
        const st = sheetTracks[i]
        const mapped: string[] = []
        spotifyTracks.slice(i, i + 3).forEach((t) => {
          mapped.push(t.id)
          spotifyIdMap.set(t.id, t)
        })
        st.spotify_ids = mapped.join(', ') // mapping logic handles trim()
      }

      // one missing videoTrack
      const found = numVideoTracks - 1
      for (let i = 0; i < found; i++) {
        const st = spotifyTracks[i]
        const vt = videoTracks[i]
        if (st && vt) customIdMap.set(vt.id, st)
      }

      const results = getTrackDiff.default(videoTracks, sheetTracks, {
        spotifyIdMap,
        customIdMap,
      })

      expect(results.found).toHaveLength(20)
      expect(results.missing).toHaveLength(98)
    })
  })
})
