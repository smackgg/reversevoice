import { ComponentClass } from 'react'
import Taro, { Component, Config, InnerAudioContext } from '@tarojs/taro'
// import { connect } from '@tarojs/redux'
import { View, Block, Image } from '@tarojs/components'
import classNames from 'classnames'
import { saveFile, reverse, getFiles, getDurationByFilePath } from '@/utils/reverse'
import withShare from '@/components/@withShare'
import { getRecordAuth } from '@/utils/auth'
import { getRoomDetail } from '@/services/room'
import { cError, getTimeStr } from '@/utils'
import waveBlockIcon from '@/assets/images/wave-block.png'
import playIcon from '@/assets/images/play.png'
import pauseIcon from '@/assets/images/pause.png'
import stopIcon from '@/assets/images/stop.png'

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
}

type PageState = {
  owner: RoomUserSchema,
  users: RoomUserSchema[],
  durationTime: number,
  currentTime: number,
  activeIndex: number,
  playStatus: 0 | 1 | 2 // 0-停止 1-播放中 2-暂停
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Room {
  props: IProps
}

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
    title: '能听懂我说啥么？最近很火的倒放录音来啦~',
    path: 'pages/index/index',
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
    },
    users: [],
    durationTime: 0,
    currentTime: 0,
    playStatus: 0,
  }

  async componentDidShow() {
    let { roomId } = this.$router.params
    this.roomId = roomId
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
    this.canplay = false
    if (this.innerAudioContext) {
      this.innerAudioContext.offCanplay()
      this.innerAudioContext.offPlay()
      this.innerAudioContext.offTimeUpdate()
      this.innerAudioContext.offEnded()
      this.innerAudioContext.destroy()
    }
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    this.innerAudioContext.src = url

    // 获取音频时长
    innerAudioContext.onCanplay(() => {
      resolve()
    })

    // innerAudioContext.onPlay(() => {
    //   this.setState({
    //     durationTime: innerAudioContext.duration,
    //   })
    // })
    innerAudioContext.onTimeUpdate(() => {
      this.setState({
        currentTime: innerAudioContext.currentTime,
      })
    })
    innerAudioContext.onEnded(() => {
      this.onStop(this.state.activeIndex)
      this.setState({
        currentTime: this.state.durationTime,
      })
    })
  })

  onPlay = async (activeIndex: number) => {
    // if (!this.canplay) {
    //   return
    // }
    const { playStatus, owner } = this.state

    // 暂停
    if (playStatus !== 2) {
      if (activeIndex === 0) {
        this.initAudio(owner.revAudio.url).then(() => {
          this.innerAudioContext.play()
        })
      }
    }
    this.setState({
      activeIndex: activeIndex,
      playStatus: 1,
    })
    // this.innerAudioContext.play()
  }

  onStop = (activeIndex: number) => {
    if (activeIndex === this.state.activeIndex) {
      this.setState({
        currentTime: 0,
        playStatus: 0,
      })
      this.innerAudioContext.stop()
    }
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
    const { owner } = this.state
    this.initAudio(owner.oriAudio.url).then(() => {
      this.innerAudioContext.play()
    })

    this.setState({
      activeIndex: 0,
      playStatus: 1,
    })
  }

  onNewChallenge = () => {
    Taro.switchTab({
      url: '/pages/index/index',
    })
  }

  joinChallenge = () => {
    Taro.navigateTo({
      url: `/pages/challenge/index?roomId${this.roomId}`,
    })
  }

  render() {
    const { owner, currentTime, activeIndex, playStatus } = this.state
    // console.log(activeIndex === 0 && playStatus === 1, playStatus, activeIndex)
    return (
      <View className="room">
        <View className="owner">
          <Image className="avatar" src={owner.avatarUrl}></Image>
          <View className="play-block">
            <View className="line">
              <Image className={classNames('wave-block', { active: activeIndex === 0 && playStatus === 1 })} src={waveBlockIcon}
                style={{ left: `${parseInt('' + (activeIndex === 0 ? (currentTime / getDurationByFilePath(owner.revAudio.url)) * 380 : 0))}rpx` }}
              ></Image>
            </View>
            <View className="time">{getTimeStr(currentTime * 1000).str}/{getTimeStr(getDurationByFilePath(owner.revAudio.url) * 1000).str}</View>
            <View className="play-buttons">
              {
                (activeIndex === 0 && playStatus === 1)
                  ? <View className="button play" onClick={this.onPause.bind(this, 0)}><Image className="pause-icon" src={pauseIcon}></Image></View>
                  : <View className="button play" onClick={this.onPlay.bind(this, 0)}><Image className="play-icon" src={playIcon}></Image></View>
              }
              <View className="button stop"><Image className="stop-icon" src={stopIcon} onClick={this.onStop.bind(this, 0)}></Image></View>
              <View className="button ratio1">0.75</View>
              <View className="button ratio2">0.5</View>
            </View>
          </View>
          <View className="buttons">
            <View className="button" onClick={this.listenOriVoice}>听原声</View>
            <View className="button" onClick={this.joinChallenge}>参加挑战</View>
            <View className="button" onClick={this.onNewChallenge}>发起挑战</View>
          </View>
        </View>
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
