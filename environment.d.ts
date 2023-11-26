declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_CLIENT_EMAIL_SSM: string
      GOOGLE_PRIVATE_KEY_SSM: string
      S3_BUCKET: string
      SPOTIFY_CLIENT_ID_SSM: string
      SPOTIFY_SECRET_SSM: string
      SPOTIFY_REFRESH_TOKEN_SSM: string
      YOUTUBE_API_KEY_SSM: string
      JEST_WORKER_ID?: string
    }
  }
}

export {}
