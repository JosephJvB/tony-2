import { google, sheets_v4 } from 'googleapis'

export const BASE_SHEET_URL = 'https://docs.google.com/spreadsheets/d'
export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

export let SPREADSHEET_ID = '1F5DXCTNZbDy6mFE3Sp1prvU2SfpoqK0dZRsXVHiiOfo'
export const test__setSheetId = (id: string) => {
  if (!process.env.JEST_WORKER_ID) {
    throw new Error('get te fuk u junkie')
  }
  SPREADSHEET_ID = id
}
export const SHEETS = {
  MISSING_TRACKS: {
    NAME: 'MELON',
    ID: 1814426117,
    RANGES: {
      ALL_ROWS: 'A2:F',
    },
  },
  PARSED_VIDEOS: {
    ID: 123,
    NAME: 'parsed videos',
    RANGES: {
      ALL_ROWS: 'A2:C',
    },
  },
} as const

export type MissingTrack = {
  id: string
  name: string
  artist: string
  date: string
  link: string
  spotify_id: string
}
export const rowToTrack = (row: string[]): MissingTrack => ({
  id: row[0],
  name: row[1],
  artist: row[2],
  date: row[3],
  link: row[4],
  spotify_id: row[5] ?? '',
})
export const trackToRow = (track: MissingTrack): string[] => [
  track.id,
  track.name,
  track.artist,
  track.date,
  track.link,
  track.spotify_id ?? '',
]
export type ParsedVideo = {
  id: string
  title: string
  published_at: string
}
export const rowToVideo = (row: string[]): ParsedVideo => ({
  id: row[0],
  title: row[1],
  published_at: row[2],
})
export const videoToRow = (video: ParsedVideo): string[] => [
  video.id,
  video.title,
  video.published_at,
]

let _client: sheets_v4.Sheets | undefined

export const getClient = () => {
  if (!_client) {
    // https://stackoverflow.com/questions/30400341/environment-variables-containing-newlines-in-node
    const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY.replace(/\\n/g, '\n')
    const authClient = new google.auth.GoogleAuth({
      scopes: SCOPES,
      credentials: {
        private_key: privateKey,
        client_email: process.env.GOOGLE_SA_CLIENT_EMAIL,
      },
    })
    _client = google.sheets({
      version: 'v4',
      auth: authClient,
    })
  }
  return _client
}

export const getRows = async (sheetName: string, range: string) => {
  const res = await getClient().spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  })

  return res.data.values ?? []
}

export const addRows = async (
  sheetName: string,
  range: string,
  rows: string[][]
) => {
  await getClient().spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    includeValuesInResponse: true,
    requestBody: {
      majorDimension: 'ROWS',
      values: rows,
    },
  })
}

export const upsertRows = async (
  sheetName: string,
  range: string,
  rows: string[][]
) => {
  await getClient().spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
    valueInputOption: 'RAW',
    includeValuesInResponse: true,
    requestBody: {
      majorDimension: 'ROWS',
      values: rows,
    },
  })
}

export const clearRows = async (sheetName: string, range: string) => {
  await getClient().spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${range}`,
  })
}
