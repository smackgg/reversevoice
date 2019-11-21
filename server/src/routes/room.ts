import Router from 'koa-router'
import { postCreateRoom, getRoom, putJoinRoom, putRoomUserStars } from '../controllers/room'

const router = new Router<null, { needWechatLogin(): void }>()

router.prefix('/api/room')

router.post('/', async ctx => postCreateRoom(ctx))
router.get('/', async ctx => getRoom(ctx))
router.put('/', async ctx => putJoinRoom(ctx))
router.put('/star', async ctx => putRoomUserStars(ctx))

// router.put('/userinfo', async (ctx) => updateUserInfo(ctx))

// router.get('/userinfo', async (ctx) => getUserInfo(ctx))

module.exports = router
