import { Context, Next } from 'koa'

export default async function (ctx: Context, next: Next) {
  ctx.needWechatLogin = async () => {
    if (!ctx.session.openid) {
      // 未登录
      ctx.throw(401, '微信登录失效')
    }
  }
  next()
}
