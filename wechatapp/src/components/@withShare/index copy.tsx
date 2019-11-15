import { ComponentClass } from 'react'
import Taro from '@tarojs/taro';
import { connect } from '@tarojs/redux';
// import defaultShareImg from 'xxx.jpg';

type Options = {
  title?: string
  imageUrl?: string
  path?: string
}

const defalutOptions = {
  title: '你能听懂我说啥么？最近很火的反转录音来啦~',
  imageUrl: '',
  path: 'pages/index/index'
}

// Component: ComponentClass
function withShare(options: Options = defalutOptions) {
  // console.log(options)
  return function demoComponent(Component) {
    // redux里面的用户数据
    @connect(({ user }) => ({
      userInfo: user.userInfo
    }))
    class WithShare extends Component {
      options: Options

      async componentWillMount() {
        Taro.showShareMenu({
          withShareTicket: true,
        })

        if (super.componentWillMount) {
          super.componentWillMount()
        }

        this.setOptions(options)
      }

      // 拼接默认 options
      setOptions = (opt: Options) => {
        // const { userInfo } = this.props;
        // 每条分享都补充用户的分享id
        // 如果path不带参数，分享出去后解析的params里面会带一个{''： ''}
        // const sharePath = `${path}&shareFromUser=${userInfo.shareId}`;
        // const sharePath = path

        this.options = {
          ...defalutOptions,
          ...opt,
        }
      }

      // 传递给子组件的方法
      setShareOption = (opt: Options) => {
        this.setOptions(opt)
      }

      // 点击分享
      onShareAppMessage() {
        this.$test()
        return this.options
      }

      render() {
        console.log(Component)
        return super.render()
      }
    }

    // return WithShare
  }
}

export default withShare
