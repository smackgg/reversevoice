import { ComponentClass } from 'react'
import Taro, { Component, Config, getImageInfo } from '@tarojs/taro'
// import { connect } from '@tarojs/redux'
import { View, Canvas, Button } from '@tarojs/components'
import { cError, base64src } from '@/utils'
import { getWxacodeunlimit } from '@/services/user'
import sharePoster from '../../assets/images/share-poster.jpg'

import './index.scss'


// 获取屏幕设备信息
const { windowWidth, pixelRatio } = Taro.getSystemInfoSync()

const ratio = windowWidth / 375
// 在 dom 中展示 canvas 的宽度
// canvas 750下画布大小
const CANVAS_BASE_WIDTH = 300

// 真实的 canvas 大小
const CANVAS_WIDTH = ratio * CANVAS_BASE_WIDTH
const CANVAS_HEIGHT = (CANVAS_WIDTH / 1242) * 2208
const QR_WIDTH = (CANVAS_WIDTH / 1242) * 320
const QR_TOP = (CANVAS_WIDTH / 1242) * 1092
const QR_LEFT = (CANVAS_WIDTH / 1242) * 420

type PageStateProps = {
}

type PageDispatchProps = {
}

type PageOwnProps = {}

type PageState = {
  canvasStyle: {
    width: number;
    height: number;
  }
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface SharePoster {
  props: IProps
}

class SharePoster extends Component {
  /**
 * 指定config的类型声明为: Taro.Config
 *
 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
 */
  config: Config = {
    navigationBarTitleText: '生成分享海报',
  }

  roomId: string
  // timer?: number
  // RecorderManager: RecorderManager
  // tempFilePath?: string

  state: PageState = {
    // recording: false,
    canvasStyle: {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
    },
  }

  async componentDidShow() {
    let { roomId } = this.$router.params
    this.roomId = roomId

    try {
      this.draw()
    } catch (error) {
      Taro.hideLoading()
      Taro.showModal({
        title: '生成海报失败',
        content: '请稍候重试~',
        showCancel: false,
        success: (res) => {
          if (res.confirm) {
            Taro.navigateBack({
              fail: () => Taro.navigateTo({
                url: `/pages/room/index?roomId=${this.roomId}`,
              }),
            })
          }
        },
      })
    }
  }

  // 获取图片信息
  getImageInfo = async (url: string): Promise<getImageInfo.Promised> => new Promise(resolve => {
    getImageInfo({
      src: url,
      success: resolve,
      fail: (err) => {
        console.log(err, 'err')
      },
    })
  })

  // 画图
  draw = async () => {
    Taro.showLoading({
      title: '海报生成中...',
      mask: true,
    })
    // 获取图片信息
    const [productImgInfo, qrcodeImgInfo] = await Promise.all([
      await this.getImageInfo(sharePoster),
      await this.getQrImgInfo(),
    ])

    // product image 宽高
    const pW = CANVAS_WIDTH
    const pH = (pW / productImgInfo.width) * productImgInfo.height
    // product image margin

    // canvas 高度
    let canvasHeight = pH


    const ctx = Taro.createCanvasContext('canvas', null)

    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)

    // 绘制商品图片
    ctx.drawImage(sharePoster, 0, 0, pW, pH)

    // console.log(qrcodeImgInfo)
    // product image 宽高
    // const qW = 60 * ratio
    // const qH = (qW / qrcodeImgInfo.width) * qrcodeImgInfo.height
    // console.log(qrcodeImgInfo, QR_LEFT, QR_TOP, QR_WIDTH, QR_WIDTH)

    // 绘制二维码
    ctx.rotate(-Math.PI / 32)
    ctx.translate(-25 * ratio, 10 * ratio)
    ctx.drawImage(qrcodeImgInfo.path, QR_LEFT, QR_TOP, QR_WIDTH, QR_WIDTH)
    ctx.rotate(Math.PI / 32)
    this.setState({
      canvasStyle: {
        ...this.state.canvasStyle,
        height: canvasHeight,
      },
    })
    ctx.stroke()
    setTimeout(() => {
      Taro.hideLoading()
      ctx.draw()
    }, 1000)
  }

  // 处理二维码信息
  getQrImgInfo = async (): Promise<getImageInfo.Promised> => {
    const [error, res] = await cError(getWxacodeunlimit({
      scene: `roomId=${this.roomId}`,
      page: 'pages/room/index',
      // page: 'pages/index/index',
    }))

    if (error) {
      Taro.showToast({
        title: res.msg,
        icon: 'none',
        duration: 2000,
      })
      return Promise.reject()
    }

    const url = await base64src(res.data.imgUrl)
    // 测试数据
    const qrcodeImgInfo = await this.getImageInfo(url)

    return qrcodeImgInfo
  }


  // 保存到手机相册
  saveToMobile = () => {
    const { canvasStyle: { width, height } } = this.state
    Taro.canvasToTempFilePath({
      canvasId: 'canvas',
      destWidth: width * pixelRatio,
      destHeight: height * pixelRatio,
      success: res => {
        // pixelRatio
        let tempFilePath = res.tempFilePath
        Taro.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: () => {
            Taro.showModal({
              content: '图片已保存到手机相册',
              showCancel: false,
              confirmText: '知道了',
              confirmColor: '#333',
            })
          },
          fail: () => {
            Taro.showToast({
              title: '保存失败, 请重试',
              icon: 'none',
              duration: 2000,
            })
          },
        })
      },
    })
  }

  render() {
    const { canvasStyle: { width, height } } = this.state
    const styles = {
      width: `${width}px`,
      height: `${height}px`,
    }
    return (
      <View className="container">
        <View className="canvas-wrapper" style={styles}>
          <Canvas className="canvas" style={styles} canvasId="canvas"></Canvas>
        </View>
        <Button className="button primary" type="primary" onClick={this.saveToMobile}>保存到手机相册</Button>
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

export default SharePoster as ComponentClass<PageOwnProps, PageState>
