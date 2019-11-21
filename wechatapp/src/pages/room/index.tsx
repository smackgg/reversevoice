import { ComponentClass } from 'react'
import Taro, { Component, Config, InnerAudioContext } from '@tarojs/taro'
// import { connect } from '@tarojs/redux'
import { View, Block, Image, Button } from '@tarojs/components'
import classNames from 'classnames'
import { getDurationByFilePath } from '@/utils/reverse'
import withShare from '@/components/@withShare'
import { connect } from '@tarojs/redux'
import { AtActionSheet, AtActionSheetItem } from 'taro-ui'

import { getRoomDetail, star } from '@/services/room'
import { cError, getTimeStr } from '@/utils'

import waveBlockIcon from '@/assets/images/wave-block.png'
import { UserDetail } from '@/redux/reducers/user'
import playIcon from '@/assets/images/play.png'
import pauseIcon from '@/assets/images/pause.png'
import stopIcon from '@/assets/images/stop.png'
import srophyIcon from '@/assets/images/trophy.png'
import hurtIcon from '@/assets/images/hurt.png'
import hurtActiveIcon from '@/assets/images/hurt-active.png'
// import closeIcon from '@/assets/images/close.png'
// import closeBlackIcon from '@/assets/images/close-black.png'


import './index.scss'

// #region 书写注意
//
// 目前 typescript 版本还无法在装饰器模式下将 Props 注入到 Taro.Component 中的 props 属性
// 需要显示声明 connect 的参数类型并通过 interface 的方式指定 Taro.Component 子类的 props
// 这样才能完成类型检查和 IDE 的自动提示
// 使用函数模式则无此限制
// ref: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20796
//
// #endregion

type PageStateProps = {
  userDetail: UserDetail
}

type PageDispatchProps = {
}

type PageOwnProps = {}

interface RoomUserSchema {
  // id: string;
  nickName: string;
  avatarUrl: string;
  oriAudio: {
    url: string;
  };
  revAudio: {
    url: string;
  };
  id: string;
  _id?: string;
}

type PageState = {
  owner: RoomUserSchema,
  users: (RoomUserSchema & { stars: string[] })[],
  durationTime: number,
  currentTime: number,
  activeIndex: number,
  playStatus: 0 | 1 | 2 // 0-停止 1-播放中 2-暂停,
  showActionSheet: boolean,
  ratio: number,
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Room {
  props: IProps
}

@connect(({ user }) => ({
  userDetail: user.userDetail,
}))

@withShare()
class Room extends Component {
  /**
 * 指定config的类型声明为: Taro.Config
 *
 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
 */
  config: Config = {
    navigationBarTitleText: '首页',
  }

  $shareOptions = {
    title: '倒放挑战！你能听懂我倒立洗头~',
    path: 'pages/index/index',
    imageUrl: '',
  }

  roomId: string
  innerAudioContext: InnerAudioContext
  canplay = false
  // timer?: number
  // RecorderManager: RecorderManager
  // tempFilePath?: string

  state: PageState = {
    // recording: false,
    activeIndex: 0,
    owner: {
      nickName: '',
      avatarUrl: '',
      oriAudio: {
        url: '',
      },
      revAudio: {
        url: '',
      },
      id: '',
    },
    users: [],
    durationTime: 0,
    currentTime: 0,
    playStatus: 0,
    showActionSheet: false,
    ratio: -1,
  }

  async componentDidShow() {
    // let innerAudioContext = Taro.createInnerAudioContext()
    // Taro.setInnerAudioOption({
    //   obeyMuteSwitch: false,
    // })
    // this.innerAudioContext = innerAudioContext

    // this.innerAudioContext.onTimeUpdate(() => {
    //   this.setState({
    //     currentTime: this.innerAudioContext.currentTime,
    //   })
    // })
    // this.innerAudioContext.onEnded(() => {
    //   this.onStop(this.state.activeIndex)
    //   this.setState({
    //     currentTime: this.state.durationTime,
    //   })
    // })

    let { roomId } = this.$router.params
    this.roomId = roomId
    console.log('roomId: ', this.roomId)
    this.$shareOptions.path = `pages/room/index?roomId=${roomId}`

    const [error, res] = await cError(getRoomDetail({
      id: this.roomId,
    }))

    if (error) {
      //  此房间不存在
      return
    }
    this.setState({
      owner: res.data.owner,
      users: res.data.users,
    })
  }

  initAudio = (url: string) => new Promise(resolve => {
    Taro.setInnerAudioOption({
      obeyMuteSwitch: false,
    })

    if (this.innerAudioContext && this.innerAudioContext.src === url && this.canplay) {
      return resolve()
    }

    Taro.showLoading({
      title: '加载资源中...',
    })
    this.canplay = false

    if (this.innerAudioContext) {
      this.innerAudioContext.destroy()
      this.innerAudioContext.offCanplay()
      this.innerAudioContext.offTimeUpdate()
      this.innerAudioContext.offEnded()
    }

    this.innerAudioContext = Taro.createInnerAudioContext()

    this.innerAudioContext.onTimeUpdate(() => {
      this.setState({
        currentTime: this.innerAudioContext.currentTime,
      })
    })

    this.innerAudioContext.onEnded(() => {
      this.onStop(this.state.activeIndex)
      this.setState({
        currentTime: this.state.durationTime,
      })
    })

    this.innerAudioContext.onCanplay(() => {
      Taro.hideLoading()
      resolve()
      this.canplay = true
    })

    if (this.innerAudioContext.src !== url) {
      this.innerAudioContext.src = url
      Taro.showLoading({
        title: '加载资源中...',
      })
    }

  })

  onPlay = async (index: number) => {
    const { playStatus, owner, activeIndex, users } = this.state

    // 非暂停状态 需要先停止
    if (playStatus !== 2) {
      this.onStop(activeIndex)
    }

    const url = index === 0 ? owner.revAudio.url : users[index - 1].revAudio.url
    this.initAudio(url).then(() => {
      this.innerAudioContext.play()
    })
    this.setState({
      activeIndex: index,
      playStatus: 1,
    })
    // this.innerAudioContext.play()
  }

  onStop = (activeIndex: number) => {
    if (activeIndex === this.state.activeIndex && this.innerAudioContext) {
      this.innerAudioContext.stop()
    }
    this.setState({
      currentTime: 0,
      playStatus: 0,
    })
  }

  onPause = (activeIndex: number) => {
    if (activeIndex === this.state.activeIndex) {
      this.setState({
        playStatus: 2,
      })
      this.innerAudioContext.pause()
    }
  }

  // 听原声
  listenOriVoice = () => {
    this.setState({
      activeIndex: 0,
      playStatus: 0,
    })
    const { owner, activeIndex } = this.state
    this.onStop(activeIndex)

    this.initAudio(owner.oriAudio.url).then(() => {
      this.innerAudioContext.play()
      this.setState({
        activeIndex: 0,
        playStatus: 1,
      })
    })

  }

  onNewChallenge = () => {
    Taro.switchTab({
      url: '/pages/index/index',
    })
  }

  joinChallenge = () => {
    Taro.navigateTo({
      url: `/pages/challenge/index?roomId=${this.roomId}`,
    })
  }

  goPage = (url: string) => {
    Taro.navigateTo({
      url,
    })
  }

  onToggleActionSheet = (status: boolean) => {
    this.setState({
      showActionSheet: status,
    })
  }

  onStar = async (userId: string, stared: boolean) => {
    // 暂时不做取消点赞
    if (stared) {
      return
    }
    const [error, res] = await cError(star({
      userId,
      roomId: this.roomId,
    }))
    if (!error) {
      this.setState({
        users: res.data.users,
      })
    } else {
      Taro.showToast({
        title: '点赞失败，请稍候重试~',
        icon: 'none',
      })
    }
  }

  onChange = (index: number) => {
    this.onStop(this.state.activeIndex)
    this.setState({
      activeIndex: index,
    })
  }

  changeRatio = (ratio: number) => {
    const r = ratio === this.state.ratio ? -1 : ratio
    this.setState({
      ratio: r,
    })
  }

  render() {
    const { owner, users, currentTime, activeIndex, playStatus, showActionSheet, ratio } = this.state
    const { userDetail } = this.props

    return (
      <View className="room">
        <View className="owner">
          <Image className="avatar" src={owner.avatarUrl}></Image>
          <View className="play-block">
            <View className="line">
              <Image className={classNames('wave-block', { active: activeIndex === 0 && playStatus === 1 })} src={waveBlockIcon}
                style={{ left: `${parseInt('' + (activeIndex === 0 ? (currentTime / getDurationByFilePath(owner.revAudio.url)) * 460 : 0))}rpx` }}
              ></Image>
            </View>
            <View className="time">{getTimeStr(currentTime * 1000).str}/{getTimeStr(getDurationByFilePath(owner.revAudio.url) * 1000).str}</View>
            <View className="control-buttons">
              {
                (activeIndex === 0 && playStatus === 1)
                  ? <View className="control-button play" onClick={this.onPause.bind(this, 0)}><Image className="pause-icon" src={pauseIcon}></Image></View>
                  : <View className="control-button play" onClick={this.onPlay.bind(this, 0)}><Image className="play-icon" src={playIcon}></Image></View>
              }
              <View className="control-button stop" onClick={this.onStop.bind(this, 0)}><Image className="stop-icon" src={stopIcon}></Image></View>
              {/* <View className={classNames('control-button ratio1', { active: ratio === 0 })} onClick={() => { this.changeRatio(0) }}><Image className="ratio-icon" src={ratio === 0 ? closeIcon : closeBlackIcon}></Image>0.75</View>
              <View className={classNames('control-button ratio2', { active: ratio === 1 })}onClick={() => { this.changeRatio(1) }}><Image className="ratio-icon" src={ratio === 1 ? closeIcon : closeBlackIcon}></Image>0.5</View> */}
            </View>
          </View>
          <View className="buttons">
            <View className="button" onClick={this.listenOriVoice}>听原声</View>
            {
              (userDetail._id !== owner.id) && <Block>
                <View className="button" onClick={this.joinChallenge}>参加挑战</View>
                <View className="button" onClick={this.onNewChallenge}>我也要玩</View>
              </Block>
            }
            {
              userDetail._id === owner.id && <View className="button" onClick={this.onToggleActionSheet.bind(this, true)}>分享挑战</View>
            }
          </View>

        </View>
        <View className="challenge-list">
          <View className="title"><Image className="srophy" src={srophyIcon}></Image><View>挑战榜</View></View>
          {(!users || users.length === 0)
            ? <View className="no-users"><View>暂无挑战</View></View>
            : <View className="users">
              {
                users.map((user, index) => {
                  const stared = !!user.stars.find(id => id === owner.id)
                  const active = activeIndex === index + 1
                  return <View className="item-wrapper" key={user._id}>
                    <View className={classNames('item')}>
                      <View className="item-index">{index + 1}、</View>
                      <View><Image className="item-avatar" src={user.avatarUrl}></Image></View>
                      <View className={classNames('button', { hidden: active  })} onClick={this.onChange.bind(this, index + 1)}>试听</View>
                      <View className="item-hurt" onClick={() => { this.onStar(user._id || '', stared) }}>
                        {
                          stared ? <Image className="icon" src={hurtActiveIcon}></Image> : <Image className="icon" src={hurtIcon}></Image>
                        }
                        <View className="count">{user.stars.length}</View>
                      </View>
                      <View className={classNames('button close', { hidden: !active })} onClick={this.onChange.bind(this, 0)}>收起</View>
                    </View>
                    {
                      active && <View className="controls">
                        <View className="line">
                          <Image className={classNames('wave-block', { active: active && playStatus === 1 })} src={waveBlockIcon}
                            style={{ left: `${parseInt('' + (active ? (currentTime / getDurationByFilePath(user.revAudio.url)) * 360 : 0))}rpx` }}
                          ></Image>
                        </View>
                        <View className="time">{getTimeStr(currentTime * 1000).str}/{getTimeStr(getDurationByFilePath(user.revAudio.url) * 1000).str}</View>
                        <View className="control-buttons">
                          {
                            (active && playStatus === 1)
                              ? <View className="control-button play" onClick={this.onPause.bind(this, index + 1)}><Image className="pause-icon" src={pauseIcon}></Image></View>
                              : <View className="control-button play" onClick={this.onPlay.bind(this, index + 1)}><Image className="play-icon" src={playIcon}></Image></View>
                          }
                          <View className="control-button stop"><Image className="stop-icon" src={stopIcon} onClick={this.onStop.bind(this, index + 1)}></Image></View>
                        </View>
                      </View>
                    }
                  </View>
                })
              }
            </View>
          }
        </View>
        {/* 分享弹窗 */}
        <AtActionSheet cancelText="取消" isOpened={showActionSheet} onClose={this.onToggleActionSheet.bind(this, false)}>
          <AtActionSheetItem>
            <Button openType="share" className="share-button">直接分享</Button>
          </AtActionSheetItem>
          <AtActionSheetItem onClick={this.goPage.bind(this, `/pages/sharePoster/index?roomId=${this.roomId}`, false)}>
            生成海报
          </AtActionSheetItem>
        </AtActionSheet>
      </View>
    )
  }
}

// #region 导出注意
//
// 经过上面的声明后需要将导出的 Taro.Component 子类修改为子类本身的 props 属性
// 这样在使用这个子类时 Ts 才不会提示缺少 JSX 类型参数错误
//
// #endregion

export default Room as ComponentClass<PageOwnProps, PageState>
