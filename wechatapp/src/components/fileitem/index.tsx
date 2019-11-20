import { ComponentClass } from 'react'
import Taro, { InnerAudioContext } from '@tarojs/taro'
import PropTypes, { any } from 'prop-types'
import { View, Text } from '@tarojs/components'
import moment from 'moment'
import { getTimeStr } from '@/utils'
import classNames from 'classnames'
import { LocalFileInfo, deleteFile, uploadFile, setLSRFileValue } from '@/utils/reverse'
import { AtIcon } from 'taro-ui'
import { createRoom } from '@/services/room'
import { connect } from '@tarojs/redux'
import { UserDetail } from '@/redux/reducers/user'

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

type PageStateProps = {
  userDetail: UserDetail,
}

type PageOwnProps = {
  file: LocalFileInfo
  active: boolean
  onShowDetail: (key: number) => void
  shouldUpdateFileList?: () => void
  noIcon?: boolean
}

type PageState = {
  fileState: LocalFileInfo
  currentTime: number
  playStatus: 0 | 1 | 2 // 0-停止 1-播放中 2-暂停
  activeIndex: number
}

type IProps = PageStateProps & PageOwnProps

interface FileItem {
  props: IProps,
}

@connect(({ user }) => ({
  userDetail: user.userDetail,
}))

class FileItem extends Taro.Component {
  innerAudioContext: InnerAudioContext

  static propTypes = {
    file: PropTypes.object.isRequired,
    active: PropTypes.bool,
    // onPlay: PropTypes.func,
    onShowDetail: PropTypes.func,
    shouldUpdateFileList: PropTypes.func,
    userDetail: any,
    noIcon: PropTypes.bool,
  }

  static defaultProps = {
    file: undefined,
    active: false,
    userDetail: {},
    noIcon: false,
  }

  state: PageState = {
    // fileState: undefined,
    fileState: {
      path: '',
      index: -1,
      reverseFilePath: '',
      duration: 0,
    },
    currentTime: 0,
    playStatus: 0,
    activeIndex: 0,
  }

  componentDidMount() {
    this.initAudio(this.props.file)
  }

  componentWillReceiveProps(nextProps: IProps) {
    if (nextProps.active !== this.props.active && !nextProps.active) {
      this.onStop()
      this.innerAudioContext.destroy()
    }

    this.initAudio(nextProps.file)
    // if (nextProps.active !== this.props.active && nextProps.active) {
    //   this.initAudio(nextProps.file)
    // }

    this.setState({
      fileState: nextProps.file,
    })
  }

  componentWillUnmount() {
    this.onStop()
  }

  // 初始化音频数据
  initAudio = (file: LocalFileInfo) => {
    if (this.innerAudioContext) {
      this.innerAudioContext.offCanplay()
      this.innerAudioContext.offPlay()
      this.innerAudioContext.offTimeUpdate()
      this.innerAudioContext.offEnded()
      this.innerAudioContext.destroy()
    }
    let innerAudioContext = Taro.createInnerAudioContext()
    this.innerAudioContext = innerAudioContext
    this.changePlayUrl(file)

    innerAudioContext.onTimeUpdate(() => {
      this.setState({
        currentTime: innerAudioContext.currentTime,
      })
    })
    innerAudioContext.onEnded(() => {
      console.log(this.state.fileState.duration)
      this.setState({
        currentTime: this.state.fileState.duration,
      })
      this.onStop()
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
    this.props.onShowDetail(this.props.active ? -1 : createTime)
  }

  // 本地文件删除
  onDelete = async () => {
    const { fileState } = this.state

    await deleteFile(fileState)
    this.props.shouldUpdateFileList && this.props.shouldUpdateFileList()
  }

  onShare = async () => {
    const { isLogin } = this.props.userDetail
    if (!isLogin) {
      Taro.navigateTo({
        url: '/pages/authorize/index',
      })
      return
    }
    const { fileState } = this.state

    try {
      const [file, reverseFile] = await Promise.all([await uploadFile({
        path: fileState.path,
        duration: fileState.duration,
      }), await uploadFile({
        path: fileState.reverseFilePath,
        duration: fileState.duration,
      })])
        .then(results => results).catch(error => Promise.reject(error))

      const res = await createRoom({
        oriAudioUrl: file.data.path,
        revAudioUrl: reverseFile.data.path,
      })
      console.log(res)
      const roomId = res.data.roomId
      setLSRFileValue(fileState.index, 'roomId', roomId)

      this.props.shouldUpdateFileList && this.props.shouldUpdateFileList()
    } catch (error) {
      Taro.showToast({
        title: '生成分享链接失败，请稍候重试~',
        icon: 'none',
      })
    }

    // console.log(fileState)
    // Taro.showToast({
    //   title: '分享功能正在开发中~',
    //   icon: 'none',
    // })
  }

  goSharePage = (roomId: string) => {
    Taro.navigateTo({
      url: `/pages/room/index?roomId=${roomId}`,
    })
  }


  render() {
    const { fileState, currentTime, playStatus, activeIndex } = this.state
    if (!fileState || !fileState.file || !fileState.reverseFile || fileState.index === -1) {
      return <View></View>
    }

    const durationTime = fileState.duration
    const { active, noIcon } = this.props
    // console.log(active)
    // { fileState.file.size / 1000 } kb
    const { date, time } = this.getDate(fileState.file.createTime * 1000)
    // console.log(durationTime)
    const durationTimeStr = getTimeStr(durationTime * 1000).str
    return <View className={classNames('file-item', { playing: playStatus === 1, active, 'no-icon': noIcon })}>
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
            </View>
          </View>
        })
      }
      {
        !noIcon && <View className="share-wrapper">
          {
            fileState.roomId && <View onClick={this.goSharePage.bind(this, fileState.roomId)} className="share-info">
              查看分享
          </View>
          }
          {
            !fileState.roomId && <View onClick={this.onShare} className="share-icon">
              <AtIcon value="share" size="26" color="#000"></AtIcon>
            </View>
          }
          <View onClick={this.onDelete}>
            <AtIcon value="trash" size="26" color="#F00"></AtIcon>
          </View>
        </View>
      }
    </View>
  }
}

export default FileItem as ComponentClass<PageOwnProps, PageState>
