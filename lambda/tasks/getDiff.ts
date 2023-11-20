import { MissingTrack } from '../googleSheets'
import { SpotifyTrack } from '../spotify'
import { BestTrack } from './extractTracks'

export type FoundTrack = SpotifyTrack & {
  year: number
}

export default function (
  fromVideoDescriptions: BestTrack[],
  missingTracks: MissingTrack[],
  maps: {
    spotifyIdMap: Map<string, SpotifyTrack>
    customIdMap: Map<string, SpotifyTrack>
  }
) {
  const found: FoundTrack[] = []
  const missing: MissingTrack[] = []

  fromVideoDescriptions.forEach((t) => {
    const f =
      (t.spotifyId && maps.spotifyIdMap.get(t.spotifyId)) ??
      maps.customIdMap.get(t.id)

    if (f) {
      found.push({
        ...f,
        year: t.year,
      })
    } else {
      missing.push({
        id: t.id,
        name: t.name,
        artist: t.artist,
        link: t.link,
        date: t.videoPublishedDate,
        spotify_id: t.spotifyId ?? '',
      })
    }
  })

  missingTracks.forEach((t) => {
    const f = t.spotify_id && maps.spotifyIdMap.get(t.spotify_id)
    if (!f) {
      return
    }

    if (f) {
      found.push({
        ...f,
        year: new Date(t.date).getUTCFullYear(),
      })
    } else {
      missing.push(t)
    }
  })

  return {
    found,
    missing,
  }
}
