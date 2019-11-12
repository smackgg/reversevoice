/*
  https://api.it120.cc/doc.html#/%E5%89%8D%E7%AB%AFapi%E6%8E%A5%E5%8F%A3%E6%96%87%E6%A1%A3/%E5%BE%AE%E4%BF%A1%E5%BC%80%E5%8F%91/amountUsingGET_7
  用户模块 api
*/
import request from '../utils/request'

// 检测登录token是否有效
export const checkToken = () => request({
  url: '/user/check-token',
  interceptTokenError: false,
})

// 登录
export const login = (data: { code: string, type?: number }) => request({
  url: '/user/wxapp/login',
  method: 'POST',
  data: {
    ...data,
    type: 2,
  },
  interceptTokenError: false,
})
