import Router from 'koa-router'
import { postMp3Reverse, deleteMp3Reverse } from '../controllers/file'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/file')
// async (ctx) => {
//   await ctx.needWechatLogin()
//   console.log(ctx)
// }
router.post('/mp3/reverse', async ctx => postMp3Reverse(ctx))

router.delete('/mp3/reverse', async ctx => deleteMp3Reverse(ctx))



// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
