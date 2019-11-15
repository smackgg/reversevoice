import { ComponentClass } from 'react'
import Taro from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View } from '@tarojs/components'
import { valueEqual } from '@/utils'
import FileItem from '../fileitem'
import { File, LocalFileInfo } from '@/utils/reverse'
import './index.scss'

type PageOwnProps = {
  fileList: LocalFileInfo[]
  shouldUpdateFileList: () => void
  recording: boolean
}

type PageState = {
  activeKey: number
  fileListState?: LocalFileInfo[]
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

  onShowDetail = (activeKey: number) => {
    this.setState({
      activeKey,
    })
  }

  componentWillReceiveProps(nextProps: PageOwnProps) {
    if (nextProps.recording !== this.props.recording && nextProps.recording) {
      this.setState({
        activeKey: -1,
      })
    }
    if (nextProps.fileList.length !== this.props.fileList.length && nextProps.fileList[0] && nextProps.fileList[0].new) {
      this.setState({
        activeKey: nextProps.fileList[0].file && nextProps.fileList[0].file.createTime,
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
          fileList.map((file) => <FileItem
            shouldUpdateFileList={shouldUpdateFileList}
            onShowDetail={this.onShowDetail}
            active={!!file.file && file.file.createTime === activeKey}
            file={file}
            key={file.index}
          />)
        }
    </View>
  }
}

export default FileList as ComponentClass<PageOwnProps, PageState>
