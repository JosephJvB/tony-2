import { ParsedVideo } from '../../googleSheets'
import { extractSpotifyId } from '../../spotify'
import { YoutubeVideo } from '../../youtube'

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

export const BEST_TRACK_PREFIXES = ['!!!BEST', '!!BEST', '!BEST']
export const RAW_REVIEW_TITLES = [
  'MIXTAPE',
  'EP',
  'ALBUM',
  'TRACK',
  'COMPILATION',
].map((t) => `${t} REVIEW`)

export default function (toExtract: YoutubeVideo[]) {
  const nextVideoRows: ParsedVideo[] = []
  const nextTracks: BestTrack[] = []

  toExtract.forEach((v) => {
    const tracks = getTracksForVideo(v)

    nextVideoRows.push({
      id: v.id,
      title: v.snippet.title,
      published_at: v.snippet.publishedAt,
      total_tracks: tracks.length.toString(),
    })
    nextTracks.push(...tracks)
  })

  return { nextVideoRows, nextTracks }
}

export const getTracksForVideo = (v: YoutubeVideo) => {
  if (!isBestTrackVideo(v)) {
    return []
  }

  const bestTrackSection = getBestTracksSection(v)
  if (!bestTrackSection.length) {
    console.error('failed to find bestTrackSection', {
      id: v.id,
      title: v.snippet.title,
    })
  }

  const year = new Date(v.snippet.publishedAt).getFullYear()

  return bestTrackSection
    .map((l) => getYoutubeTrackProps(l))
    .map((t) => ({
      id: [t.artist, t.name, year].join('__'),
      ...t,
      year,
      videoPublishedDate: v.snippet.publishedAt,
      spotifyId: extractSpotifyId(t.link, 'track'),
    }))
}

export const getBestTracksSection = (v: YoutubeVideo) => {
  const sections = v.snippet.description
    .replace(/–/g, '-')
    .replace(/\r/g, '')
    .replace(/\n \n/g, '\n\n')
    .split('\n\n\n')
    .map((s) => s.split('\n\n').map((l) => l.trim()))

  const bestTrackSection = sections.find(
    (s) => !!BEST_TRACK_PREFIXES.find((pref) => s[0].startsWith(pref))
  )

  return bestTrackSection?.slice(1) ?? []
}

export const getYoutubeTrackProps = (line: string) => {
  const lineSplit = line.split('\n').map((s) => s.trim())

  const [youtubeTrack, link] = lineSplit

  const [artist, name] = youtubeTrack.split(' - ')

  return {
    name: name?.trim() ?? '',
    artist: artist?.trim() ?? '',
    link: link?.trim() ?? '',
  }
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
    v.snippet.title.includes(rt)
  )
  if (!!reviewTitle) {
    return false
  }

  return true
}
