import Taro, { RequestParams } from '@tarojs/taro'

import { getCurrentPageUrl } from '../utils'

export default (option: RequestParams): Promise<Request.requestResult> => new Promise((resolve, reject) => {
  let { url, data = {} } = option
  // 删减没有数据的参数
  const requestData = Object.keys(data).reduce((pre: { [key: string]: any }, key) => {
    if (data[key] !== undefined) {
      pre[key] = data[key]
    }
    return pre
  }, {})

  // 请求携带 token
  const token = Taro.getStorageSync('token')
  if (token) {
    url += `${/\?/.test(url) ? '&' : '?'}token=${token}`
  }

  Taro.request({
    ...option,
    data: requestData,
    url: url,
    header: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    success: res => {
      // token 失效
      // if (res && res.statusCode === 200 && res.data.code === 2000) {
      //   Taro.redirectTo({
      //     url: `/pages/authorize/index?from=${encodeURIComponent(getCurrentPageUrl())}`,
      //   })
      //   return
      // }
      if (res && res.statusCode === 200 && res.data.code === 0) {
        resolve(res.data)
        return
      }
      reject(res && res.data)
    },
    fail: error => reject(error),
  })
})
