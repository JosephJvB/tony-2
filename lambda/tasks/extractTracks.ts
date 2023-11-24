import { extractSpotifyId } from '../spotify'
import { YoutubeVideo } from '../youtube'

export type BestTrackProps = {
  name: string
  artist: string
  link: string
}

export type BestTrack = BestTrackProps & {
  id: string
  year: number
  videoPublishedDate: string
  spotifyId: string | null
}

export const BEST_TRACK_PREFIXES = [
  '!!!BEST TRACK',
  '!!BEST TRACK',
  '!!!BEST SONG',
  '!!!FAV TRACK',
]
export const MEH_TRACK_HEADERS_UPPER = new Set(['...MEH...', '…MEH…'])
export const RAW_REVIEW_TITLES = [
  'MIXTAPE',
  'EP',
  'ALBUM',
  'TRACK',
  'COMPILATION',
]
export const OLD_TITLE_PREFIXES = ['FAV TRACKS:', 'FAV & WORST TRACKS:']

export default function (toExtract: YoutubeVideo[]) {
  return toExtract
    .filter((v) => isBestTrackVideo(v))
    .flatMap((v) => {
      const oldPrefix = OLD_TITLE_PREFIXES.find((p) =>
        v.snippet.title.startsWith(p)
      )
      const bestTracks: BestTrackProps[] = []
      if (!!oldPrefix) {
        bestTracks.push(...extractTrackList_oldVideos(v))
      } else {
        bestTracks.push(...extractTrackList(v))
      }

      const year = new Date(v.snippet.publishedAt).getFullYear()

      return bestTracks.map((t) => ({
        id: [t.artist, t.name, year].join('__'),
        ...t,
        year,
        videoPublishedDate: v.snippet.publishedAt,
        spotifyId: extractSpotifyId(t.link, 'track'),
      }))
    })
}

export const extractTrackList = (v: YoutubeVideo) => {
  const lines = descriptionToLines(v.snippet.description)

  const startIdx = lines.findIndex(
    (l) => !!BEST_TRACK_PREFIXES.find((pref) => l.startsWith(pref))
  )
  const endIdx = lines.findIndex(
    (l) => !!MEH_TRACK_HEADERS_UPPER.has(l.toUpperCase())
  )

  if (startIdx === -1 || endIdx === -1) {
    console.error('failed to find bestTrackSection', {
      id: v.id,
      title: v.snippet.title,
      startIdx,
      endIdx,
    })
    return []
  }

  const trackList: BestTrackProps[] = []
  lines.slice(startIdx, endIdx).forEach((l) => {
    const track = getYoutubeTrackProps(l)
    if (track) {
      trackList.push(track)
    } else {
      // failed to extract track from line:
    }
  })

  if (trackList.length === 0) {
    console.error('found no tracks for video', {
      id: v.id,
      title: v.snippet.title,
    })
  }

  return trackList
}

export const extractTrackList_oldVideos = (v: YoutubeVideo) => {
  const trackList: BestTrackProps[] = []

  const lines = descriptionToLines(v.snippet.description)

  lines.forEach((line) => {
    if (line.toLowerCase().startsWith('amazon link')) {
      return
    }

    const youtubeTrack = getYoutubeTrackProps(line)
    if (youtubeTrack) {
      trackList.push(youtubeTrack)
    }
  })

  return trackList
}

export const getYoutubeTrackProps = (line: string) => {
  const lineSplit = line.split('\n').map((s) => s.trim())

  const [youtubeTrack, link] = lineSplit

  const [artist, name] = youtubeTrack.split(' - ')

  return {
    name: name ?? '',
    artist: artist ?? '',
    link: link ?? '',
  }
}

export const descriptionToLines = (description: string) => {
  return description
    .replace(/–/g, '-')
    .replace(/\n \n/g, '\n\n')
    .split('\n\n')
    .map((l) => l.trim())
}

export const isBestTrackVideo = (v: YoutubeVideo) => {
  if (v.snippet.channelId !== v.snippet.videoOwnerChannelId) {
    return false
  }
  if (v.status.privacyStatus === 'private') {
    return false
  }
  // playlist is "Weekly Track Roundup / Raw Reviews"
  // skip raw reviews
  const reviewTitle = RAW_REVIEW_TITLES.find((rt) =>
    v.snippet.title.includes(`${rt} REVIEW`)
  )
  if (!!reviewTitle) {
    return false
  }

  return true
}
