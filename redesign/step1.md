# Backup and Prepare

1. This task should backup to S3 the following
  1. All my spotify playlists
  2. Missing tracks google sheets tab
  3. Youtube videos google sheets tab
  4. Weekly Track roundup youtube playlist items


2. This task should perform the following actions in DynamoDB
- use data loaded from previous step to setup ddb document
```ts
const currentDoc = await ddb.query({ id: 'current' })
if (currentDoc) {
  await ddb.putItem({
    ...currentDoc,
    id: currentDoc.timestamp
  })
}

/////////
// WIP: save trim dataset to DDB
/////////
const parsedVideos = new Set([...youtubeVideoRows.map(r => r.id)])

const nextPlaylistItems = youtubeVideos.map(item => {
  // dont save descriptions that we dont need
  if (parsedVideos.has(item.id)) {
    item.snippet.description = ''
  }
  return item
})
/////////
// end WIP
/////////

await ddb.putItem({
  id: 'current',
  timestamp: Date.now(),
  step: 1,
  GoogleSheets: {
    youtubeVideoRows,
    missingTracks,
  },
  Youtube: {
    playlistItems: nextPlaylistItems
  },
  Spotify: {
    myPlaylists: myPlaylists.map(p => ({
      id: p.id,
      name: p.name,
      description: p.description,
      year: getYear(p.name),
      // dont need trackIds yet
      trackIds: [],
    }))
  }
})
```