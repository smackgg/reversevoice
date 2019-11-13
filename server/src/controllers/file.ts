import { path as ffprobePath } from '@ffmpeg-installer/ffmpeg'
import uuidv4 from 'uuid/v4'
import ffmpeg from 'fluent-ffmpeg'
import upLoadFile from '../util/qiniu'
import fs from 'fs'
import dateFormat from '../util/dateFormat'

// const ffprobePath = require('@ffprobe-installer/ffprobe').path;
// const ffmpeg = require('fluent-ffmpeg')
import path from 'path'

ffmpeg.setFfmpegPath(ffprobePath)


type QiniuReply = {
  hash: string;
  key: string;
}

const voiceHandler = (filepath: string): Promise<string> => new Promise((resolve) => {
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
 * GET /login
 * Login page.
 */
export const postMp3Reverse = async (ctx: any) => {
  // console.log(ctx.request.body)
  // console.log(ctx.request.files[0])
  const file = ctx.request.files[0]
  if (!file) {
    return ctx.throw(400, '请上传正确的文件')
  }
  try {
    // const reply = await voiceHandler(file.path)
    const saveFilePath = await voiceHandler(file.path)

    ctx.body = {
      data: {
        // path: `http://game.smackgg.cn/${reply.key}`,
        path: saveFilePath,
      },
      code: 0,
    }
  } catch (error) {
    ctx.throw(500, error)
  }
}

export const deleteMp3Reverse = async (ctx: any) => {
  const { path: filepath } = ctx.query

  fs.unlinkSync(path.resolve((__dirname + '../../public/' + filepath)))

  ctx.body = {
    code: 0,
  }
}
