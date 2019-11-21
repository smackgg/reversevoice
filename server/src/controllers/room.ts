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

    await User.findOneAndUpdate({
      openid,
    }, {
      $push: {
        rooms: {
          id: room._id,
          createAt: room.createdAt,
        },
      },
    })

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
 * PUT /room
 * 新建房间.
 */
export const putJoinRoom = async (ctx: any) => {
  await ctx.needWechatLogin()
  const openid = ctx.session.openid

  const {
    oriAudioUrl,
    revAudioUrl,
    id,
  } = ctx.request.fields

  const [user, room] = await Promise.all([
    await User.findOne({ openid }),
    await Room.findById(id, {
      _id: 0,
    }),
  ])

  if (!room) {
    ctx.throw(400, '没有该挑战！')
  }
  try {
    await Promise.all([
      Room.findByIdAndUpdate(id, {
        $push: {
          users: {
            id: user._id,
            nickName: user.profile.nickName,
            avatarUrl: user.profile.avatarUrl,
            oriAudio: {
              url: oriAudioUrl,
            },
            revAudio: {
              url: revAudioUrl,
            },
            createAt: room.createdAt,
          },
        },
      }),
      User.findOneAndUpdate({
        openid,
      }, {
        $push: {
          joinedRooms: {
            createAt: room.createdAt,
            id,
            owner: {
              nickName: user.profile.nickName,
              avatarUrl: user.profile.avatarUrl,
            },
          },
        },
      }),
    ])

    ctx.body = {
      code: 0,
      msg: 'ok',
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


/**
 * GET /room
 * 获取房间详情
 */
export const putRoomUserStars = async (ctx: any) => {
  await ctx.needWechatLogin()
  // const { id } = ctx.query
  // console.log(id)
  const {
    userId,
    roomId,
  } = ctx.request.fields

  const openid = ctx.session.openid

  const [user, room] = await Promise.all([
    await User.findOne({ openid }),
    await Room.findById(roomId),
  ])

  room.users = room.users.map((u) => {
    if (u._id.toString() === userId) {
      u.stars.push(user._id.toString())
    }
    return u
  })


  room.save()

  ctx.body = {
    data: room || null,
    code: 0,
    msg: 'ok',
  }
}
