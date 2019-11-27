# 倒放挑战 - ReverseVoice (微信小程序版) Ts Node Taro

整个项目其实很简单，从本人在抖音和 B 站看到火起来到最终小程序上线也就几天的下班时间就搞定了，11月16日上线至今用户量还是蛮多的(主要当时做的快此类 app 比较少😂)，现在已经出现了大量的更简约更好的倒放挑战 app，本项目开源仅供大家学习~

拥抱 TypeScript
顺便小声吐槽一下 Taro 对 Ts 的支持还是不够啊，希望大家多去给 Taro 提 dts 的 PR ~

# 体验

## 小程序二维码
![小程序二维码](/static/qr.png)

## 挑战分享海报 (这个海报暂时有问题，修复代码因为资质问题还没有提交审核)
![挑战分享海报](/static/share.png)


# 功能介绍/实现原理
- 功能及实现原理简述
1. 小程序端用户录音并保存本地
2. 录音后将录音文件上传至后端进行倒放处理，并返回处理后的音频 url
3. 小程序端下载 url 文件，提示用户反转成功，将数据做本地 map
4. 用户点击分享，生成分享链接，并将该分享正放、倒放视频均传至后端保存至七牛云
5. 同时新建分享 room 保存用户信息，返回 roomId
6. 用户分享（海报分享 canvas 动态生成分享码海报）
7. 其它用户参加挑战，存储原理同 4，只是增加将挑战者信息了存入 room 的逻辑

- 音频倒放
使用 ffmpeg 进行音频倒放，核心代码：
```js
// 详见 ./server/src/controllers/file.ts => function reverseVoice
import ffmpegPath from '@ffmpeg-installer/ffmpeg'
import ffprobePath from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
ffmpeg.setFfprobePath(ffprobePath.path)
ffmpeg.setFfmpegPath(ffmpegPath.path)

ffmpeg(filepath)
    .format('mp4')
    // 反转
    .outputOptions([
      '-vf reverse',
      '-af areverse',
      '-preset',
      'superfast',
      '-y',
    ])
    .on('progress', (progress) => {
      // send upload progress
      console.log('upload-file-progress', progress.percent)
    })
    .on('error', (err) => {
      console.log(`Ffmpeg has been killed${err.message}`)
    })
    .toFormat('mp3')
    // 保存
    .save(publicPath + saveFilePath)
    .on('end', () => {
      // 获取音频信息（时长等）
      ffmpeg.ffprobe(publicPath + saveFilePath, (err, metadata) => {
        console.log(metadata.format.duration)
      })
    })
```
- 小程序录音
小程序录音使用官方 api，详细逻辑见 [./wechatapp/pages/index/index.tsx](https://github.com/smackgg/reversevoice/blob/master/wechatapp/src/pages/index/index.tsx#L136)

[录音](https://developers.weixin.qq.com/miniprogram/dev/api/media/audio/InnerAudioContext.html)

- 海报生成
利用 canvas 动态合成分享海报 ```./wechatapp/pages/sharePoster```
需要动态请求页面小程序码，涉及微信AccessToken鉴权等，详见 ```./server/src/controllers/wechat.ts```, 下面贴出部分核心代码

```js
// 画图
const draw = async () => {
  // 绘制之前 loading
  Taro.showLoading({
    title: '海报生成中...',
    mask: true,
  })
  // 获取图片信息
  const [productImgInfo, qrcodeImgInfo] = await Promise.all([
    this.getImageInfo(sharePoster), // 获取主图
    this.getQrImgInfo(), // 获取二维码图片
  ])

  // product image 宽高
  const pW = CANVAS_WIDTH
  const pH = (pW / productImgInfo.width) * productImgInfo.height

  // canvas 高度
  let canvasHeight = pH

  const ctx = Taro.createCanvasContext('canvas', null)

  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, CANVAS_WIDTH, canvasHeight)

  // 绘制背景图片
  ctx.drawImage(sharePoster, 0, 0, pW, pH)

  // 绘制二维码 （因为有角度，需要旋转画布，再旋转回来）
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
  }, 500)
}
```

- 微信分享 HOC 函数  [./wechatapp/components/@withShare](https://github.com/smackgg/reversevoice/blob/master/wechatapp/src/components/%40withShare/index.tsx)

```js
// 微信小程序每个页面几乎都需要配置分享的参数，并且需要动态更改分享参数
// 所以抽离 HOC 组件，方便页面使用
import { ComponentClass } from 'react'

import Taro from '@tarojs/taro'
import { connect } from '@tarojs/redux';
import defaultShareImg from '@/assets/images/share.png'

type Options = {
  title?: string
  imageUrl?: string
  path?: string
}

const defalutOptions: Options = {
  title: '你能听懂我说啥么？最近很火的反转录音来啦~',
  imageUrl: defaultShareImg,
  path: 'pages/index/index',
}

function withShare() {
  return function demoComponent(Component: ComponentClass) {
    @connect(({ user }) => ({
      userInfo: user.userInfo
    }))
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
```

[使用 ](https://github.com/smackgg/reversevoice/blob/master/wechatapp/src/pages/index/index.tsx#L53)
```js
@withShare()
class Room extends Component {
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
    title: '倒放挑战！你能听懂我倒立洗头~',
    path: 'pages/index/index',
    imageUrl: '',
  }

  /**
    ....
  */
}

```

- 微信用户登录流程
[微信官方文档登录流程](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html)
具体实现可以去看源码


# 项目运行 - 后端

## 准备
需要提前安装:
- Install [Node.js](https://nodejs.org/en/)
- Install [MongoDB](https://docs.mongodb.com/manual/installation/)

## 开始
- 克隆项目并进入后端目录
```
cd server
```
- 安装依赖
```
npm install
```
- 设置 mongoDB
```bash
# create the db directory
sudo mkdir -p /data/db
# give the db correct read/write permissions
sudo chmod 777 /data/db

# starting from macOS 10.15 even the admin cannot create directory at root
# so lets create the db diretory under the home directory.
mkdir -p ~/data/db
# user account has automatically read and write permissions for ~/data/db.
```
- 启动 mongoDB (Start your mongoDB server (you'll probably want another command prompt)
```bash
mongod

# on macOS 10.15 or above the db directory is under home directory
mongod --dbpath ~/data/db
```
-  打包并运行项目
```
npm run build
npm start
```

# 项目运行 - 小程序端
## 准备
需要提前安装:
- Install [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

## 开始
- 克隆项目并进入小程序目录
```
cd wechatapp
```
- 安装依赖
```
npm install
```

- 新建 .env 文件
```
在 wechatapp/src/utils 目录下克隆 env.example.ts 文件至同目录命名为 .env.ts 文件
此文件两个参数分别代表本地开发和线上部署的请求地址
```

-  运行项目
```
npm run dev:weapp // development mode
或者 npm run build:weapp // production mode
```

- 微信开发者工具
```
选择导入项目，并选择 wechatapp/dist 目录
若本地开发，需要在开发者工具中设置开启“不校验合法域名“
```

# License

MIT
