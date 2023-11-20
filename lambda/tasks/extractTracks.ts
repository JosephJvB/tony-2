import { extractSpotifyId } from '../spotify'
import { BestTrackProps, extractTrackList } from '../videoDescriptions'
import { YoutubeVideo } from '../youtube'

export type BestTrack = BestTrackProps & {
  id: string
  year: number
  videoPublishedDate: string
  spotifyId: string | null
}

export default function (videos: YoutubeVideo[]) {
  return videos.flatMap((v) => {
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
