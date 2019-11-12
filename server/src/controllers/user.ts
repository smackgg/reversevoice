import User from '../models/User'
import { getWxAuthorization } from '../util/wechat'
// import { RouterContext } from 'koa-router'

// import { WriteError } from 'mongodb'
// import { check, sanitize, validationResult } from 'express-validator'

/**
 * GET /login
 * Login page.
 */
export const getLogin = async (ctx: any) => {
  const { code } = ctx.request.query
  if (!code) ctx.throw(401, 'no jscode')
  try {
    // 微信鉴权
    const data = await getWxAuthorization(code)
    // 更新数据库用户信息
    await User.findOneAndUpdate({ openid: data.openid }, data, {
      upsert: true,
    })

    // 更新 session
    ctx.session.sessionKey = data.session_key
    ctx.session.openid = data.openid
    ctx.body = {
      status: 200,
      message: 'ok',
    }
  } catch (e) {
    ctx.throw(400, e)
  }
}
