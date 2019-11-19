import Taro from '@tarojs/taro'
import { AnyAction } from 'redux'

import {
  GET_USER_DETAIL_SUCCESS,
} from '../actions/user'


export type UserDetail = {
  isLogin: boolean
}

export type INITIAL_STATE = {
  userDetail: UserDetail, // 用户信息
}

var INITIAL_STATE: INITIAL_STATE = {
  userDetail: {
    isLogin: false,
  },
}

export default function user(state = INITIAL_STATE, action: AnyAction): INITIAL_STATE {
  switch (action.type) {
    case GET_USER_DETAIL_SUCCESS:
      return {
        ...state,
        userDetail: action.data,
      }
    default:
      return state
  }
}
