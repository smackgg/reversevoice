import Router from 'koa-router'
import { getWxacode } from '../controllers/wechat'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/wechat')

router.get('/getwxacodeunlimit', async ctx => getWxacode(ctx))

module.exports = router
