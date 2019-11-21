import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import uuidv4 from 'uuid/v4'
import ffmpeg from 'fluent-ffmpeg'
// import upLoadFile from '../util/qiniu'
import fs from 'fs'
import dateFormat from '../util/dateFormat'
import { cErr } from '../util'
import { MEDIA_URL } from '../util/secrets'
import Errors from '../errors'
import upLoadFile from '../util/qiniu'

import path from 'path'

ffmpeg.setFfmpegPath(ffmpegPath.path)
ffmpeg.setFfprobePath(ffprobePath.path)

type QiniuReply = {
  hash: string;
  key: string;
}

// 反转视频
const reverseVoice = (filepath: string): Promise<{
  path: string;
  duration: number;
}> => new Promise((resolve, reject) => {
  const folderPath = dateFormat(new Date(), 'YYYY_MM_dd')
  const publicPath = path.resolve((__dirname + '../../public/' + folderPath))
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath)
  }
  const saveFilePath = '/reverse_' + uuidv4() + '_reverse.mp3'
  // const match = filepath.match(/\.durationTime=(\d+)/)
  // console.log(fileName)
  // const duration = Number(match && match[1] ? match[1] : 0)
  ffmpeg(filepath)
    .format('mp4')
    // .duration(duration / 1000)

    .outputOptions([
      // '-c copy',
      '-vf reverse',
      '-af areverse',
      '-preset',
      'superfast',
      '-y',
      // '-shortest'
    ])
    .on('progress', (progress) => {
      console.log(`Processing: ${progress.percent}% done`)

      // send upload progress
      console.log('upload-file-progress', progress.percent)
    })
    .on('error', (err) => {
      reject()
      // this.sendErrorMessageToReander('Ffmpeg has been killed' + err.message);
      console.log(`Ffmpeg has been killed${err.message}`)
    })
    .toFormat('mp3')
    // .duration(duration / 1000)
    .save(publicPath + saveFilePath)
    .on('end', () => {
      ffmpeg.ffprobe(publicPath + saveFilePath, (err, metadata) => {
        // console.log(err, metadata)
        resolve({
          path: folderPath + saveFilePath,
          duration: metadata.format.duration,
        })
      })
    })

})
/**
 * POST /api/mp3/reverse
 * 反转音频
 */
export const postMp3Reverse = async (ctx: any) => {
  const file = ctx.request.files[0]

  if (!file) {
    return ctx.throw(400, '请上传正确的文件')
  }
  // const reply = await reverseVoice(file.path)
  const [err, reverseRes] = await cErr(reverseVoice(file.path, file.name))
  if (err) {
    ctx.throw(500, err)
    return
  }
  ctx.body = {
    data: {
      path: reverseRes.path,
      duration: reverseRes.duration,
    },
    code: 0,
  }
}

/**
 * DELETE /api/mp3/reverse
 * 删除临时资源.
 */
export const deleteMp3Reverse = async (ctx: any) => {
  const { path: filepath } = ctx.query
  if (!/\.mp3/.test(filepath)) {
    ctx.body = {
      code: Errors['ERROR_FORMAT'],
      message: 'ERROR_FORMAT',
    }
  }
  fs.unlinkSync(path.resolve((__dirname + '../../public/' + filepath)))

  ctx.body = {
    code: 0,
  }
}

/**
 * POST /api/mp3/upload
 * 上传文件.
 */

export const postMp3Upload = async (ctx: any) => {
  const file = ctx.request.files[0]
  if (!file) {
    return ctx.throw(400, '请上传正确的文件')
  }

  const { duration = 0 } = ctx.request.fields
  // const reply = await reverseVoice(file.path)
  // const [err, saveFilePath] = await cErr(reverseVoice(file.path))
  const [err, result] = await cErr(upLoadFile('reverse-voice', `${uuidv4()}.durationTime=${duration * 1000}.mp3`, file.path))
  if (err || result.error) {
    ctx.throw(500, err || result.error)
    return
  }
  ctx.body = {
    data: {
      path: MEDIA_URL + result.key,
    },
    code: 0,
  }
}
