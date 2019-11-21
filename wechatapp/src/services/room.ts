import request from '../utils/request'

export const createRoom = (data: {
  oriAudioUrl: string;
  revAudioUrl: string;
}) => request({
  url: '/api/room',
  method: 'POST',
  data,
})

export const getRoomDetail = (data: { id: string }) => request({
  url: '/api/room',
  data,
})

export const joinRoom = (data: {
  oriAudioUrl: string;
  revAudioUrl: string;
  id: string;
}) => request({
  url: '/api/room',
  method: 'PUT',
  data,
})

export const star = (data: {
  userId: string,
  roomId: string
}) => request({
  url: '/api/room/star',
  method: 'PUT',
  data,
})
