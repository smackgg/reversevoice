import Router from 'koa-router'
import { postLogin, getUserInfo } from '../controllers/user'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/user')
// async (ctx) => {
//   await ctx.needWechatLogin()
//   console.log(ctx)
// }
router.post('/login', async ctx => postLogin(ctx))
router.get('/detail', async ctx => getUserInfo(ctx))


// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
