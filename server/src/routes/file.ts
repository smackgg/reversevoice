import Router from 'koa-router'
import { postUploadFile } from '../controllers/file'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/file')
// async (ctx) => {
//   await ctx.needWechatLogin()
//   console.log(ctx)
// }
router.post('/upload', async ctx => postUploadFile(ctx))



// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
