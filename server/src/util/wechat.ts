import request from 'request'
import crypto from 'crypto'
import { APP_ID, APP_SECRET } from '../util/secrets'
// 获取微信鉴权
export const getWxAuthorization = (code: string): Promise<any> => new Promise((resolve, reject) => {
  request(`https://api.weixin.qq.com/sns/jscode2session?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const data = JSON.parse(body)
      if (data.errcode) {
        reject(new Error(data.errmsg))
        return
      }
      resolve(data)
    } else {
      reject(new Error(error))
    }
  })
})

export class WXBizDataCrypt {
  appId: string
  sessionKey: string

  constructor(sessionKey?: string, appId?: string) {
    this.sessionKey = sessionKey
    this.appId = appId || APP_ID
  }

  decryptData(encryptedData: any, iv: any) {
    // base64 decode
    const sessionKey = Buffer.from(this.sessionKey, 'base64')
    encryptedData = Buffer.from(encryptedData, 'base64')
    iv = Buffer.from(iv, 'base64')
    let decoded
    try {
      // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, iv)
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true)
      decoded = decipher.update(encryptedData, 'binary', 'utf8')
      decoded += decipher.final('utf8')

      decoded = JSON.parse(decoded)
    } catch (err) {
      throw new Error('Illegal Buffer 1 ')
    }

    if (decoded.watermark.appid !== this.appId) {
      throw new Error('Illegal Buffer2 ')
    }

    return decoded
  }
}

// access_token
// https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=APPID&secret=APPSECRET
export const getAccessToken = (): Promise<any> => new Promise((resolve, reject) => {
  request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APP_ID}&secret=${APP_SECRET}`, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const data = JSON.parse(body)

      if (data.errcode) {
        reject(new Error(data.errmsg))
        return
      }
      resolve(data)
    } else {
      reject(new Error(error))
    }
  })
})

// 获取小程序二维码
export const getWxacodeUnlimit = ({
  scene = 'test=1',
  page = 'pages/index/index',
}: {
  scene?: string;
  page?: string;
}): Promise<any> => new Promise(async (resolve, reject) => {
  const { access_token: accessToken } = await getAccessToken()
  request.post({
    url: `https://api.weixin.qq.com/wxa/getwxacodeunlimit?access_token=${accessToken}`,
    // body: `access_token=${accessToken}&scene=${scene}&page=${page}`,
    encoding: null,
    form: JSON.stringify({
      scene,
      page,
    }),
  }, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      resolve(body)
    } else {
      reject(new Error(error))
    }
  })
})

