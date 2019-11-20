import { ComponentClass } from 'react'
import Taro, { Component, Config, RecorderManager } from '@tarojs/taro'
import { connect } from '@tarojs/redux'
import { View } from '@tarojs/components'
import classNames from 'classnames'
// import { AtIcon } from 'taro-ui'
import { getFiles, LocalFileInfo } from '@/utils/reverse'
import { FileList } from '@/components'
import withShare from '@/components/@withShare'
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
  fileList?: LocalFileInfo[],
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface FileListPage {
  props: IProps
}

@connect(({ user }) => ({
  userDeital: user.userDeital,
}))

@withShare()
class FileListPage extends Component {
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

  $shareOptions = {
    title: '倒放挑战！能听懂我说啥么？最近很火的倒放录音来啦~',
    path: 'pages/index/index',
  }

  audioSource: string = 'auto'
  timer?: number
  RecorderManager: RecorderManager
  tempFilePath?: string

  state: PageState = {
    fileList: undefined,
  }

  componentDidShow() {
    this.getFiles()
  }

  getFiles = async () => {
    const fileList = await getFiles()

    this.setState({
      fileList,
    })
  }

  shouldUpdateFileList = () => {
    this.getFiles()
  }

  render() {
    const { recording, fileList } = this.state

    return (
      <View className={classNames('filelist', { active: recording })}>
        {
          fileList && <FileList shouldUpdateFileList={this.shouldUpdateFileList} fileList={fileList} />
        }
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

export default FileListPage as ComponentClass<PageOwnProps, PageState>
