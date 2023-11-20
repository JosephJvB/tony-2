import {
  MissingTrack,
  SHEETS,
  clearRows,
  trackToRow,
  upsertRows,
  videoToRow,
} from '../googleSheets'
import { YoutubeVideo } from '../youtube'

export default async function (
  parsedVideos: YoutubeVideo[],
  nextMissingTracks: MissingTrack[]
) {
  const nextParsedVideos = parsedVideos.map((v) => ({
    id: v.id,
    title: v.snippet.title,
    published_at: v.snippet.publishedAt,
  }))
  console.log('  > nextParsedVideos x', nextParsedVideos.length)

  nextParsedVideos.sort(
    (a, z) =>
      new Date(z.published_at).getTime() - new Date(a.published_at).getTime()
  )

  await clearRows(
    SHEETS.PARSED_VIDEOS.NAME,
    SHEETS.PARSED_VIDEOS.RANGES.ALL_ROWS
  )
  await upsertRows(
    SHEETS.PARSED_VIDEOS.NAME,
    SHEETS.PARSED_VIDEOS.RANGES.ALL_ROWS,
    nextParsedVideos.map((v) => videoToRow(v))
  )

  console.log('  > nextMissingTracks x', nextMissingTracks.length)

  nextMissingTracks.sort(
    (a, z) => new Date(z.date).getTime() - new Date(a.date).getTime()
  )

  await clearRows(
    SHEETS.MISSING_TRACKS.NAME,
    SHEETS.MISSING_TRACKS.RANGES.ALL_ROWS
  )
  await upsertRows(
    SHEETS.MISSING_TRACKS.NAME,
    SHEETS.MISSING_TRACKS.RANGES.ALL_ROWS,
    nextMissingTracks.map((t) => trackToRow(t))
  )
}
