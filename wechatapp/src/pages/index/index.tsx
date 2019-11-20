import { ComponentClass } from 'react'
import Taro, { Component, Config, RecorderManager } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import { View, Block } from '@tarojs/components'
import classNames from 'classnames'
// import { AtIcon } from 'taro-ui'
import { getTimeStr } from '@/utils'
import { saveFile, reverse, LocalFileInfo } from '@/utils/reverse'
import withShare from '@/components/@withShare'
import { getRecordAuth } from '@/utils/auth'
import { UserDetail } from '@/redux/reducers/user'
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
  userDeital: UserDetail
}

type PageDispatchProps = {
}

type PageOwnProps = {
}


type PageState = {
  recording: boolean,
  time: number,
  fileList?: LocalFileInfo[],
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Index {
  props: IProps
}

@connect(({ user }) => ({
  userDeital: user.userDeital,
}))

@withShare()
class Index extends Component {
  /**
 * 指定config的类型声明为: Taro.Config
 *
 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
 */
  config: Config = {
    navigationBarTitleText: '倒放挑战',
  }

  $shareOptions = {
    title: '倒放挑战！能听懂我说啥么？最近很火的倒放录音来啦~',
    path: 'pages/index/index',
  }

  audioSource: string = 'auto'
  timer?: number
  RecorderManager: RecorderManager
  tempFilePath?: string

  state: PageState = {
    recording: false,
    time: 0,
    fileList: undefined,
  }

  componentWillMount() {
    // 获取麦克风录音信息
    Taro.getAvailableAudioSources({
      success: (res) => {
        const audioSources = res.audioSources

        if (audioSources.includes('buildInMic')) {
          this.audioSource = 'buildInMic'
          return
        }
        if (audioSources.includes('mic')) {
          this.audioSource = 'mic'
          return
        }
      },
    })

    this.RecorderManager = Taro.getRecorderManager()
    this.RecorderManager.onStop(async (res) => {
      Taro.showLoading({ title: '保存录音中...', mask: true })
      try {
        // 保存文件
        const fileInfo = await saveFile(res.tempFilePath)
        await reverse(fileInfo)
        // await this.getFiles(true)
        Taro.showToast({
          title: '保存录音成功',
        })
      } catch (error) {
        Taro.showToast({
          title: '保存录音失败，请稍候重试',
          icon: 'none',
          duration: 2500,
        })
      }
      Taro.hideLoading()
    })
  }

  componentDidShow() {

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

  render() {
    const { recording, time } = this.state
    const { s, ms } = getTimeStr(time)

    return (
      <View className={classNames('index', { active: recording })}>
        <View>
          <View>游戏规则：</View>
          <View>假设两个人 A 和 B。</View>
          <View>A 录音后将录音进行反转，将反转之后的录音给 B 听。</View>
          <View>B 模仿倒放后的录音，再进行反转。</View>
          <View>B 通过反转之后的声音，猜测 A 录的原声。</View>
          <View></View>
          <View></View>
        </View>
        <View className="record">
          {
              recording && <Block>
                <View className="record-title">正在录音中</View>
                <View className="record-time"><View className="time-s">{s}</View>:<View className="time-ms">{ms}</View></View>
              </Block>
          }
          <View className="record-button" onClick={this.onRecordHandler}>
            <View className={classNames('record-button__inner', { active: recording })}></View>
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

export default Index as ComponentClass<PageOwnProps, PageState>
