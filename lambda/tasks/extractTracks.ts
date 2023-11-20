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

export default function (toExtract: YoutubeVideo[]) {
  return toExtract.flatMap((v) => {
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

const BEST_TRACK_PREFIXES = [
  '!!!BEST TRACK',
  '!!BEST TRACK',
  '!!!BEST SONG',
  '!!!FAV TRACK',
]
const RAW_REVIEW_TITLES = ['MIXTAPE', 'EP', 'ALBUM', 'TRACK', 'COMPILATION']
const OLD_TITLE_PREFIXES = ['FAV TRACKS:', 'FAV & WORST TRACKS:']

export const getYoutubeTrackProps = (line: string) => {
  const lineSplit = line.split('\n').map((s) => s.trim())

  // sometimes tony puts loads of links for a single item if he's linking multiple songs
  if (![2, 3, 4].includes(lineSplit.length)) {
    return null
  }

  const [youtubeTrack, link] = lineSplit

  if (!youtubeTrack.includes(' - ')) {
    return null
  }

  const [artist, name] = youtubeTrack.split(' - ')

  if (!link.startsWith('http')) {
    return null
  }

  return {
    name,
    artist,
    link,
  }
}

export const extractTrackList = (item: YoutubeVideo) => {
  const trackList: BestTrackProps[] = []
  if (!containsBestTracks(item)) {
    return []
  }
  const lines = descriptionToLines(item.snippet.description)

  let foundBestSection = false
  for (const line of lines) {
    const youtubeTrackPrefix = BEST_TRACK_PREFIXES.find((pref) =>
      line.startsWith(pref)
    )
    if (!!youtubeTrackPrefix) {
      foundBestSection = true
      continue
    }
    if (!foundBestSection) {
      continue
    }

    const youtubeTrack = getYoutubeTrackProps(line)
    if (!youtubeTrack) {
      // console.log('exit', JSON.stringify(line))
      break // assume best tracks section has ended
    }

    trackList.push(youtubeTrack)
  }

  if (trackList.length === 0) {
    trackList.push(...extractTrackList_oldVideos(item, lines))
  }

  if (trackList.length === 0) {
    console.error(
      'failed to extract youtubeTrackList for',
      item.snippet.title,
      {
        foundBestSection,
      }
    )
  }

  return trackList
}

export const containsBestTracks = (v: YoutubeVideo) => {
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

export const descriptionToLines = (description: string) => {
  let temp = description.replace(/–/g, '-').replace(/\n \n/g, '\n\n')

  return temp.split('\n\n').map((l) => l.trim())
}

export const extractTrackList_oldVideos = (
  item: YoutubeVideo,
  lines: string[]
) => {
  const trackList: BestTrackProps[] = []
  const oldPrefix = OLD_TITLE_PREFIXES.find((p) =>
    item.snippet.title.startsWith(p)
  )
  // only handle old videos
  if (!oldPrefix) {
    return trackList
  }

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
