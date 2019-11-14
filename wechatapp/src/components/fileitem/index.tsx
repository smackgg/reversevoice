import { ComponentClass } from 'react'
import Taro, { InnerAudioContext } from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View } from '@tarojs/components'
import moment from 'moment'
import { getTimeStr } from '@/utils'
import classNames from 'classnames'
import { LocalFileInfo } from '@/utils/reverse'
import { AtIcon } from 'taro-ui'

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
  playing: boolean
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
    playing: false,
    activeIndex: 0,
  }

  componentDidMount() {
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
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
    // this.innerAudioContext.src = reverse ? file.path : file.reverseFilePath
    this.changePlayUrl(file)
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
    const { fileState } = this.state
    if (!fileState) {
      return
    }
    this.setState({
      playing: false,
      currentTime: 0,
    })

    this.changePlayUrl(fileState, activeIndex !== 0)

    setTimeout(() => {
      this.setState({
        activeIndex,
        playing: true,
      })
      this.innerAudioContext.play()
    }, 100)
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
    const { fileState } = this.state
    const createTime = fileState && fileState.file.createTime || -1
    // console.log(this.props.active ? -1 : createTime)
    this.props.onShowDetail(this.props.active ? -1 : createTime)
  }

  // 本地文件删除
  // onDelete = () => {
  //   const { fileState } = this.state
  //   if (!fileState) {
  //     return
  //   }
  //   // console.log(fileState.filePath)
  //   Taro.removeSavedFile({
  //     filePath: fileState.filePath,
  //     complete: () => {
  //       this.props.shouldUpdateFileList()
  //     },
  //   })
  // }

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
    const { fileState, durationTime, currentTime, playing, activeIndex } = this.state
    if (!fileState) {
      return <View></View>
    }
    const { active } = this.props
    console.log(active)
    // { fileState.file.size / 1000 } kb
    const { date, time } = this.getDate(fileState.file.createTime * 1000)
    const durationTimeStr = getTimeStr(durationTime * 1000).str
    return <View className={classNames('file-item', { playing, active })}>
      <View className="head" onClick={this.onShowDetail}>
        <View className="time">{time}</View>
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
                !(isActive && playing) && <View onClick={this.onPlay.bind(this, index)}>
                  <AtIcon value="play" size="30" color="#F00"></AtIcon>
                </View>
              }
              {
                isActive && playing && <View onClick={this.onPause}>
                  <AtIcon value="pause" size="30" color="#F00"></AtIcon>
                </View>
              }
              <View onClick={this.onStop}>停止</View>
              {/* <View onClick={this.onReverse}>反转</View> */}
              {/* <View onClick={this.onDelete}>删除</View> */}
            </View>
          </View>
        })
      }
    </View>
  }
}

export default FileItem as ComponentClass<PageOwnProps, PageState>
