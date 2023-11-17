import { join } from 'path'
import { S3_DIRS } from '../constants'
import { getS3FriendlyDate } from '../util'
import { putFile } from '../s3'

export const handler = async () => {
  console.log('handler invoked')

  const fileName = `${getS3FriendlyDate(new Date())}.txt`
  const filePath = join(S3_DIRS.TEST, fileName)

  await putFile(filePath, Date.now().toString())
}
