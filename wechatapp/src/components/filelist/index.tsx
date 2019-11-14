import { ComponentClass } from 'react'
import Taro from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View } from '@tarojs/components'
import { valueEqual } from '@/utils'
import FileItem from '../fileitem'

import './index.less'

type File = {
  createTime: number
  filePath: string
  size: number
}


type PageOwnProps = {
  fileList: File[]
  shouldUpdateFileList: () => void
  recording: boolean
}

type PageState = {
  activeKey: number
  fileListState?: File[]
}

interface FileList {
  props: PageOwnProps,
}

class FileList extends Taro.Component {
  static propTypes = {
    fileList: PropTypes.array,
    shouldUpdateFileList: PropTypes.func,
    recording: PropTypes.bool,
  }

  state: PageState = {
    activeKey: -1,
  }

  static defaultProps = {
    fileList: [],
    recording: false,
  }

  onShowDetail = (key: number) => {
    this.setState({
      activeKey: key,
    })
  }

  componentWillReceiveProps(nextProps: PageOwnProps) {
    if (nextProps.recording !== this.props.recording && nextProps.recording) {
      this.setState({
        activeKey: -1,
      })
    }
  }

  render() {
    const { activeKey } = this.state
    const { shouldUpdateFileList, fileList } = this.props
    if (!fileList) {
      return <View></View>
    }

    return <View className="file-list">
        {
          fileList.map((file: File, index: number) => <FileItem
            shouldUpdateFileList={shouldUpdateFileList}
            onShowDetail={this.onShowDetail.bind(this, file.createTime )}
            active={file.createTime === activeKey}
            file={file}
            key={file.createTime}
          />)
        }
    </View>
  }
}

export default FileList as ComponentClass<PageOwnProps, PageState>
