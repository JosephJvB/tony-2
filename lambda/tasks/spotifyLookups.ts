import { MissingTrack } from '../googleSheets'
import { SpotifyTrack, findTrack, getTracks } from '../spotify'
import { BestTrack } from './extractTracks'

export default async function (
  fromVideoDescriptions: BestTrack[],
  fromSpreadsheet: MissingTrack[]
) {
  const idsToGet: string[] = [
    ...fromVideoDescriptions
      .filter((v) => v.spotifyId)
      .map((v) => v.spotifyId as string),
    ...fromSpreadsheet.map((t) => t.spotify_id),
  ]
  console.log('  >', idsToGet.length, 'ids to batch lookup in spotify')

  const spotifyIdMap = new Map<string, SpotifyTrack>()
  for (let i = 0; i < idsToGet.length; i += 50) {
    const batch = idsToGet.slice(i, i + 50)

    const result = await getTracks(batch)

    result.tracks.forEach((t) => {
      spotifyIdMap.set(t.id, t)
    })
  }

  // don't bother trying to find tracks from spreadsheet
  // they already failed to be found first time
  // over time this operation woudld take ages
  const customIdMap = new Map<string, SpotifyTrack>()
  const toFind = fromVideoDescriptions.filter(
    (t) => !t.spotifyId || !spotifyIdMap.has(t.spotifyId)
  )
  console.log('  >', toFind.length, 'tracks to find in spotify')

  let count = 1
  for (const t of toFind) {
    console.log('  > findTrack', count++, '/', toFind.length)
    const result = await findTrack(t)

    if (!result.tracks.items.length) {
      continue
    }

    customIdMap.set(t.id, result.tracks.items[0])
  }

  return {
    spotifyIdMap,
    customIdMap,
  }
}
