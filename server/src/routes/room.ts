import Router from 'koa-router'
import { postCreateRoom, getRoom } from '../controllers/room'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api')

router.post('/room', async ctx => postCreateRoom(ctx))
router.get('/room', async ctx => getRoom(ctx))


// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
