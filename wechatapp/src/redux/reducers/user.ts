import Taro from '@tarojs/taro'
import { AnyAction } from 'redux'

import {
  GET_USER_DETAIL_SUCCESS,
} from '../actions/user'


export type UserDetail = {
  avatarUrl: string
  city?: string
  dateAdd?: string
  dateLogin?: string
  id?: number
  ipAdd?: string
  ipLogin?: string
  isIdcardCheck?: boolean
  isSeller?: boolean
  levelId?: number,
  levelRenew?: false
  mobile?: string
  nick?: string
  province?: string
  source?: number
  sourceStr?: string
  status?: 0
  statusStr?: string
}

export type INITIAL_STATE = {
  userDetail: UserDetail, // 用户信息
}

var INITIAL_STATE: INITIAL_STATE = {
  userDetail: {
    avatarUrl: '',
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
