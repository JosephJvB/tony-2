# spreadsheet integration

### todos:
- [x] make s3 json files public for web assets
  - [x] lambda
  - [x] cloudfront dist
  - [x] on objectPut -> copyFile & create invalidation
  - do I need to create new filenames to avoid caching issues @ browser
- split lambda into step function? Or nah
- make parsed video rows that should be BestTracks with total_tracks = 0 background colour red
- i guess if this is etl, I shouldn't call it extract tracks? idk man
- not saving json data about found tracks, ie: which track from which video
  - Kinda wanna make a website displaying stats about the tracks / videos
  - would need that ^
- could make a thing like: how much of a melon head are you
  - how many of tony's liked songs are in your "your music" library
  - https://developer.spotify.com/documentation/web-api/reference/check-users-saved-tracks


### it's called system design babes look it up x
1. get all playlist videos
  - stretch: if possible, run on webhook when a video is added
  - Array<{id, name, artist, date, link}>
2. get parsedVideoIds list
  - Set<string>
3. get missingspreadsheet rows - filter for where SpotifyId is set
  - Map<string, {rowNum: string} & SheetTrack>
4. lookup in Spotify
  - batch lookup by spotifyId
    - Map<spotifyId, Track>
  - 1 by 1 lookup by properties
    - Map<id, Track>
5. Sort tracks by year
  - Map<year, Track[]>
6. For each year, get playlist, diff, add songs
  - track songs that weren't found: Array<Track>
7. filter all missingSpreadsheet rows, if the track was found, exclude
8. add missing from current batch TO spreadsheet rows
9. remove all data from spreadsheet, and set next rows
  - excluding those we found by spotifyId
  - including those not found in latest check

- Steps 7+ feels a bit yuck
- adding & removing in the same action
- ie: bulk rewriting all the rows...
- kind of thing you want a backup, sql transaction for

Probably I will need to clear all the rows first
then rewrite them
in case i end up with fewer rows in the next set

should I try use CDK?