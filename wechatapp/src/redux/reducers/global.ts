import { AnyAction } from 'redux'
import { UPDATE_GLOBAL_DATA } from '../actions/global'

const INITIAL_STATE = {
  isConnected: true, // 是否断网状态
  launchOption: undefined, // app 启动参数
}

export default function global(state = INITIAL_STATE, action: AnyAction) {
  switch (action.type) {
    case UPDATE_GLOBAL_DATA:
      return {
        ...state,
        ...action.data,
      }
    default:
      return state
  }
}
