import { ComponentClass } from 'react'
import Taro, { InnerAudioContext } from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View } from '@tarojs/components'
import moment from 'moment'
import { getTimeStr, API_URL } from '@/utils'
import classNames from 'classnames'
import request from '@/utils/request'

import './index.less'

moment.locale('zh-cn', {
  meridiem: (hour, minute) => {
    if (hour < 9) {
      return '早上'
    } if (hour < 11 && minute < 30) {
      return '上午'
    } if (hour < 13 && minute < 30) {
      return '中午'
    } if (hour < 18) {
      return '下午'
    }
    return '晚上'
  },
})

type File = {
  createTime: number
  filePath: string
  size: number
  // context: InnerAudioContext
}


type PageOwnProps = {
  file: File
  active: boolean
  onShowDetail: () => void
  shouldUpdateFileList: () => void
}

type PageState = {
  fileState?: File
  durationTime: number
  currentTime: number
  playing: boolean
}

interface FileItem {
  props: PageOwnProps,
}

class FileItem extends Taro.Component {
  innerAudioContext: InnerAudioContext

  static propTypes = {
    file: PropTypes.object,
    active: PropTypes.bool,
    // onPlay: PropTypes.func,
    onShowDetail: PropTypes.func,
    shouldUpdateFileList: PropTypes.func,
  }

  static defaultProps = {
    file: undefined,
    active: false,
  }

  state: PageState = {
    fileState: undefined,
    durationTime: 0,
    currentTime: 0,
    playing: false,
  }

  componentDidMount() {
    this.initAudio(this.props.file)
  }

  componentWillReceiveProps(nextProps: PageOwnProps) {
    if (nextProps.active !== this.props.active && !nextProps.active) {
      this.onStop()
    }

    this.initAudio(nextProps.file)
  }

  // 初始化音频数据
  initAudio = (file: File) => {
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    innerAudioContext.src = file.filePath

    this.setState({
      fileState: file,
    })
    console.log(innerAudioContext)
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
      this.setState({
        currentTime: this.state.durationTime,
      })
    })
  }

  // 格式化日期
  getDate = (timestamp: number) => {
    const date = moment(timestamp)
    return {
      date: date.format('YYYY.MM.DD'),
      time: date.format('A h:mm'),
    }
  }

  // 播放
  onPlay = () => {
    this.setState({
      playing: true,
    })
    this.innerAudioContext.play()
  }

  // 暂停播放
  onPause = () => {
    this.innerAudioContext.pause()
  }

  // 停止播放
  onStop = () => {
    this.setState({
      playing: false,
      currentTime: 0,
    })
    this.innerAudioContext.stop()
  }

  onShowDetail = () => {
    if (!this.props.active) {
      this.props.onShowDetail()
    }
  }

  // 本地文件删除
  onDelete = () => {
    const { fileState } = this.state
    if (!fileState) {
      return
    }
    // console.log(fileState.filePath)
    Taro.removeSavedFile({
      filePath: fileState.filePath,
      complete: () => {
        this.props.shouldUpdateFileList()
      },
    })
  }

  // 音频反转
  onReverse = () => {
    const { fileState } = this.state

    if (!fileState) {
      return
    }

    Taro.uploadFile({
      url: `${API_URL}/api/file/mp3/reverse`, //仅为示例，非真实的接口地址
      filePath: fileState.filePath,
      name: 'file',
      formData: {
        'msg': 'voice',
      },
      header: {
        'Content-Type': 'multipart/form-data',
        'accept': 'application/json',
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        const path = data.data.path
        //do something
        Taro.downloadFile({
          url: `${API_URL}/${path}`,
          success: (saveRes) => {
            // 更新文件列表
            // this.getFiles()
            Taro.saveFile({
              tempFilePath: saveRes.tempFilePath,
              complete: () => {
                this.props.shouldUpdateFileList()
              },
            })

            // 清除文件
            request({
              url: `${API_URL}/api/file/mp3/reverse?path=${path}`,
              method: 'DELETE',
            })
          },
        })
      },
    })
  }

  render() {
    const { fileState, durationTime, currentTime, playing } = this.state
    if (!fileState) {
      return <View></View>
    }
    const { active } = this.props

    const { date, time } = this.getDate(fileState.createTime * 1000)
    const durationTimeStr = getTimeStr(durationTime * 1000).str
    return <View className={classNames('file-item', { playing, active })}>
      <View className="head" onClick={this.onShowDetail}>
        <View className="time">{time}</View>
        <View className="line2">
          <View className="date">{date}</View>
          <View className="duration-time">{durationTimeStr}</View>
        </View>
      </View>
      <View className="progress">
        <View className="progress-bar">
          <View className="mask" style={{
            width: `${(currentTime / durationTime) * 100}%`,
          }}
          ></View>
        </View>
        <View className="progress-time">
          <View className="progress-time__current">{getTimeStr(currentTime * 1000).str}</View>
          <View className="progress-time__end">{durationTimeStr}</View>
        </View>
      </View>
      <View className="buttons">
        <View onClick={this.onPlay}>播放</View>
        <View onClick={this.onPause}>暂停</View>
        <View onClick={this.onStop}>停止</View>
        <View onClick={this.onReverse}>反转</View>
        <View onClick={this.onDelete}>删除</View>
      </View>
    </View>
  }
}

export default FileItem as ComponentClass<PageOwnProps, PageState>
