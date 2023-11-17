import { join } from 'path'
import { getS3FriendlyDate } from './util'
import { putFile } from './s3'

export const handler = async () => {
  const baseDir = getS3FriendlyDate(new Date())
  const filePath = join(baseDir, 'test.txt')

  await putFile(filePath, Date.now().toString())
}
