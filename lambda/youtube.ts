import axios, { AxiosError, AxiosResponse } from 'axios'
import { getSsmParameter } from './ssm'

export const YOUTUBE_PLAYIST_ID = 'PLP4CSgl7K7or84AAhr7zlLNpghEnKWu2c'

const BASE_URL = 'https://www.googleapis.com/youtube/v3'

export type YoutubeVideo = {
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
}
export type ApiResponse<T> = {
  nextPageToken?: string
  prevPageToken?: string
  items: T[]
}
export type ApiQuery = {
  key: string
}
export type YoutubePlaylistItemQuery = ApiQuery & {
  playlistId: string
  part: string
  maxResults: number
  pageToken?: string
}

let API_KEY: string | undefined

export const getApiKey = async () => {
  if (!API_KEY) {
    API_KEY = await getSsmParameter(process.env.YOUTUBE_API_KEY_SSM)
  }
  return API_KEY
}

export const getYoutubePlaylistItems = async () => {
  try {
    const apiKey = await getApiKey()

    const allItems: YoutubeVideo[] = []
    let pageToken: string | undefined

    do {
      if (pageToken) {
        await new Promise((r) => setTimeout(r, 300))
      }

      const params: YoutubePlaylistItemQuery = {
        key: apiKey,
        playlistId: YOUTUBE_PLAYIST_ID,
        part: 'snippet,status',
        maxResults: 50,
        ...(!!pageToken && { pageToken }),
      }
      const res: AxiosResponse<ApiResponse<YoutubeVideo>> = await axios({
        method: 'get',
        url: `${BASE_URL}/youtubeplaylistItems`,
        params,
      })

      allItems.push(...res.data.items)
      pageToken = res.data.nextPageToken
    } while (!!pageToken)

    return allItems
  } catch (e) {
    console.error('getYoutubePlaylistItems failed')
    const axError = e as AxiosError
    if (axError.isAxiosError) {
      console.error('axios error')
      console.error(axError.response?.data)
      console.error(axError.response?.status)
      throw axError.toJSON()
    }

    throw e
  }
}
