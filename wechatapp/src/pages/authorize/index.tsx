import { ComponentClass } from 'react'

import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image, Checkbox, Text, Button, Form } from '@tarojs/components'
import { connect } from '@tarojs/redux'
import { login } from '@/services/user'
import { cError } from '@/utils'
import { getUserDetail } from '@/redux/actions/user'

import wechatSafeIcon from '@/assets/images/wechat-safe.png'

import './index.scss'


type PageStateProps = {
  isConnected: boolean
  mobile: string
}

type PageDispatchProps = {
  getUserDetail: () => Promise<void>
}

type PageOwnProps = {}

type PageState = {
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Auth {
  props: IProps
}

@connect(({ global, user }) => ({
  isConnected: global.isConnected,
  mobile: user.userDetail.mobile,
}), (dispatch: any) => ({
  getUserDetail: () => dispatch(getUserDetail()),
}))

class Auth extends Component {

  fromPage: string

  config: Config = {
    navigationBarTitleText: '授权',
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTextStyle: 'white',
  }

  componentWillMount() {
    this.fromPage = decodeURIComponent(this.$router.params.from || '/pages/entry/index')

    Taro.setNavigationBarColor({
      backgroundColor: '#1AAD19',
      frontColor: '#ffffff',
    })
  }

  // 用户点击授权
  getUserInfo = (e: TaroBaseEventOrig) => {
    if (!e.detail.userInfo) {
      return
    }

    const { isConnected } = this.props

    if (isConnected) {
      Taro.setStorageSync('userInfo', e.detail.userInfo)
      this.login()
    } else {
      Taro.showToast({
        title: '当前无网络',
        icon: 'none',
      })
    }
  }

  // 登录处理
  login = async () => {
    const tokenStorage = Taro.getStorageSync('token')
    if (tokenStorage) {
      // 校验 token 是否有效
      const res: any = await getUserDetail()

      if (!res.isLogin) {
        Taro.removeStorageSync('token')
        this.login()
        return
      }

      this.handleLoginSuccess()
      return
    }

    Taro.login({
      success: async res => {
        Taro.getUserInfo({
          success: async result => {
            const { iv, encryptedData } = result

            // 登录接口
            const [error, loginRes] = await cError(login({ code: res.code, iv, encryptedData }))

            // 登录错误
            if (error || loginRes.code !== 0) {
              Taro.hideLoading()
              Taro.showModal({
                title: '提示',
                content: '无法登录，请重试',
                showCancel: false,
              })
              return
            }
            this.handleLoginSuccess()
          },
        })
      },
    })
  }

  // 处理授权登录成功后逻辑
  handleLoginSuccess = async () => {
    await this.props.getUserDetail()
    Taro.navigateBack({
      fail: () => Taro.switchTab({
        url: '/pages/index/index',
      }),
    })
  }

  // 跳转回首页
  goHome = () => Taro.navigateBack({
    fail: () => Taro.switchTab({
      url: '/pages/index/index',
    }),
  })

  render () {
    return (
      <View className="container">
        <Form reportSubmit>
          <View className="top">
            <Image className="safe-icon" src={wechatSafeIcon} mode="widthFix" />
            <View>应用需要授权获得以下权限</View>
          </View>
          <Checkbox value="" checked disabled className="checkbox"><Text className="checkbox-info">获得你的公开信息（昵称、头像等）</Text></Checkbox>
          <View className="info2">*未授权无法进行分享、保存录音等操作</View>
          <Button formType="submit" className="button" type="primary" openType="getUserInfo" onGetUserInfo={this.getUserInfo}>允许授权</Button>
          <View className="info1" onClick={this.goHome}>暂不授权</View>
        </Form>
      </View>
    )
  }
}

export default Auth as ComponentClass<PageOwnProps, PageState>

