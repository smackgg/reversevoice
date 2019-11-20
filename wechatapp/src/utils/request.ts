import Taro, { RequestParams } from '@tarojs/taro'
import { API_URL } from '.'

export default (option: RequestParams): Promise<Request.requestResult> => new Promise((resolve, reject) => {
  let { url, data = {}, setToken } = option

  // 删减没有数据的参数
  const requestData = Object.keys(data).reduce((pre: { [key: string]: any }, key) => {
    if (data[key] !== undefined) {
      pre[key] = data[key]
    }
    return pre
  }, {})

  // 请求携带 token
  const token = Taro.getStorageSync('token')

  Taro.request({
    ...option,
    data: requestData,
    url: API_URL + url,
    header: {
      // 'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': token,
    },
    success: res => {
      if (setToken) {
        const cookie = res.header['Set-Cookie']
        if (cookie) {
          Taro.setStorageSync('token', cookie)
        }
      }
      if (res && res.statusCode === 200 && res.data.code === 0) {
        resolve(res.data)
        return
      }
      reject(res && res.data)
    },
    fail: error => reject(error),
  })
})
