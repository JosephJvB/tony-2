import { MissingTrack } from '../../googleSheets'
import { SpotifyTrack } from '../../spotify'
import { BestTrack } from './extractTracks'

export type FoundTrack = SpotifyTrack & {
  year: number
}

export default function (
  fromVideoDescriptions: BestTrack[],
  fromGoogleSheets: MissingTrack[],
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
        spotify_ids: '',
      })
    }
  })

  fromGoogleSheets.forEach((t) => {
    const ids = (t.spotify_ids ?? '').split(',').map((i) => i.trim())

    const stillMissing: string[] = []
    ids.forEach((spotifyId) => {
      const f = maps.spotifyIdMap.get(spotifyId)

      if (f) {
        found.push({
          ...f,
          year: new Date(t.date).getUTCFullYear(),
        })
      } else {
        stillMissing.push(spotifyId)
      }
    })

    if (stillMissing.length) {
      missing.push({
        ...t,
        spotify_ids: stillMissing.join(','),
      })
    }
  })

  return {
    found,
    missing,
  }
}
