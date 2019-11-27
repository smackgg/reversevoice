import Router from 'koa-router'
import { postLogin, getUserInfo } from '../controllers/user'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/user')

router.post('/login', async ctx => postLogin(ctx))
router.get('/detail', async ctx => getUserInfo(ctx))

module.exports = router
