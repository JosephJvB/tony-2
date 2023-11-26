import { readFileSync } from 'fs'
import {
  getBestTracksSection,
  getYoutubeTrackProps,
  isBestTrackVideo,
} from '../../lambda/tasks/extractTracks'
import { YoutubeVideo } from '../../lambda/youtube'

describe('unit/extractTracks.ts', () => {
  describe('#isBestTrackVideo', () => {
    it('rejects non-needledrop videos', () => {
      const v = {
        snippet: {
          channelId: 'tony',
          videoOwnerChannelId: 'not-tony',
        },
      } as YoutubeVideo

      const result = isBestTrackVideo(v)

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

      const result = isBestTrackVideo(v)

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

      const result = isBestTrackVideo(v)

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
        const result = getBestTracksSection(v)

        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  describe('#getYoutubeTrackProps', () => {
    it('can get youtube props: Aesop Rock / Homeboy Sandman EP', () => {
      const input =
        'Aesop Rock / Homeboy Sandman EP\nhttp://www.theneedledrop.com/articles/2016/10/aesop-rock-homeboy-sandman-lice-two-still-buggin'

      const track = getYoutubeTrackProps(input)

      expect(track).not.toBeNull()
    })
  })
})
