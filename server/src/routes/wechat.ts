import Router from 'koa-router'
import { getWxacode } from '../controllers/wechat'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/wechat')
// async (ctx) => {
//   await ctx.needWechatLogin()
//   console.log(ctx)
// }

router.get('/getwxacodeunlimit', async ctx => getWxacode(ctx))

module.exports = router
