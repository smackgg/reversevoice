
/* eslint-disable @typescript-eslint/camelcase */
import qiniu from 'node-qiniu'
import { QINIU_ACCESS_KEY, QINIU_SECRET_KEY } from './secrets'

qiniu.config({
  access_key: QINIU_ACCESS_KEY,
  secret_key: QINIU_SECRET_KEY,
  uploadUrl: 'up-z2.qiniup.com',
})

const upLoadFile = (bucket = 'revers-voice', filename: string, path: string) => {
  const imagesBucket = qiniu.bucket(bucket)
  return new Promise((resolve, reject) => {
    // console.log(imageName)
    imagesBucket.putFile(filename, path, (err: any, reply: any) => {
      if (err) {
        reject(err)
        return
      }
      console.log(reply)
      resolve(reply)
    })
  })
}

// module.exports = upLoadFile
export default upLoadFile
