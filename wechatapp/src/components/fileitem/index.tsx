import { ComponentClass } from 'react'
import Taro, { InnerAudioContext } from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View, Text } from '@tarojs/components'
import moment from 'moment'
import { getTimeStr } from '@/utils'
import classNames from 'classnames'
import { LocalFileInfo, deleteFile } from '@/utils/reverse'
import { AtIcon } from 'taro-ui'

import './index.scss'

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

// type File = {
//   createTime: number
//   filePath: string
//   size: number
//   // context: InnerAudioContext
// }


type PageOwnProps = {
  file: LocalFileInfo
  active: boolean
  onShowDetail: (key: number) => void
  shouldUpdateFileList: () => void
}

type PageState = {
  fileState?: LocalFileInfo
  durationTime: number
  currentTime: number
  playStatus: 0 | 1 | 2 // 0-停止 1-播放中 2-暂停
  activeIndex: number
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
    playStatus: 0,
    activeIndex: 0,
  }

  componentDidMount() {
    this.initAudio(this.props.file)
  }

  componentWillReceiveProps(nextProps: PageOwnProps) {
    if (nextProps.active !== this.props.active && !nextProps.active) {
      this.onStop()
      this.innerAudioContext.destroy()
    }

    if (nextProps.active !== this.props.active && nextProps.active) {
      this.initAudio(nextProps.file)
    }

    this.setState({
      fileState: nextProps.file,
    })
  }

  // 初始化音频数据
  initAudio = (file: LocalFileInfo) => {
    if (this.innerAudioContext ) {
      this.innerAudioContext.offCanplay()
      this.innerAudioContext.offPlay()
      this.innerAudioContext.offTimeUpdate()
      this.innerAudioContext.offEnded()
      this.innerAudioContext.destroy()
    }
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    this.changePlayUrl(file)

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
      this.onStop()
      this.setState({
        currentTime: this.state.durationTime,
      })
    })
    // this.innerAudioContext.src = reverse ? file.path : file.reverseFilePath
    this.setState({
      fileState: file,
    })
  }

  changePlayUrl = (file: LocalFileInfo, reverse?: boolean) => {
    this.innerAudioContext.src = reverse ? file.reverseFilePath : file.path
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
  onPlay = (activeIndex: number) => {
    const { fileState, playStatus } = this.state
    if (!fileState) {
      return
    }

    const nextState: any = {
      playStatus: 0,
    }
    if (playStatus === 0 || activeIndex !== this.state.activeIndex) {
      nextState.currentTime = 0
    }
    this.setState(nextState)

    this.changePlayUrl(fileState, activeIndex !== 0)

    setTimeout(() => {
      this.setState({
        activeIndex,
        playStatus: 1,
      })
      this.innerAudioContext.play()
    }, 100)
  }

  // 暂停播放
  onPause = () => {
    this.setState({
      playStatus: 2,
    })
    this.innerAudioContext.pause()
  }

  // 停止播放
  onStop = () => {
    this.setState({
      playStatus: 0,
      currentTime: 0,
    })
    this.innerAudioContext.stop()
  }

  onShowDetail = () => {
    const { fileState } = this.state
    const createTime = fileState && fileState.file && fileState.file.createTime || -1
    // console.log(this.props.active ? -1 : createTime)
    this.props.onShowDetail(this.props.active ? -1 : createTime)
  }

  // 本地文件删除
  onDelete = async () => {
    const { fileState } = this.state
    if (!fileState) {
      return
    }
    await deleteFile(fileState)
    this.props.shouldUpdateFileList()
  }

  onShare = async () => {
    Taro.showToast({
      title: '分享功能正在开发中~',
      icon: 'none',
    })
  }

  // 音频反转
  // onReverse = () => {
  //   const { fileState } = this.state

  //   if (!fileState) {
  //     return
  //   }

  //   Taro.uploadFile({
  //     url: `${API_URL}/api/file/mp3/reverse`,
  //     filePath: fileState.filePath,
  //     name: 'file',
  //     formData: {
  //       'msg': 'voice',
  //     },
  //     header: {
  //       'Content-Type': 'multipart/form-data',
  //       'accept': 'application/json',
  //     },
  //     success: (res) => {
  //       const data = JSON.parse(res.data)
  //       const path = data.data.path
  //       //do something
  //       Taro.downloadFile({
  //         url: `${API_URL}/${path}`,
  //         success: (saveRes) => {
  //           // 更新文件列表
  //           // this.getFiles()
  //           Taro.saveFile({
  //             tempFilePath: saveRes.tempFilePath,
  //             complete: () => {
  //               this.props.shouldUpdateFileList()
  //             },
  //           })

  //           // 清除文件
  //           request({
  //             url: `${API_URL}/api/file/mp3/reverse?path=${path}`,
  //             method: 'DELETE',
  //           })
  //         },
  //       })
  //     },
  //   })
  // }

  render() {
    const { fileState, durationTime, currentTime, playStatus, activeIndex } = this.state
    if (!fileState || !fileState.file || !fileState.reverseFile) {
      return <View></View>
    }
    const { active } = this.props
    // console.log(active)
    // { fileState.file.size / 1000 } kb
    const { date, time } = this.getDate(fileState.file.createTime * 1000)
    const durationTimeStr = getTimeStr(durationTime * 1000).str
    return <View className={classNames('file-item', { playing: playStatus === 1, active })}>
      <View className="head" onClick={this.onShowDetail}>
        <View className="time">{fileState.new && false && <Text className="new-tag">new</Text>} {time}</View>
        <View className="line2">
          <View className="date">{date}</View>
          {/* <View className="duration-time">{durationTimeStr}</View> */}
          <View className="duration-time"> {durationTimeStr}</View>
        </View>
      </View>
      {
        [fileState.file, fileState.reverseFile].map((file, index) => {
          const isActive = activeIndex === index
          return <View className={classNames('controls', { active: isActive })} key={file.createTime}>
            <View className="progress">
              <View className="progress-bar">
                <View className="mask" style={{
                  width: isActive ? `${(currentTime / durationTime) * 100}%` : 0,
                }}
                ></View>
              </View>
              <View className="progress-time">
                <View className="progress-time__current">{getTimeStr(isActive ? currentTime * 1000 : 0).str}</View>
                <View className="progress-time__info">{index === 0 ? '原音频' : '反转音频'} ({file.size / 1000} kb)</View>
                <View className="progress-time__end">{durationTimeStr}</View>
              </View>
            </View>
            <View className="buttons">
              {
                !(isActive && playStatus === 1) && <View onClick={this.onPlay.bind(this, index)}>
                  <AtIcon value="play" size="26" color="#000"></AtIcon>
                </View>
              }
              {
                isActive && playStatus === 1 && <View onClick={this.onPause}>
                  <AtIcon value="pause" size="26" color="#000"></AtIcon>
                </View>
              }
              <View onClick={this.onStop}><AtIcon value="stop" size="22" color="#000"></AtIcon></View>
              {/* <View onClick={this.onReverse}>反转</View> */}
              {/* <View onClick={this.onDelete}>删除</View> */}
            </View>
          </View>
        })
      }
      <View className="share-wrapper">
        <View onClick={this.onShare} className="share-icon">
          <AtIcon value="share" size="26" color="#000"></AtIcon>
        </View>
        <View onClick={this.onDelete}>
          <AtIcon value="trash" size="26" color="#F00"></AtIcon>
        </View>
      </View>
    </View>
  }
}

export default FileItem as ComponentClass<PageOwnProps, PageState>
