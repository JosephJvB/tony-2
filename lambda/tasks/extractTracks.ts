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
export const MEH_TRACK_HEADERS_UPPER = new Set([
  '...MEH...',
  'MEH...',
  '...MEH',
  '…MEH…',
  'MEH…',
  '…MEH',
])
export const RAW_REVIEW_TITLES = [
  'MIXTAPE',
  'EP',
  'ALBUM',
  'TRACK',
  'COMPILATION',
]
export const FAV_TRACKS_ONLY = 'FAV TRACKS:'
export const FAV_AND_WORST = 'FAV & WORST TRACKS:'

export default function (toExtract: YoutubeVideo[]) {
  return toExtract
    .filter((v) => isBestTrackVideo(v))
    .flatMap((v) => {
      const bestTracks = extractTrackList(v)

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

  let startIdx = lines.findIndex(
    (l) => !!BEST_TRACK_PREFIXES.find((pref) => l.startsWith(pref))
  )
  let endIdx = lines.findIndex(
    (l) => !!MEH_TRACK_HEADERS_UPPER.has(l.toUpperCase())
  )

  // fix end and start
  if (v.snippet.title.startsWith(FAV_TRACKS_ONLY)) {
  }
  if (v.snippet.title.startsWith(FAV_AND_WORST)) {
  }

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
  lines.slice(startIdx + 1, endIdx).forEach((l) => {
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
// i can get SECTIONS by splittin on \n\n\n
// then find the BEST_TRACK_SECTION
// then try parse those lines only
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
