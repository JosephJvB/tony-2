import { MissingTrack } from '../googleSheets'
import { SpotifyTrack, findTrack, getTracks } from '../spotify'
import { BestTrack } from './extractTracks'

export default async function (
  fromVideoDescriptions: BestTrack[],
  missingTracks: MissingTrack[]
) {
  const withSpotifyId = missingTracks.filter((t) => !!t.spotify_id)
  console.log(
    '  >',
    withSpotifyId.length,
    'manually added spotify ids from spreadsheet'
  )

  const idsToGet: string[] = [
    ...fromVideoDescriptions
      .filter((v) => v.spotifyId)
      .map((v) => v.spotifyId as string),
    ...withSpotifyId.map((t) => t.spotify_id),
  ]
  console.log('  >', idsToGet.length, 'ids to batch lookup in spotify')

  const spotifyIdMap = await getByBatch(idsToGet)
  console.log('  >', spotifyIdMap.size, 'tracks found by batch')

  // exclude missingTracks
  // already failed to be found by search on previous run
  // only search for tracks with at least
  const toFind = fromVideoDescriptions.filter((t) => {
    const hasValidSearchProps = t.name && t.artist
    const alreadyFound = t.spotifyId && spotifyIdMap.has(t.spotifyId)
    return hasValidSearchProps && !alreadyFound
  })
  console.log('  >', toFind.length, 'tracks to find in spotify')

  const customIdMap = await findTracks(toFind)
  console.log('  >', customIdMap.size, 'tracks found by search')

  return {
    spotifyIdMap,
    customIdMap,
  }
}

export const getByBatch = async (ids: string[]) => {
  const unique = [...new Set(ids)]

  const spotifyIdMap = new Map<string, SpotifyTrack>()
  for (let i = 0; i < unique.length; i += 50) {
    const batch = unique.slice(i, i + 50)

    const result = await getTracks(batch)

    result.tracks.forEach((t) => {
      spotifyIdMap.set(t.id, t)
    })
  }

  return spotifyIdMap
}

export const findTracks = async (toFind: BestTrack[]) => {
  const customIdMap = new Map<string, SpotifyTrack>()

  let count = 1
  for (const t of toFind) {
    console.log('  > findTrack', count++, '/', toFind.length)
    const result = await findTrack(t)

    if (!result.tracks.items.length) {
      continue
    }

    customIdMap.set(t.id, result.tracks.items[0])
  }

  return customIdMap
}
