import '@tarojs/async-await'
import Taro, { Component, Config } from '@tarojs/taro'
import { Provider } from '@tarojs/redux'
// import { getVipLevel, getSystemConfig } from '@/redux/actions/config'
// import { checkToken } from '@/services/user'
// import { getUserDetail } from '@/redux/actions/user'

import { showToast, ShowToastParam } from './utils'
import Index from './pages/index'
import { store } from './redux/store'
import { UPDATE_GLOBAL_DATA } from './redux/actions/global'
import { getUserDetail } from './redux/actions/user'
import './app.scss'


// 如果需要在 h5 环境中开启 React Devtools
// 取消以下注释：
// if (process.env.NODE_ENV !== 'production' && process.env.TARO_ENV === 'h5')  {
//   require('nerv-devtools')
// }

class App extends Component {

  async componentWillMount() {
    // 检测版本更新
    const updateManager = Taro.getUpdateManager()
    updateManager.onUpdateReady(() => {
      Taro.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success(res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        },
      })
    })



    // 检测网络状况
    Taro.getNetworkType({
      success: (res: { networkType: string }) => {
        const networkType = res.networkType
        if (networkType === 'none') {
          // 更新断网状态
          this.updateNetworkStatus(false)
          showToast({
            title: '当前无网络',
            icon: 'loading',
            duration: 2000,
          })
        }
      },
    })

    // 监听网络状态
    Taro.onNetworkStatusChange(res => {
      if (!res.isConnected) {
        // 更新断网状态
        this.updateNetworkStatus(false)
        showToast({
          title: '网络已断开',
          icon: 'loading',
          duration: 2000,
          complete: () => {
            // 网络断开处理逻辑
            // this.goStartIndexPage()
          },
        })
      } else {
        this.updateNetworkStatus(true)
        Taro.hideToast()
      }
    })
  }

  /**
   * 指定config的类型声明为: Taro.Config
   *
   * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
   * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
   * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
   */
  config: Config = {
    pages: [
      'pages/index/index',
      'pages/filelist/index',
      'pages/authorize/index',
      'pages/room/index',
      'pages/challenge/index',
      'pages/sharePoster/index',
      'pages/account/index',
    ],
    window: {
      backgroundTextStyle: 'light',
      navigationBarBackgroundColor: '#fff',
      navigationBarTitleText: '',
      navigationBarTextStyle: 'black',
    },
    tabBar: {
      color: '#707070',
      selectedColor: '#1AAD19',
      // borderStyle: 'black',
      backgroundColor: '#1b1c20',
      list: [
        {
          pagePath: 'pages/filelist/index',
          iconPath: 'assets/images/files.png',
          selectedIconPath: 'assets/images/files-selected.png',
          text: '录音列表',
        },
        {
          pagePath: 'pages/index/index',
          iconPath: 'assets/images/record.png',
          selectedIconPath: 'assets/images/record-selected.png',
          text: '倒放挑战',
        },
        // {
        //   pagePath: 'pages/shop-cart/index',
        //   iconPath: 'assets/icon/shopcart.jpg',
        //   selectedIconPath: 'assets/icon/shopcart-selected.jpg',
        //   text: '购物车',
        // },
        {
          pagePath: 'pages/account/index',
          iconPath: 'assets/images/account.png',
          selectedIconPath: 'assets/images/account-selected.png',
          text: '我的',
        },
      ],
    },
  }


  async componentDidShow() {
    this.checkLogin().catch(() => {
      // 未登录
      // this.goToLoginPage()
    })
  }

  checkLogin = (): Promise<any> => new Promise(async (resolve, reject) => {
    try {
      // const token = Taro.getStorageSync('token')
      // // 本地没有登录 token
      // if (!token) {
      //   return reject()
      // }

      await this.checkSession()

      const userDetail = await store.dispatch(getUserDetail())

      if (!userDetail.isLogin) {
        return reject()
      }
      resolve()
    } catch (e) {
      reject(e)
    }
  })

  // 检查用户授权的 session
  checkSession = () => new Promise((resolve, reject) => {
    Taro.checkSession({
      success: resolve,
      fail: reject,
    })
  })

  showToastP = (options: ShowToastParam) => new Promise(resolve => {
    showToast({
      ...options,
      complete: resolve,
    })
  })

  componentDidHide() { }

  componentDidCatchError() { }

  // 更新网络状态
  updateNetworkStatus = async (isConnected: boolean) => {
    await store.dispatch({
      type: UPDATE_GLOBAL_DATA,
      data: {
        isConnected,
      },
    })
  }

  goToLoginPage = () => {
    // Taro.removeStorageSync('token')
    setTimeout(() => {
      Taro.navigateTo({
        url: '/pages/authorize/index',
      })
    }, 300)
  }
  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return (
      <Provider store={store}>
        <Index />
      </Provider>
    )
  }
}

Taro.render(<App />, document.getElementById('app'))
