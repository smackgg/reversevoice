import Taro from '@tarojs/taro'
import { AnyAction } from 'redux'

import {
  GET_USER_DETAIL_SUCCESS,
} from '../actions/user'



export type UserDetail = {
  profile: {
    avatarUrl: string,
    nickName: string,
  }
  isLogin: boolean;
  _id: string;
  rooms?: {
    _id: string,
    id: string,
    createAt: string,
  }[],
  joinedRooms?: {
    _id: string,
    id: string,
    createAt: string,
    owner: {
      avatarUrl: string,
      nickName: string,
    }
  }[],
}

export type INITIAL_STATE = {
  userDetail: UserDetail, // 用户信息
}

var INITIAL_STATE: INITIAL_STATE = {
  userDetail: {
    isLogin: false,
    _id: '',
    rooms: [],
    joinedRooms: [],
    profile: {
      avatarUrl: '',
      nickName: '',
    },
  },
}

const sortRoom = (rooms: any) => rooms.sort((a: any, b: any) => (new Date(a.createAt).getTime() - new Date(b.createAt).getTime()) > 0 ? -1 : 1)

export default function user(state = INITIAL_STATE, action: AnyAction): INITIAL_STATE {
  switch (action.type) {
    case GET_USER_DETAIL_SUCCESS:
      return {
        ...state,
        userDetail: {
          ...state.userDetail,
          ...action.data,
          rooms: sortRoom(action.data.rooms || []),
          joinedRooms: sortRoom(action.data.joinedRooms || []),
        },
      }
    default:
      return state
  }
}
