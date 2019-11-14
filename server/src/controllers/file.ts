import { path as ffprobePath } from '@ffmpeg-installer/ffmpeg'
import uuidv4 from 'uuid/v4'
import ffmpeg from 'fluent-ffmpeg'
// import upLoadFile from '../util/qiniu'
import fs from 'fs'
import dateFormat from '../util/dateFormat'
import { cErr } from '../util'

// const ffprobePath = require('@ffprobe-installer/ffprobe').path;
// const ffmpeg = require('fluent-ffmpeg')
import path from 'path'

ffmpeg.setFfmpegPath(ffprobePath)


type QiniuReply = {
  hash: string;
  key: string;
}

// 反转视频
const reverseVoice = (filepath: string): Promise<string> => new Promise((resolve, reject) => {
  const folderPath = dateFormat(new Date(), 'YYYY_MM_dd') + '/'
  const publicPath = path.resolve((__dirname + '../../public/' + folderPath))
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath)
  }
  const saveFilePath = '/reverse_' + uuidv4() + '_reverse.mp3'

  ffmpeg(filepath)
    .format('mp4')
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
    .save(publicPath + saveFilePath)
    .on('end', () => {
      resolve(folderPath + saveFilePath)
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
  const [err, saveFilePath] = await cErr(reverseVoice(file.path))
  if (err) {
    ctx.throw(500, err)
    return
  }
  ctx.body = {
    data: {
      path: saveFilePath,
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

  fs.unlinkSync(path.resolve((__dirname + '../../public/' + filepath)))

  ctx.body = {
    code: 0,
  }
}
