import { readFileSync } from 'fs'
import * as extractTracks from '../../lib/tony2-lambda/tasks/extractTracks'
import * as spotify from '../../lib/spotify'
import { YoutubeVideo } from '../../lib/youtube'
import { createBestTrack, createList, createYoutubeVideo } from '../factories'

describe('unit/extractTracks.ts', () => {
  describe('#extractTracks.default', () => {
    const isBestTrackVideoSpy = jest.spyOn(extractTracks, 'isBestTrackVideo')
    const getBestTracksSectionSpy = jest.spyOn(
      extractTracks,
      'getBestTracksSection'
    )
    const getYoutubeTrackPropsSpy = jest.spyOn(
      extractTracks,
      'getYoutubeTrackProps'
    )
    const extractSpotifyIdSpy = jest.spyOn(spotify, 'extractSpotifyId')

    it('videos x0, invalidVideos x0, numTracksPerVideo x5', () => {
      const numVideos = 0
      const numInvalidVideos = 0
      const numTracksPerVideo = 5
      const numValidVideos = numVideos - numInvalidVideos
      const numTracks = numValidVideos * numTracksPerVideo

      const toExtract = createList(createYoutubeVideo, numVideos)
      const bestTrackSections = toExtract
        .slice(numInvalidVideos)
        .map(() => createList(createBestTrack, numTracksPerVideo))

      toExtract.forEach((_, idx) => {
        const valid = idx >= numInvalidVideos
        isBestTrackVideoSpy.mockReturnValueOnce(valid)
      })
      bestTrackSections.forEach((s) => {
        getBestTracksSectionSpy.mockReturnValueOnce(
          s.map((t) => `${t.artist} - ${t.name}\n${t.link}`)
        )
      })

      const results = extractTracks.default(toExtract)

      expect(results.nextTracks).toHaveLength(numTracks)
      expect(results.nextVideoRows).toHaveLength(numVideos)
      expect(isBestTrackVideoSpy).toHaveBeenCalledTimes(numVideos)
      expect(getBestTracksSectionSpy).toHaveBeenCalledTimes(numValidVideos)
      expect(getYoutubeTrackPropsSpy).toHaveBeenCalledTimes(numTracks)
      expect(extractSpotifyIdSpy).toHaveBeenCalledTimes(numTracks)
    })

    it('videos x5, invalidVideos x0, numTracksPerVideo x5', () => {
      const numVideos = 5
      const numInvalidVideos = 0
      const numTracksPerVideo = 5
      const numValidVideos = numVideos - numInvalidVideos
      const numTracks = numValidVideos * numTracksPerVideo

      const toExtract = createList(createYoutubeVideo, numVideos)
      const bestTrackSections = toExtract
        .slice(numInvalidVideos)
        .map(() => createList(createBestTrack, numTracksPerVideo))

      toExtract.forEach((_, idx) => {
        const valid = idx >= numInvalidVideos
        isBestTrackVideoSpy.mockReturnValueOnce(valid)
      })
      bestTrackSections.forEach((s) => {
        getBestTracksSectionSpy.mockReturnValueOnce(
          s.map((t) => `${t.artist} - ${t.name}\n${t.link}`)
        )
      })

      const results = extractTracks.default(toExtract)

      expect(results.nextTracks).toHaveLength(numTracks)
      expect(results.nextVideoRows).toHaveLength(numVideos)
      expect(isBestTrackVideoSpy).toHaveBeenCalledTimes(numVideos)
      expect(getBestTracksSectionSpy).toHaveBeenCalledTimes(numValidVideos)
      expect(getYoutubeTrackPropsSpy).toHaveBeenCalledTimes(numTracks)
      expect(extractSpotifyIdSpy).toHaveBeenCalledTimes(numTracks)
    })

    it('videos x5, invalidVideos x2, numTracksPerVideo x5', () => {
      const numVideos = 5
      const numInvalidVideos = 2
      const numTracksPerVideo = 5
      const numValidVideos = numVideos - numInvalidVideos
      const numTracks = numValidVideos * numTracksPerVideo

      const toExtract = createList(createYoutubeVideo, numVideos)
      const bestTrackSections = toExtract
        .slice(numInvalidVideos)
        .map(() => createList(createBestTrack, numTracksPerVideo))

      toExtract.forEach((_, idx) => {
        const valid = idx >= numInvalidVideos
        isBestTrackVideoSpy.mockReturnValueOnce(valid)
      })
      bestTrackSections.forEach((s) => {
        getBestTracksSectionSpy.mockReturnValueOnce(
          s.map((t) => `${t.artist} - ${t.name}\n${t.link}`)
        )
      })

      const results = extractTracks.default(toExtract)

      expect(results.nextTracks).toHaveLength(numTracks)
      expect(results.nextVideoRows).toHaveLength(numVideos)
      expect(isBestTrackVideoSpy).toHaveBeenCalledTimes(numVideos)
      expect(getBestTracksSectionSpy).toHaveBeenCalledTimes(numValidVideos)
      expect(getYoutubeTrackPropsSpy).toHaveBeenCalledTimes(numTracks)
      expect(extractSpotifyIdSpy).toHaveBeenCalledTimes(numTracks)
    })
  })

  describe('#isBestTrackVideo', () => {
    it('rejects non-needledrop videos', () => {
      const v = {
        snippet: {
          channelId: 'tony',
          videoOwnerChannelId: 'not-tony',
        },
      } as YoutubeVideo

      const result = extractTracks.isBestTrackVideo(v)

      expect(result).toBe(false)
    })

    it('skips private videos', () => {
      const v = {
        snippet: {
          channelId: 'tony',
          videoOwnerChannelId: 'tony',
        },
        status: {
          privacyStatus: 'private',
        },
      } as YoutubeVideo

      const result = extractTracks.isBestTrackVideo(v)

      expect(result).toBe(false)
    })

    it('skips raw review videos', () => {
      const v = {
        snippet: {
          channelId: 'tony',
          videoOwnerChannelId: 'tony',
          title: 'Gucci Mane & Metro Boomin - Drop Top Wop MIXTAPE REVIEW',
        },
        status: {
          privacyStatus: 'public',
        },
      } as YoutubeVideo

      const result = extractTracks.isBestTrackVideo(v)

      expect(result).toBe(false)
    })
  })

  describe('#getBestTracksSection', () => {
    // const consoleErrorSpy = jest
    //   .spyOn(console, 'error')

    const recentVideos = JSON.parse(
      readFileSync(__dirname + '/../data/2023-videos.json', 'utf-8')
    ) as YoutubeVideo[]

    recentVideos.forEach((v) => {
      const idShort = v.id.substring(v.id.length - 10)
      it(`can parse video description: ${idShort}`, () => {
        const result = extractTracks.getBestTracksSection(v)

        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('#getYoutubeTrackProps', () => {
    it('can get youtube props: Aesop Rock / Homeboy Sandman EP', () => {
      const input =
        'Aesop Rock / Homeboy Sandman EP\nhttp://www.theneedledrop.com/articles/2016/10/aesop-rock-homeboy-sandman-lice-two-still-buggin'

      const track = extractTracks.getYoutubeTrackProps(input)

      expect(track.name).toBe('')
      expect(track.artist).toBe('Aesop Rock / Homeboy Sandman EP')
      expect(track.link).toBe(
        'http://www.theneedledrop.com/articles/2016/10/aesop-rock-homeboy-sandman-lice-two-still-buggin'
      )
    })

    it('can get youtube props: ampha - Dancing Circles', () => {
      const input =
        'ampha - Dancing Circles\nhttps://www.youtube.com/watch?v=UhE5io7Nyk4&pp=ygUYU2FtcGhhIC0gRGFuY2luZyBDaXJjbGVz'

      const track = extractTracks.getYoutubeTrackProps(input)

      expect(track.name).toBe('Dancing Circles')
      expect(track.artist).toBe('ampha')
      expect(track.link).toBe(
        'https://www.youtube.com/watch?v=UhE5io7Nyk4&pp=ygUYU2FtcGhhIC0gRGFuY2luZyBDaXJjbGVz'
      )
    })
  })
})
