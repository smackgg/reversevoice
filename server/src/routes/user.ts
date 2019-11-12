import Router from 'koa-router'
import { getLogin } from '../controllers/user'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/user')
// async (ctx) => {
//   await ctx.needWechatLogin()
//   console.log(ctx)
// }
router.get('/login', async ctx => getLogin(ctx))



// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
