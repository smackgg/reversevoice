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
  }

  state: PageState = {
    activeKey: -1,
  }

  static defaultProps = {
    fileList: [],
  }

  onShowDetail = (key: number) => {
    this.setState({
      activeKey: key,
    })
  }

  componentDidMount() {
    this.setState({
      fileListState: this.props.fileList,
    })
  }

  componentWillReceiveProps(nextProps: PageOwnProps) {
    // if (!valueEqual(nextProps.fileList, this.props.fileList)) {
    //   this.setState({
    //     fileListState: undefined,
    //     // activeKey: -1,
    //   }, () => {
    //     setTimeout(() => {
    //       this.setState({
    //         fileListState: nextProps.fileList,
    //       })
    //     }, 1000)
    //   })
    // }
  }

  render() {
    const { fileListState, activeKey } = this.state
    if (!fileListState) {
      return <View></View>
    }
    const { shouldUpdateFileList, fileList } = this.props


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
