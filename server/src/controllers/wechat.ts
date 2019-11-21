import { getWxacodeUnlimit } from '../util/wechat'


// 获取用户信息
export const getWxacode = async (ctx: any) => {
  const { page, scene } = ctx.query
  const buffer = await getWxacodeUnlimit({
    page,
    scene,
  })

  ctx.body = {
    data: {
      imgUrl: buffer.toString('base64'),
    },
    code: 0,
    msg: 'ok',
  }
  // ctx.set('Content-Type', 'image/jpeg')
  // ctx.body = buffer
}
