import { ComponentClass } from 'react'
import Taro from '@tarojs/taro'
import PropTypes from 'prop-types'
import { View } from '@tarojs/components'
import FileItem from '../fileitem'

import './index.less'


type File = {
  createTime: number
  filePath: string
  size: number
}


type PageOwnProps = {
  fileList: File[]
}

type PageState = {
  activeIndex: number
}

interface FileList {
  props: PageOwnProps,
}

class FileList extends Taro.Component {
  static propTypes = {
    fileList: PropTypes.array,
  }

  state: PageState = {
    activeIndex: 0,
  }

  static defaultProps = {
    fileList: [],
  }

  onShowDetail = (index: number) => {
    this.setState({
      activeIndex: index,
    })
  }

  render() {
    const { fileList } = this.props
    const { activeIndex } = this.state

    return <View className="file-list">
        {
          fileList.map((file: File, index: number) => <FileItem onShowDetail={this.onShowDetail.bind(this, index)} active={index === activeIndex} file={file} key={file.createTime} />)
        }
    </View>
  }
}

export default FileList as ComponentClass<PageOwnProps, PageState>
