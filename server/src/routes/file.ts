import Router from 'koa-router'
import { postMp3Reverse, deleteMp3Reverse, postMp3Upload } from '../controllers/file'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/file')

router.post('/mp3/reverse', async ctx => postMp3Reverse(ctx))

router.delete('/mp3/reverse', async ctx => deleteMp3Reverse(ctx))

router.post('/mp3/upload', async ctx => postMp3Upload(ctx))

module.exports = router
