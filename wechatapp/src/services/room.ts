import request from '../utils/request'

export const createRoom = (data: {
  oriAudioUrl: string;
  revAudioUrl: string;
}) => request({
  url: '/api/room',
  method: 'POST',
  data,
  setToken: true,
})

export const getRoomDetail = (data: { id: string }) => request({
  url: '/api/room',
  data,
})
