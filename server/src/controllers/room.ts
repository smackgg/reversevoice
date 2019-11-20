import Room from '../models/Room'
import User from '../models/User'

/**
 * POST /room
 * 新建房间.
 */
export const postCreateRoom = async (ctx: any) => {
  await ctx.needWechatLogin()
  const openid = ctx.session.openid
  const user = await User.findOne({ openid })

  const {
    oriAudioUrl,
    revAudioUrl,
  } = ctx.request.fields

  try {
    const room = await new Room({
      owner: {
        id: user._id,
        nickName: user.profile.nickName,
        avatarUrl: user.profile.avatarUrl,
        oriAudio: {
          url: oriAudioUrl,
        },
        revAudio: {
          url: revAudioUrl,
        },
      },
    }).save()

    ctx.body = {
      code: 0,
      msg: 'ok',
      data: {
        roomId: room._id,
      },
    }
  } catch (error) {
    ctx.throw(400, error)
  }
}

/**
 * GET /room
 * 获取房间详情
 */
export const getRoom = async (ctx: any) => {
  const { id } = ctx.query
  console.log(id)
  const room = await Room.findById(id)
  ctx.body = {
    data: room || null,
    code: 0,
    msg: 'ok',
  }
}
