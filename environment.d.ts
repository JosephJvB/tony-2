import { SupportLambdaEnv } from './lib/support-lambda/supportLambda'
import { LambdaEnv } from './lib/tony2-lambda/tony2Lambda'

declare global {
  namespace NodeJS {
    interface ProcessEnv extends LambdaEnv, SupportLambdaEnv {
      JEST_WORKER_ID?: string
    }
  }
}

export {}
