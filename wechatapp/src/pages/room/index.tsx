import { ComponentClass } from 'react'
import Taro, { Component, Config, InnerAudioContext } from '@tarojs/taro'
// import { connect } from '@tarojs/redux'
import { View, Block, Image } from '@tarojs/components'
import classNames from 'classnames'
import { saveFile, reverse, getFiles } from '@/utils/reverse'
import withShare from '@/components/@withShare'
import { getRecordAuth } from '@/utils/auth'
import { getRoomDetail } from '@/services/room'
import { cError, getTimeStr } from '@/utils'
import waveBlockIcon from '@/assets/images/wave-block.png'
import playIcon from '@/assets/images/play.png'
import pauseIcon from '@/assets/images/pause.png'
import stopIcon from '@/assets/images/stop.png'



import './index.scss'
import { number } from 'prop-types'

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
  active?: number,
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
  // timer?: number
  // RecorderManager: RecorderManager
  // tempFilePath?: string

  state: PageState = {
    // recording: false,
    active: undefined,
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
    durationTime: 1,
    currentTime: 0,
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
    }, () => {
        this.initAudio(-1)
    })
  }

  initAudio = (activeIndex: number) => {
    const { owner } = this.state
    if (this.innerAudioContext) {
      this.innerAudioContext.offCanplay()
      this.innerAudioContext.offPlay()
      this.innerAudioContext.offTimeUpdate()
      this.innerAudioContext.offEnded()
      this.innerAudioContext.destroy()
    }
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    // console.log(owner.revAudio.url)
    this.innerAudioContext.src = owner.revAudio.url
    // 获取音频时长
    innerAudioContext.onCanplay(() => {
      innerAudioContext.duration
      setTimeout(() => {
        this.setState({
          durationTime: innerAudioContext.duration,
        })
      }, 400)
    })

    innerAudioContext.onPlay(() => {
      this.setState({
        durationTime: innerAudioContext.duration,
      })
    })
    innerAudioContext.onTimeUpdate(() => {
      this.setState({
        currentTime: innerAudioContext.currentTime,
      })
    })
    innerAudioContext.onEnded(() => {
      // this.onStop()
      this.setState({
        currentTime: this.state.durationTime,
      })
    })

  }

  // 开始录音
  onRecordHandler = async () => {
    const recordAuth = await getRecordAuth()

    if (!recordAuth) {
      return
    }
    const { recording } = this.state
    this.setState({
      recording: !recording,
    })

    // 开始录音
    if (!recording) {
      setTimeout(() => {
        this.startRecord()
      }, 200)
    } else {
      this.stopRecord()
    }
  }

  // 开始录音
  startRecord = () => {

    this.RecorderManager.start({
      format: 'mp3',
      // sampleRate: '8000',
      duration: 15000,
      audioSource: this.audioSource,
    })

    // 计时器
    this.timer = setInterval(() => {
      if (this.state.time >= 10000) {
        this.stopRecord()
        return
      }
      this.setState({
        time: this.state.time + 100,
      })
    }, 100)
  }

  // 结束录音
  stopRecord = (resetTime = true) => {
    clearInterval(this.timer)
    this.timer = undefined
    this.RecorderManager.stop()

    if (resetTime) {
      this.setState({
        time: 0,
      })
    }
  }

  onPlay = (active: number) => {
    if (active === -1) {
      this.setState({
        active: -1,
      })
      this.innerAudioContext.play()
    }
  }

  onStop = (active: number) => {
    if (active === -1) {
      this.setState({
        active: undefined,
        currentTime: 0,
      })
      this.innerAudioContext.stop()
    }
  }

  onPause = (active: number) => {
    if (active === -1) {
      this.setState({
        active: undefined,
      })
      this.innerAudioContext.pause()
    }
  }

  componentWillUnmount() {
    // this.onStop()
    console.log('componentWillUnmount')
  }

  render() {
    const { owner, currentTime, durationTime, active } = this.state
    const left = `${parseInt('' + (currentTime / durationTime) * 380)}rpx`
    console.log(active !== -1, active === -1)
    return (
      <View className="room">
        <View className="owner">
          <Image className="avatar" src={owner.avatarUrl}></Image>
          <View className="play-block">
            <View className="line">
              <Image className={classNames('wave-block', { active: active === -1 })} src={waveBlockIcon} style={{ left }}></Image>
            </View>
            <View className="time">{getTimeStr(currentTime * 1000).str}/{getTimeStr(durationTime * 1000).str}</View>
            <View className="play-buttons">
              <View className="button play">
                {active !== -1 && <Image className="play-icon" src={playIcon} onClick={this.onPlay.bind(this, -1)}></Image>}
                {active === -1 && <Image className="pause-icon" src={pauseIcon} onClick={this.onPause.bind(this, -1)}></Image>}
              </View>
              <View className="button stop"><Image className="stop-icon" src={stopIcon} onClick={this.onStop.bind(this, -1)}></Image></View>
              <View className="button ratio1">0.75</View>
              <View className="button ratio2">0.5</View>
            </View>
          </View>
          <View className="buttons">
            <View className="button">我要听原声</View>
            <View className="button">我也要挑战</View>
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
