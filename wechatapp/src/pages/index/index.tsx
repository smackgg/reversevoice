import { ComponentClass } from 'react'
import Taro, { Component, Config, RecorderManager, request } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import { View, Image, Text, Block } from '@tarojs/components'
import classNames from 'classnames'
// import { AtIcon } from 'taro-ui'
import { getTimeStr } from '@/utils'
import { saveFile, reverse, getFiles } from '@/utils/reverse'
import { FileList } from '@/components'
import { getRecordAuth } from '@/utils/auth'

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

type File = {
  createTime: number
  filePath: string
  size: number
}

type PageState = {
  recording: boolean,
  time: number,
  fileList?: File[],
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Index {
  props: IProps
}

@connect(() => ({
}), (dispatch: any) => ({
}))

class Index extends Component {
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
    this.getFiles()

    // 获取麦克风录音信息
    Taro.getAvailableAudioSources({
      success: (res) => {
        const audioSources = res.audioSources
        console.log(audioSources, audioSources.includes('buildInMic'))
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
        await this.getFiles(true)
        Taro.showToast({
          title: '保存录音成功',
        })
      } catch (error) {
        Taro.showToast({
          title: '保存录音失败，请重新录音',
        })
      }
      Taro.hideLoading()
    })
  }

  componentDidShow() {

  }

  getFiles = async (record?: boolean) => {
    const fileList = await getFiles()

    if (record) {
      fileList[0].new = true
    }

    this.setState({
      fileList,
    })
  }

  // 返回首页
  goHome = () => {
    Taro.redirectTo({
      url: '/pages/entry/index',
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
    console.log(this.audioSource)
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

  shouldUpdateFileList = () => {
    this.getFiles()
  }

  render() {
    const { recording, time, fileList } = this.state
    const { s, ms } = getTimeStr(time)
    // console.log(fileList)
    return (
      <View className={classNames('index', { active: recording })}>
        {
          fileList && <FileList recording={recording} shouldUpdateFileList={this.shouldUpdateFileList} fileList={fileList} />
        }
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
