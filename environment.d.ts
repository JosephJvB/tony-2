import { LambdaEnv } from './lib/tony2-lambda/tony2Lambda'
import { WebAssetsLambdaEnv } from './lib/web-assets-lambda/webAssetsLambda'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends LambdaEnv, WebAssetsLambdaEnv {
      JEST_WORKER_ID?: string
    }
  }
}

export {}
