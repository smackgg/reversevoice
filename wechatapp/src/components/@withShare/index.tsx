import { ComponentClass } from 'react'

import Taro from '@tarojs/taro'
// import { connect } from '@tarojs/redux';
import defaultShareImg from '@/assets/images/share.png'

type Options = {
  title?: string
  imageUrl?: string
  path?: string
}

const defalutOptions = {
  title: '你能听懂我说啥么？最近很火的反转录音来啦~',
  imageUrl: defaultShareImg,
  path: 'pages/index/index',
}

function withShare() {
  return function demoComponent(Component: ComponentClass) {
    // @connect(({ user }) => ({
    //   userInfo: user.userInfo
    // }))
    class WithShare extends Component {
      $shareOptions?: Options
      async componentWillMount() {
        Taro.showShareMenu({
          withShareTicket: true,
        })

        if (super.componentWillMount) {
          super.componentWillMount()
        }
      }

      // 点击分享的那一刻会进行调用
      onShareAppMessage() {
        // const sharePath = `${path}&shareFromUser=${userInfo.shareId}`
        let options = defalutOptions
        if (this.$shareOptions) {
          options = {
            ...defalutOptions,
            ...this.$shareOptions,
          }
        }
        return options
      }

      render() {
        return super.render()
      }
    }

    return WithShare
  }
}

export default withShare
