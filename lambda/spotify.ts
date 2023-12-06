import axios, { AxiosError, AxiosResponse } from 'axios'
import { BestTrack, BestTrackProps } from './tasks/extractTracks'
import { MISSING_TRACKS_LINK } from './googleSheets'
import { SSM_PARAMS } from './ssm'

export const SPOTIFY_JVB_USERID = 'xnmacgqaaa6a1xi7uy2k1fe7w'
export const SPOTIFY_ID_LENGTH = 22
export const SPOTIFY_DOMAIN = 'open.spotify.com'
export const SPOTIFY_REQUIRED_SCOPES = [
  'playlist-modify-private',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-read-collaborative',
].join(' ')
export const PLAYLIST_NAME_PREFIX = "TONY'S TOP TRACKS "
export const PLAYLIST_DESCRIPTION = `missing tracks list: ${MISSING_TRACKS_LINK}`

export const API_BASE_URL = 'https://api.spotify.com/v1'
export const ACCOUNTS_BASE_URL = 'https://accounts.spotify.com/api'

const FEATURE_PREFIXES = [
  ' ft. ',
  ' ft ',
  ' feat. ',
  ' feat ',
  ' prod. ',
  ' prod ',
]

export type SpotifySearchParams = {
  // album, artist, track, year, upc, tag:hipster, tag:new, isrc, genre
  q: string
  type: 'track' | 'album'
  limit: number
}
export type SearchResults<T> = {
  tracks: {
    href: string
    items: T[]
  }
}
export type SpotifyTrack = {
  id: string
  uri: string
  href: string
  name: string
  artists: SpotifyArtist[]
}
export type SpotifyArtist = {
  id: string
  uri: string
  href: string
  name: string
}
export type PlaylistItem = {
  added_at: string
  track: SpotifyTrack
}
export type SpotifyPlaylist = {
  id: string
  name: string
  description: string
  public: boolean
  collaborative: boolean
  tracks: {
    total: number
    items: PlaylistItem[]
  }
}
export type PaginatedQuery = {
  limit: number
  offset: number
}
export type GetPlaylistsQuery = PaginatedQuery & {
  user_id: string
}
export type PaginatedResponse<T> = {
  items: T[]
  next?: string
}
export type SubmitCodeResponse = {
  access_token: string
}

let BASIC_TOKEN: string | undefined
let ACCESS_TOKEN: string | undefined

export const setBasicToken = async () => {
  if (!BASIC_TOKEN) {
    const res = await requestBasicToken()
    BASIC_TOKEN = res.access_token
  }
}

export const requestBasicToken = async () => {
  try {
    const res: AxiosResponse<{
      access_token: string
    }> = await axios({
      method: 'post',
      url: `${ACCOUNTS_BASE_URL}/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: SSM_PARAMS.SPOTIFY_CLIENT_ID,
        client_secret: SSM_PARAMS.SPOTIFY_SECRET,
      }),
    })

    return res.data
  } catch (e) {
    console.error('setToken failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const setAccessToken = async () => {
  if (!ACCESS_TOKEN) {
    const res = await requestAccessToken()
    ACCESS_TOKEN = res.access_token
  }
}

export const requestAccessToken = async () => {
  try {
    const basicAuth = Buffer.from(
      `${SSM_PARAMS.SPOTIFY_CLIENT_ID}:${SSM_PARAMS.SPOTIFY_SECRET}`
    ).toString('base64')
    const res: AxiosResponse<{
      access_token: string
    }> = await axios({
      method: 'post',
      url: `${ACCOUNTS_BASE_URL}/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      data: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: SSM_PARAMS.SPOTIFY_REFRESH_TOKEN,
      }),
    })

    return res.data
  } catch (e) {
    console.error('requestAccessToken failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const getTracks = async (trackIds: string[]) => {
  try {
    const res: AxiosResponse<{
      tracks: SpotifyTrack[]
    }> = await axios({
      method: 'get',
      url: `${API_BASE_URL}/tracks`,
      headers: {
        Authorization: `Bearer ${BASIC_TOKEN}`,
      },
      params: {
        ids: trackIds.join(','),
      },
    })
    await new Promise((r) => setTimeout(r, 300))

    return res.data
  } catch (e) {
    console.error('getTracks failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const findTrack = async (
  track: BestTrack,
  retry = true
): Promise<SearchResults<SpotifyTrack>> => {
  try {
    const { name, artist, link, year } = track

    const params: SpotifySearchParams = {
      q: `track:${name} artist:${artist}`,
      type: 'track',
      limit: 1,
    }

    if (year) {
      params.q += ` year:${year}`
    }
    const albumId = extractSpotifyId(link, 'album')
    if (albumId) {
      params.q += ` album:${albumId}`
    }

    const res: AxiosResponse<SearchResults<SpotifyTrack>> = await axios({
      method: 'get',
      url: `${API_BASE_URL}/search`,
      headers: {
        Authorization: `Bearer ${BASIC_TOKEN}`,
      },
      params,
    })
    await new Promise((r) => setTimeout(r, 300))

    if (res.data.tracks.items.length === 0 && retry) {
      return findTrack(
        {
          ...track,
          name: normalizeTrackName(track as BestTrack),
          artist: normalizeArtistName(track as BestTrack),
          year: normalizeYear(track as BestTrack) as any,
          link: normalizeLink(track as BestTrack),
        },
        false // do not retry again
      )
    }

    if (process.env.JEST_WORKER_ID && !res.data.tracks.items.length) {
      console.log(res.request)
    }

    return res.data
  } catch (e) {
    console.error('findTrack failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const getMyPlaylists = async () => {
  try {
    const myPlaylists: SpotifyPlaylist[] = []

    let hasMore = false
    do {
      const res: AxiosResponse<PaginatedResponse<SpotifyPlaylist>> =
        await axios({
          method: 'get',
          url: `${API_BASE_URL}/me/playlists`,
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
          },
          params: {
            limit: 50,
            offset: myPlaylists.length,
          },
        })

      myPlaylists.push(...res.data.items)
      hasMore = !!res.data.next
    } while (hasMore)

    return myPlaylists
  } catch (e) {
    console.error('getMyPlaylists failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const createPlaylist = async (year: number) => {
  try {
    const newPlaylist: Omit<SpotifyPlaylist, 'id' | 'tracks'> = {
      name: `${PLAYLIST_NAME_PREFIX}${year}`,
      description: PLAYLIST_DESCRIPTION,
      public: true,
      collaborative: false,
    }

    const res: AxiosResponse<SpotifyPlaylist> = await axios({
      method: 'post',
      url: `${API_BASE_URL}/users/${SPOTIFY_JVB_USERID}/playlists`,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      data: newPlaylist,
    })

    return res.data
  } catch (e) {
    console.error('createPlaylist failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}
export const getPlaylistItems = async (playlistId: string) => {
  try {
    const playlistItems: PlaylistItem[] = []
    let hasMore = false
    do {
      const res: AxiosResponse<PaginatedResponse<PlaylistItem>> = await axios({
        method: 'get',
        url: `${API_BASE_URL}/playlists/${playlistId}/tracks`,
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        params: {
          limit: 50,
          offset: playlistItems.length,
        },
      })

      playlistItems.push(...res.data.items)
      hasMore = !!res.data.next
    } while (hasMore)

    return playlistItems
  } catch (e) {
    console.error('getPlaylistItems failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const addPlaylistItems = async (
  playlistId: string,
  trackIds: string[]
) => {
  try {
    const trackUris = trackIds.map((id) => idToUri(id, 'track'))

    for (let i = 0; i < trackUris.length; i += 100) {
      const uris = trackUris.slice(i, i + 100)

      await axios({
        method: 'post',
        url: `${API_BASE_URL}/playlists/${playlistId}/tracks`,
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
        },
        data: { uris },
      })
    }
  } catch (e) {
    console.error('addPlaylistItems failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}
export const updatePlaylistDescription = async (
  playlistId: string,
  description: string
) => {
  try {
    await axios({
      method: 'put',
      url: `${API_BASE_URL}/playlists/${playlistId}`,
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
      data: {
        description,
      },
    })
  } catch (e) {
    console.error('updatePlaylistDescription failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.cause)
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    console.error(e)
    throw e
  }
}

export const idToUri = (id: string, type: 'track') => {
  if (id.length !== SPOTIFY_ID_LENGTH) {
    throw new Error(`invalid spotify id ${JSON.stringify({ id })}`)
  }

  return `spotify:${type}:${id}`
}

// https://open.spotify.com/track/1nxudYVyc5RLm8LrSMzeTa?si=-G3WGzRgTDq8OuRa688FMg
// https://open.spotify.com/album/3BFHembK3fNseQR5kAEE2I
export const extractSpotifyId = (link: string, type: 'album' | 'track') => {
  if (!link) {
    return null
  }

  let url: URL | null = null

  try {
    url = new URL(link)
  } catch {}

  if (url === null) {
    return null
  }

  if (url.host !== SPOTIFY_DOMAIN) {
    return null
  }

  const [urlType, id] = url.pathname.split('/').slice(1)

  if (urlType !== type) {
    return null
  }

  if (id.length !== SPOTIFY_ID_LENGTH) {
    throw new Error(`failed to parse trackId ${JSON.stringify({ link, id })}`)
  }

  return id
}

export const getYearFromPlaylistName = (name: string) => {
  if (!name.startsWith(PLAYLIST_NAME_PREFIX)) {
    return null
  }

  let year: number | null = null

  try {
    year = parseInt(name.replace(PLAYLIST_NAME_PREFIX, ''))
  } catch {}

  return year
}

export const normalizeArtistName = (track: BestTrackProps) => {
  let normalized = track.artist
    .replace(/ & /g, ' ')
    .replace(/ and /g, ' ')
    .replace(/, /g, ' ')
    .replace(/ \/ /gi, ' ')
    .replace(/ \+ /gi, ' ')
    .replace(/ x /gi, ' ')
    .replace(/"/g, '')
    .replace(/'/g, '')

  return normalized
}
export const normalizeTrackName = (track: BestTrackProps) => {
  let normalized = track.name
    .replace(/"/g, '')
    .replace(/'/g, '')
    // probably need to review these replacements
    // likely ["/", ",", "&"] in trackname means tony's linked multiple tracks
    .replace(/\//g, '')
    .replace(/\\/g, '')
  // // https://stackoverflow.com/questions/4292468/javascript-regex-remove-text-between-parentheses#answer-4292483
  // .replace(/ *\([^)]*\)*/g, '')

  // prefer this:
  const openParensIdx = normalized.indexOf('(')
  const closeParensIdx = normalized.lastIndexOf(')')
  if (openParensIdx !== 1 && closeParensIdx !== 1) {
    const first = normalized.substring(0, openParensIdx).trim()
    const second = normalized.substring(closeParensIdx + 1)
    normalized = first + second
  }

  FEATURE_PREFIXES.forEach((pref) => {
    const ftIdx = normalized.toLowerCase().indexOf(pref)
    if (ftIdx !== -1) {
      normalized = normalized.substring(0, ftIdx)
    }
  })

  return normalized
}

export const normalizeYear = (track: BestTrackProps) => {
  // widen search by omitting year
  return undefined
}

export const normalizeLink = (track: BestTrackProps) => {
  // widen search by omitting link
  return ''
}
