import { MissingTrack, ParsedVideo } from '../lambda/googleSheets'
import {
  PLAYLIST_NAME_PREFIX,
  SpotifyPlaylist,
  SpotifyTrack,
} from '../lambda/spotify'
import { BestTrack } from '../lambda/tasks/extractTracks'
import { YoutubeVideo } from '../lambda/youtube'

export const createList = <T>(
  helper: (i: number, ...args: any[]) => T,
  length: number,
  ...args: any[]
) =>
  Array(length)
    .fill(0)
    .map((_, idx) => helper(idx, ...args))

export const createYoutubeVideo = (i: number): YoutubeVideo => ({
  id: `id_${i}`,
  snippet: {
    channelId: `channelId_${i}`,
    videoOwnerChannelId: `videoOwnerChannelId_${i}`,
    title: `title_${i}`,
    publishedAt: `published_at_${i}`,
    description: `description_${i}`,
  },
  status: {
    privacyStatus: 'public',
  },
})

export const createParsedVideo = (i: number): ParsedVideo => ({
  id: `id_${i}`,
  title: `title_${i}`,
  published_at: `published_at_${i}`,
  total_tracks: `total_tracks_${i}`,
})

export const createMissingTrack = (
  i: number,
  t: Partial<MissingTrack> = {}
): MissingTrack => ({
  id: `id_${i}`,
  name: `name_${i}`,
  artist: `artist_${i}`,
  date: `date_${i}`,
  link: `link_${i}`,
  spotify_ids: `spotify_ids_${i}`,
  ...t,
})

export const createBestTrack = (
  i: number,
  t: Partial<BestTrack> = {}
): BestTrack => ({
  id: `id_${i}`,
  name: `name_${i}`,
  artist: `artist_${i}`,
  link: `link_${i}`,
  year: i,
  videoPublishedDate: `videoPublishedDate_${i}`,
  spotifyId: `spotifyId_${i}`,
  ...t,
})

export const createSpotifyTrack = (i: number): SpotifyTrack => ({
  id: `id_${i}`,
  name: `name_${i}`,
  uri: `uri_${i}`,
  href: `href_${i}`,
  artists: [
    {
      id: `artist.id_${i}`,
      name: `artist.name_${i}`,
      uri: `artist.uri_${i}`,
      href: `artist.href_${i}`,
    },
  ],
})

export type LoadedSpotifyPlaylist = {
  id: string
  name: string
  description: string
  trackIds: string[]
}

export const createSpotifyPlaylist = (
  i: number,
  numTracks: number
): SpotifyPlaylist => ({
  id: `id_${i}`,
  name: `${PLAYLIST_NAME_PREFIX}${i}`,
  description: `description_${i}`,
  public: true,
  collaborative: false,
  tracks: {
    total: numTracks,
    items: createList(
      (tId: number) => ({
        added_at: `added_at_${tId}`,
        track: createSpotifyTrack(tId),
      }),
      numTracks
    ),
  },
})

export const createLoadedSpotifyPlaylist = (
  i: number,
  numTracks: number
): LoadedSpotifyPlaylist => ({
  id: `id_${i}`,
  name: `${PLAYLIST_NAME_PREFIX}${i}`,
  description: `description_${i}`,
  trackIds: createList((tId: number) => `trackId[${tId}]`, numTracks),
})
