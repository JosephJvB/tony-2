# Tony 3

Yeah I wanna rewrite tony2

Let's do it a bit smarter

1. maybe step functions? and communicating more async, message queues?
2. improve youtube playlistItem query, only get playlistItems in last <timeframe>
  - nah not possible with youtube api
  - https://developers.google.com/youtube/v3/docs/playlistItems/list
3. improve testing
  - test suite takes a LONG time to run
  - not sure why, CDK? CDK + Jest?
  - try with a new CDK project + simple tests
  - try with vite
4. nicer code design, idk it's kinda ugly atm
  - load everything into memory in lambda body then pass into other fns
5. Do I like the way that I am resolving missed tracks with the google sheet?
  - unsure.
6. tricky is that data queried at start (google sheets) needs to be re-used at the end of execution so you want to keep it in memory
  - Milkbooks & JBA we kept that in memory
  - Recent interview Candidate Simon talked about DynamoDB to persist "global state"

```ts
type JobDocument = {
  id: string
  timestamp: number
  step: 1 | 2 | 3 | 4,
  GoogleSheets: {
    youtubeVideoRows: Array<{
      id: string
      title: string
      date: string
      total_tracks: string
    }>
    missingTrackRows: Array<{
      name: string
      artist: string
      date: string
      link: string
      spotify_ids: string
    }>
  }
  Youtube: {
    playlistItems: Array<{
      id: string
      snippet: {
        publishedAt: string
        title: string
        description: string
        channelId: string
        videoOwnerChannelId: string
      }
      status: {
        privacyStatus: 'public' | 'private'
      }
    }>
  }
  Spotify: {
    lookupById: Array<{
      id: string
      spotifyId: string
      year: number
    }>
    lookupByAttributes: Array<{
      id: string
      name: string
      artist: string
      year?: number
    }>
    foundBySpotifyId: Record<string, string>
    foundByAttributes: Record<string, string>
    allPlaylists: Array<{
      id: string
      name: string
      description: string
      trackIds: string[]
    }>
  }
}
```