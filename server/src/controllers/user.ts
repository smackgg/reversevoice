import User from '../models/User'
import { getWxAuthorization, WXBizDataCrypt } from '../util/wechat'
// import { getWxAuthorization } from '../util/wechat'

// import { RouterContext } from 'koa-router'
// import { WriteError } from 'mongodb'
// import { check, sanitize, validationResult } from 'express-validator'

/**
 * POST /login
 * Login page.
 */
export const postLogin = async (ctx: any) => {
  const { code, iv, encryptedData } = ctx.request.fields

  if (!code) ctx.throw(401, 'no jscode')
  try {
    // 微信鉴权
    const data = await getWxAuthorization(code)

    let userData: any = {
      openid: data.openid,
    }
    if (iv && encryptedData) {
      const pc = new WXBizDataCrypt(data.session_key)
      const { openId, unionId, ...profile } = pc.decryptData(encryptedData, iv)
      userData = {
        openid: openId,
        unionId,
        profile,
      }
    }

    // 更新数据库用户信息
    await User.findOneAndUpdate({ openid: data.openid }, userData, {
      upsert: true,
    })

    // 更新 session
    ctx.session.sessionKey = data.session_key
    ctx.session.openid = data.openid

    ctx.body = {
      code: 0,
      message: 'ok',
    }
  } catch (e) {
    ctx.throw(400, e)
  }
}


// 获取用户信息
export const getUserInfo = async (ctx: any) => {

  const { openid, sessionKey } = ctx.session
  if (!(openid && sessionKey)) {
    ctx.body = {
      data: {
        isLogin: false,
      },
      code: 401,
      msg: '登录失效',
    }
    return
  }
  const user = await User.findOne({
    openid,
  })

  ctx.body = {
    data: {
      isLogin: true,
      ...JSON.parse(JSON.stringify(user)),
    },
    code: 0,
    msg: 'ok',
  }
}
