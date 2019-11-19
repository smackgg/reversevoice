import Taro from '@tarojs/taro'

export const getRecordAuth = () => {
  return new Promise((resolve) => {
    Taro.getSetting({
      success(res: any) {
        if (!res.authSetting['scope.record']) {
          Taro.authorize({
            scope: 'scope.record',
            success(authRes: any) {
              // 用户已经同意小程序使用录音功能，后续调用 wx.startRecord 接口不会弹窗询问
              // wx.startRecord()
              resolve(true)
            },
            fail() {
              // console.log('err', err, 11111)
              Taro.showModal({
                title: '该功能授权使用',
                content: '是否进入授权页面并开启“录音功能”权限？',
                success(modalRes: any) {
                  if (modalRes.confirm) {
                    // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
                    // updateManager.applyUpdate()
                    Taro.openSetting()
                  }
                },
              })
              resolve(false)
            },
          })
        } else {
          resolve(true)
        }
      },
    })
  })
}
