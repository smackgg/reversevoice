import { path as ffprobePath } from '@ffmpeg-installer/ffmpeg'
import uuidv4 from 'uuid/v4'
import ffmpeg from 'fluent-ffmpeg'
import upLoadFile from '../util/qiniu'

// const ffprobePath = require('@ffprobe-installer/ffprobe').path;
// const ffmpeg = require('fluent-ffmpeg')
import path from 'path'

ffmpeg.setFfmpegPath(ffprobePath)


type QiniuReply = {
  hash: string;
  key: string;
}

const voiceHandler = (filepath: string): Promise<QiniuReply> => new Promise((resolve) => {
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
    .save(path.resolve(__dirname + '../../public/outp31.mp3'))
    .on('end', () => {
      console.log('Finished processing')
      upLoadFile('game', 'reverse_' + uuidv4() + '_reverse.mp3', path.resolve(__dirname + '../../public/outp31.mp3')).then((reply: QiniuReply) => {
        resolve(reply)
      })
    })

})
/**
 * GET /login
 * Login page.
 */
export const postUploadFile = async (ctx: any) => {
  // console.log(ctx.request.body)
  // console.log(ctx.request.files[0])
  const file = ctx.request.files[0]
  if (!file) {
    return ctx.throw(400, '请上传正确的文件')
  }
  try {
    const reply = await voiceHandler(file.path)
    ctx.body = {
      data: {
        path: `http://game.smackgg.cn/${reply.key}`,
      },
      code: 0,
    }
  } catch (error) {
    ctx.throw(500, error)
  }
  console.log(2222)
}
