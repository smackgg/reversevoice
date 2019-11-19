import request from '../utils/request'

// 登录
export const login = (data: { code: string; iv: string; encryptedData: string }) => request({
  url: '/api/user/login',
  method: 'POST',
  data,
  setToken: true,
})

export const userDetail = () => request({
  url: '/api/user/detail',
})
