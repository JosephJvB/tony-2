import { BestTrack } from './constants'
import getData from './tasks/getData'

export const handler = async () => {
  try {
    const data = await getData()

    const parsedVideoIds = new Set<string>()
    data.parsedVideos.forEach((v) => parsedVideoIds.add(v.id))

    const toExtract = data.youtubeVideos.filter(
      (v) => !parsedVideoIds.has(v.id)
    )

    // new task: extractBestTracks(toExtract)
    const extracted: BestTrack[] = []

    // const manuallySet = data.missingTracks.filter((t) => !!t.spotify_id)
  } catch (e) {
    console.error('handler failed')
    console.error(e)
  }
}
