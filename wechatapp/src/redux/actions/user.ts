import { Dispatch } from 'redux'
import {
  userDetail,
} from '../../services/user'
// import { cError } from '@/utils'

export const GET_USER_DETAIL_SUCCESS = 'config/GET_USER_DETAIL_SUCCESS'

// 用户详情
export const getUserDetail = () => async (dispatch: Dispatch) => {
  const res = await userDetail()
  const { base, ext = {} } = res.data
  dispatch({
    type: GET_USER_DETAIL_SUCCESS,
    data: {
      ...base,
      ext,
    },
  })
  return res.data.base
}
