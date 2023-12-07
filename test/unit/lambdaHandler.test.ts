import { handler } from '../../lib/tony2-lambda/tony2Lambda'
import * as spotify from '../../lib/spotify'
import * as ssm from '../../lib/ssm'
import * as extractTracks from '../../lib/tony2-lambda/tasks/extractTracks'
import * as getData from '../../lib/tony2-lambda/tasks/getData'
import * as getTrackDiff from '../../lib/tony2-lambda/tasks/getTrackDiff'
import * as spotifyLookups from '../../lib/tony2-lambda/tasks/spotifyLookups'
import * as updatePlaylists from '../../lib/tony2-lambda/tasks/updatePlaylists'
import * as updateSpreadsheets from '../../lib/tony2-lambda/tasks/updateSpreadsheets'
import {
  createBestTrack,
  createList,
  createMissingTrack,
  createParsedVideo,
  createLoadedSpotifyPlaylist,
  createSpotifyTrack,
  createYoutubeVideo,
} from '../factories'

describe('lambda/index.handler', () => {
  jest.spyOn(console, 'log').mockImplementation(jest.fn())

  const loadSsmParamsSpy = jest
    .spyOn(ssm, 'loadSsmParams')
    .mockImplementation(jest.fn())
  const setBasicTokenSpy = jest
    .spyOn(spotify, 'setBasicToken')
    .mockImplementation(jest.fn())
  const setAccessTokenSpy = jest
    .spyOn(spotify, 'setAccessToken')
    .mockImplementation(jest.fn())

  const extractTracksSpy = jest
    .spyOn(extractTracks, 'default')
    .mockImplementation(jest.fn())
  const getDataSpy = jest
    .spyOn(getData, 'default')
    .mockImplementation(jest.fn())
  const getTrackDiffSpy = jest
    .spyOn(getTrackDiff, 'default')
    .mockImplementation(jest.fn())
  const spotifyLookupsSpy = jest
    .spyOn(spotifyLookups, 'default')
    .mockImplementation(jest.fn())
  const updatePlaylistsSpy = jest
    .spyOn(updatePlaylists, 'default')
    .mockImplementation(jest.fn())
  const updateSpreadsheetsSpy = jest
    .spyOn(updateSpreadsheets, 'default')
    .mockImplementation(jest.fn())

  it('toParse x0, parsedVideos x0, missingTracks x0, spotifyPlaylists x0', async () => {
    const mockData = {
      parsedVideos: [],
      toParse: [],
      missingTracks: [],
      spotifyPlaylists: [],
    }
    const mockExtracted = {
      nextVideoRows: [],
      nextTracks: [],
    }
    const mockMaps = {
      customIdMap: new Map(),
      spotifyIdMap: new Map(),
    }
    const mockDiff = {
      found: [],
      missing: [],
    }
    getDataSpy.mockResolvedValueOnce(mockData)
    extractTracksSpy.mockReturnValueOnce(mockExtracted)
    spotifyLookupsSpy.mockResolvedValueOnce(mockMaps)
    getTrackDiffSpy.mockReturnValueOnce(mockDiff)

    await handler()

    expect(loadSsmParamsSpy).toHaveBeenCalledTimes(1)
    expect(setBasicTokenSpy).toHaveBeenCalledTimes(1)
    expect(setAccessTokenSpy).toHaveBeenCalledTimes(1)

    expect(getDataSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledWith(mockData.toParse)
    expect(spotifyLookupsSpy).toHaveBeenCalledTimes(1)
    expect(spotifyLookupsSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks
    )
    expect(getTrackDiffSpy).toHaveBeenCalledTimes(1)
    expect(getTrackDiffSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks,
      mockMaps
    )
    expect(updatePlaylistsSpy).toHaveBeenCalledTimes(1)
    expect(updatePlaylistsSpy).toHaveBeenCalledWith(
      mockDiff.found,
      mockData.spotifyPlaylists
    )
    expect(updateSpreadsheetsSpy).toHaveBeenCalledTimes(1)
    expect(updateSpreadsheetsSpy).toHaveBeenCalledWith(
      [...mockData.parsedVideos, ...mockExtracted.nextVideoRows],
      mockDiff.missing
    )
  })

  it('toParse x5, parsedVideos x0, missingTracks x0, spotifyPlaylists x0, nextTracks x10, found x10', async () => {
    const toParse = createList(createYoutubeVideo, 5)
    const bestTracks = createList(createBestTrack, 10)
    const foundTracks = createList(createSpotifyTrack, 10)
    const customIdMap = new Map<string, spotify.SpotifyTrack>()
    foundTracks.forEach((t) => customIdMap.set(t.id, t))

    const mockData = {
      parsedVideos: [],
      toParse,
      missingTracks: [],
      spotifyPlaylists: [],
    }
    const mockExtracted = {
      nextVideoRows: toParse.map((v) => ({
        id: v.id,
        title: v.snippet.title,
        published_at: v.snippet.publishedAt,
        total_tracks: '2',
      })),
      nextTracks: bestTracks,
    }

    const mockMaps = {
      customIdMap,
      spotifyIdMap: new Map(),
    }
    const mockDiff = {
      found: foundTracks.map((t, i) => ({
        ...t,
        year: i,
      })),
      missing: [],
    }
    getDataSpy.mockResolvedValueOnce(mockData)
    extractTracksSpy.mockReturnValueOnce(mockExtracted)
    spotifyLookupsSpy.mockResolvedValueOnce(mockMaps)
    getTrackDiffSpy.mockReturnValueOnce(mockDiff)

    await handler()

    expect(loadSsmParamsSpy).toHaveBeenCalledTimes(1)
    expect(setBasicTokenSpy).toHaveBeenCalledTimes(1)
    expect(setAccessTokenSpy).toHaveBeenCalledTimes(1)

    expect(getDataSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledWith(mockData.toParse)
    expect(spotifyLookupsSpy).toHaveBeenCalledTimes(1)
    expect(spotifyLookupsSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks
    )
    expect(getTrackDiffSpy).toHaveBeenCalledTimes(1)
    expect(getTrackDiffSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks,
      mockMaps
    )
    expect(updatePlaylistsSpy).toHaveBeenCalledTimes(1)
    expect(updatePlaylistsSpy).toHaveBeenCalledWith(
      mockDiff.found,
      mockData.spotifyPlaylists
    )
    expect(updateSpreadsheetsSpy).toHaveBeenCalledTimes(1)
    expect(updateSpreadsheetsSpy).toHaveBeenCalledWith(
      [...mockData.parsedVideos, ...mockExtracted.nextVideoRows],
      mockDiff.missing
    )
  })

  it('toParse x5, parsedVideos x5, missingTracks x0, spotifyPlaylists x0, nextTracks x10, found x10', async () => {
    const parsedVideos = createList(createParsedVideo, 5)
    const toParse = createList(createYoutubeVideo, 5)
    const bestTracks = createList(createBestTrack, 10)
    const foundTracks = createList(createSpotifyTrack, 10)
    const customIdMap = new Map<string, spotify.SpotifyTrack>()
    foundTracks.forEach((t) => customIdMap.set(t.id, t))

    const mockData = {
      parsedVideos,
      toParse,
      missingTracks: [],
      spotifyPlaylists: [],
    }
    const mockExtracted = {
      nextVideoRows: toParse.map((v) => ({
        id: v.id,
        title: v.snippet.title,
        published_at: v.snippet.publishedAt,
        total_tracks: '2',
      })),
      nextTracks: bestTracks,
    }

    const mockMaps = {
      customIdMap,
      spotifyIdMap: new Map(),
    }
    const mockDiff = {
      found: foundTracks.map((t, i) => ({
        ...t,
        year: i,
      })),
      missing: [],
    }
    getDataSpy.mockResolvedValueOnce(mockData)
    extractTracksSpy.mockReturnValueOnce(mockExtracted)
    spotifyLookupsSpy.mockResolvedValueOnce(mockMaps)
    getTrackDiffSpy.mockReturnValueOnce(mockDiff)

    await handler()

    expect(loadSsmParamsSpy).toHaveBeenCalledTimes(1)
    expect(setBasicTokenSpy).toHaveBeenCalledTimes(1)
    expect(setAccessTokenSpy).toHaveBeenCalledTimes(1)

    expect(getDataSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledWith(mockData.toParse)
    expect(spotifyLookupsSpy).toHaveBeenCalledTimes(1)
    expect(spotifyLookupsSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks
    )
    expect(getTrackDiffSpy).toHaveBeenCalledTimes(1)
    expect(getTrackDiffSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks,
      mockMaps
    )
    expect(updatePlaylistsSpy).toHaveBeenCalledTimes(1)
    expect(updatePlaylistsSpy).toHaveBeenCalledWith(
      mockDiff.found,
      mockData.spotifyPlaylists
    )
    expect(updateSpreadsheetsSpy).toHaveBeenCalledTimes(1)
    expect(updateSpreadsheetsSpy).toHaveBeenCalledWith(
      [...mockData.parsedVideos, ...mockExtracted.nextVideoRows],
      mockDiff.missing
    )
  })

  it('toParse x5, parsedVideos x5, missingTracks x5, spotifyPlaylists x2, nextTracks x10, found x10', async () => {
    const spotifyPlaylists = createList(createLoadedSpotifyPlaylist, 2, 10)
    const missingTracks = createList(createMissingTrack, 5)
    const parsedVideos = createList(createParsedVideo, 5)
    const toParse = createList(createYoutubeVideo, 5)
    const bestTracks = createList(createBestTrack, 10)
    const foundTracks = createList(createSpotifyTrack, 10)
    const customIdMap = new Map<string, spotify.SpotifyTrack>()
    foundTracks.forEach((t) => customIdMap.set(t.id, t))

    const mockData = {
      parsedVideos,
      toParse,
      missingTracks,
      spotifyPlaylists,
    }
    const mockExtracted = {
      nextVideoRows: toParse.map((v) => ({
        id: v.id,
        title: v.snippet.title,
        published_at: v.snippet.publishedAt,
        total_tracks: '2',
      })),
      nextTracks: bestTracks,
    }

    const mockMaps = {
      customIdMap,
      spotifyIdMap: new Map(),
    }
    const mockDiff = {
      found: foundTracks.map((t, i) => ({
        ...t,
        year: i,
      })),
      missing: [],
    }
    getDataSpy.mockResolvedValueOnce(mockData)
    extractTracksSpy.mockReturnValueOnce(mockExtracted)
    spotifyLookupsSpy.mockResolvedValueOnce(mockMaps)
    getTrackDiffSpy.mockReturnValueOnce(mockDiff)

    await handler()

    expect(loadSsmParamsSpy).toHaveBeenCalledTimes(1)
    expect(setBasicTokenSpy).toHaveBeenCalledTimes(1)
    expect(setAccessTokenSpy).toHaveBeenCalledTimes(1)

    expect(getDataSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledTimes(1)
    expect(extractTracksSpy).toHaveBeenCalledWith(mockData.toParse)
    expect(spotifyLookupsSpy).toHaveBeenCalledTimes(1)
    expect(spotifyLookupsSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks
    )
    expect(getTrackDiffSpy).toHaveBeenCalledTimes(1)
    expect(getTrackDiffSpy).toHaveBeenCalledWith(
      mockExtracted.nextTracks,
      mockData.missingTracks,
      mockMaps
    )
    expect(updatePlaylistsSpy).toHaveBeenCalledTimes(1)
    expect(updatePlaylistsSpy).toHaveBeenCalledWith(
      mockDiff.found,
      mockData.spotifyPlaylists
    )
    expect(updateSpreadsheetsSpy).toHaveBeenCalledTimes(1)
    expect(updateSpreadsheetsSpy).toHaveBeenCalledWith(
      [...mockData.parsedVideos, ...mockExtracted.nextVideoRows],
      mockDiff.missing
    )
  })
})
