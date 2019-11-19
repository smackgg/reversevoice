import request from '../utils/request'

// 检测登录token是否有效
export const deleteFile = (data: { path: string }) => request({
  url: '/api/file/mp3/reverse',
  data,
  method: 'DELETE',
})
