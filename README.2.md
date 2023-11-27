# spreadsheet integration

make parsed video rows that should be BestTracks with total_tracks = 0 background colour red

1. Make forbidden tracks public:
  - save forbidden tracks to spreadsheet. that's all.
  - done

2. Run on Cloud on regular Cron interval
  - x2 input sources to lookup in Spotify
    1. NEW youtube video descriptions
      - do not parse old descriptions, track video IDs that have already been parsed
    2. Missing spreadsheet rows with spotifyId
      - look up spotifyId
      - I guess, if it succeeds, I'll need to update that row somehow. So next run doesn't repeat the same

### deployed lambda
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