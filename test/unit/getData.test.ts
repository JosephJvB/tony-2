import * as s3 from '../../lib/s3'
import * as youtube from '../../lib/youtube'
import * as googleSheets from '../../lib/googleSheets'
import * as spotify from '../../lib/spotify'
import getData from '../../lib/tony2-lambda/tasks/getData'
import {
  createList,
  createMissingTrack,
  createParsedVideo,
  createYoutubeVideo,
  createSpotifyPlaylist,
} from '../factories'

describe('getData.ts', () => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn())
  const getYoutubePlaylistItemsSpy = jest
    .spyOn(youtube, 'getYoutubePlaylistItems')
    .mockImplementation(jest.fn())
  const getRowsSpy = jest
    .spyOn(googleSheets, 'getRows')
    .mockImplementation(jest.fn())
  const getMyPlaylistsSpy = jest
    .spyOn(spotify, 'getMyPlaylists')
    .mockImplementation(jest.fn())
  const getPlaylistItemsSpy = jest
    .spyOn(spotify, 'getPlaylistItems')
    .mockImplementation(jest.fn())
  const saveS3FileSpy = jest.spyOn(s3, 'putFile').mockImplementation(jest.fn())
  describe('#default', () => {
    it('parsedVideos x0, youtubeVideos x0, missingTracks x0, spotifyPlaylists x0', async () => {
      const youtubeVideos: youtube.YoutubeVideo[] = []
      const missingTrackRows: string[][] = []
      const parsedVideoRows: string[][] = []
      const spotifyPlaylists: spotify.SpotifyPlaylist[] = []

      getYoutubePlaylistItemsSpy.mockResolvedValueOnce(youtubeVideos)
      getRowsSpy.mockResolvedValueOnce(missingTrackRows)
      getRowsSpy.mockResolvedValueOnce(parsedVideoRows)
      getMyPlaylistsSpy.mockResolvedValueOnce(spotifyPlaylists)

      const results = await getData()

      expect(getYoutubePlaylistItemsSpy).toHaveBeenCalledTimes(1)
      expect(getRowsSpy).toHaveBeenCalledTimes(2)
      expect(getRowsSpy).toHaveBeenCalledWith(
        googleSheets.SHEETS.MISSING_TRACKS.NAME,
        googleSheets.SHEETS.MISSING_TRACKS.RANGES.ALL_ROWS
      )
      expect(getRowsSpy).toHaveBeenCalledWith(
        googleSheets.SHEETS.PARSED_VIDEOS.NAME,
        googleSheets.SHEETS.PARSED_VIDEOS.RANGES.ALL_ROWS
      )
      expect(getPlaylistItemsSpy).toHaveBeenCalledTimes(spotifyPlaylists.length)

      expect(saveS3FileSpy).toHaveBeenCalledTimes(4)
      const calls = saveS3FileSpy.mock.calls
      expect(calls[0][0].endsWith('youtube-playlist-items.json'))
      expect(JSON.parse(calls[0][1])).toHaveLength(youtubeVideos.length)
      expect(calls[1][0].endsWith('spreadsheet-missing-tracks.json'))
      expect(JSON.parse(calls[1][1])).toHaveLength(missingTrackRows.length)
      expect(calls[2][0].endsWith('spreadsheet-parsed-youtube-videos.json'))
      expect(JSON.parse(calls[2][1])).toHaveLength(parsedVideoRows.length)
      expect(calls[3][0].endsWith('spotify-playlists.json'))
      expect(JSON.parse(calls[3][1])).toHaveLength(spotifyPlaylists.length)

      expect(results).toEqual({
        parsedVideos: parsedVideoRows.map((r) => googleSheets.rowToVideo(r)),
        toParse: youtubeVideos.slice(parsedVideoRows.length),
        allMissingTracks: missingTrackRows.map((r) =>
          googleSheets.rowToTrack(r)
        ),
        missingTracksToFind: missingTrackRows
          .map((r) => googleSheets.rowToTrack(r))
          .filter((t) => !!t.spotify_ids),
        spotifyPlaylists,
      })
    })

    it('parsedVideos x5, youtubeVideos x10, missingTracks x5, spotifyPlaylists x5', async () => {
      const youtubeVideos = createList(createYoutubeVideo, 10)
      const missingTrackRows = createList(
        (i) => googleSheets.trackToRow(createMissingTrack(i)),
        5
      )
      const parsedVideoRows = createList(
        (i) => googleSheets.videoToRow(createParsedVideo(i)),
        5
      )
      const spotifyPlaylists = createList(createSpotifyPlaylist, 5, 5)

      getYoutubePlaylistItemsSpy.mockResolvedValueOnce(youtubeVideos)
      getRowsSpy.mockResolvedValueOnce(missingTrackRows)
      getRowsSpy.mockResolvedValueOnce(parsedVideoRows)
      getMyPlaylistsSpy.mockResolvedValueOnce(spotifyPlaylists)
      spotifyPlaylists.forEach((p) => {
        getPlaylistItemsSpy.mockResolvedValueOnce(p.tracks.items)
      })

      const results = await getData()

      expect(getYoutubePlaylistItemsSpy).toHaveBeenCalledTimes(1)
      expect(getRowsSpy).toHaveBeenCalledTimes(2)
      expect(getRowsSpy).toHaveBeenCalledWith(
        googleSheets.SHEETS.MISSING_TRACKS.NAME,
        googleSheets.SHEETS.MISSING_TRACKS.RANGES.ALL_ROWS
      )
      expect(getRowsSpy).toHaveBeenCalledWith(
        googleSheets.SHEETS.PARSED_VIDEOS.NAME,
        googleSheets.SHEETS.PARSED_VIDEOS.RANGES.ALL_ROWS
      )
      expect(getPlaylistItemsSpy).toHaveBeenCalledTimes(spotifyPlaylists.length)

      expect(saveS3FileSpy).toHaveBeenCalledTimes(4)
      const calls = saveS3FileSpy.mock.calls
      expect(calls[0][0].endsWith('youtube-playlist-items.json'))
      expect(JSON.parse(calls[0][1])).toHaveLength(youtubeVideos.length)
      expect(calls[1][0].endsWith('spreadsheet-missing-tracks.json'))
      expect(JSON.parse(calls[1][1])).toHaveLength(missingTrackRows.length)
      expect(calls[2][0].endsWith('spreadsheet-parsed-youtube-videos.json'))
      expect(JSON.parse(calls[2][1])).toHaveLength(parsedVideoRows.length)
      expect(calls[3][0].endsWith('spotify-playlists.json'))
      expect(JSON.parse(calls[3][1])).toHaveLength(spotifyPlaylists.length)

      expect(results).toEqual({
        parsedVideos: parsedVideoRows.map((r) => googleSheets.rowToVideo(r)),
        toParse: youtubeVideos.slice(parsedVideoRows.length),
        allMissingTracks: missingTrackRows.map((r) =>
          googleSheets.rowToTrack(r)
        ),
        missingTracksToFind: missingTrackRows
          .map((r) => googleSheets.rowToTrack(r))
          .filter((t) => !!t.spotify_ids),
        spotifyPlaylists: spotifyPlaylists.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          trackIds: p.tracks.items.map((i) => i.track.id),
        })),
      })
    })
  })
})
