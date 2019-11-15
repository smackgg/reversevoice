import Taro from '@tarojs/taro'
import { API_URL } from './'
import request from './request'

export type File = {
  createTime: number
  filePath: string
  size: number
}

export type LocalFileInfo = {
  path: string,
  index: number,
  reverseFilePath: string,
  file?: File,
  reverseFile?: File,
  new?: boolean
}

// 获取本地缓存的列表
const getLSFiles = (): LocalFileInfo[]  => {
  const voiceFiles = JSON.parse(Taro.getStorageSync('voiceFiles') || '[]')
  return voiceFiles.sort((a: LocalFileInfo, b: LocalFileInfo) => a.index > b.index ? -1 : 1)
}

// 写入本地缓存的正常文件
const setLSFile = (savedFilePath: string) => {
  const voiceFiles = getLSFiles()
  const index = voiceFiles.length > 0 ? voiceFiles[0].index + 1 : 1
  const fileInfo = {
    path: savedFilePath,
    index,
    reverseFilePath: '',
  }

  voiceFiles.unshift(fileInfo)

  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles))
  return fileInfo
}

// 获取本地缓存列表
export const getFiles = (): Promise<LocalFileInfo[]> => new Promise((resolve, reject) => {
  Taro.getSavedFileList({
    success: (res: any) => {
      const localFiles = getLSFiles()
      const fileList = res.fileList || []
      const files = localFiles.map((localFile: LocalFileInfo) => {
        fileList.forEach((file: File, index: number) => {
          if (localFile.path === file.filePath) {
            // 源文件
            localFile.file = file
            fileList[index].valid = true
          }
          if (localFile.reverseFilePath === file.filePath) {
            // 反转文件
            localFile.reverseFile = file
            fileList[index].valid = true
          }
        })
        return localFile
      })


      // 删除缓存中没有存数据的文件
      fileList.forEach((file: any) => {
        if (!file.valid) {
          removeSavedFilePromise(file.filePath)
        }
      })

      resolve(files)
    },
  })
})

// 写入本地缓存的反转文件
const setLSRFile = (savedFilePath: string, oriFileIndex: number) => {
  const voiceFiles = getLSFiles()

  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles.map((file: LocalFileInfo) => {
    if (file.index === oriFileIndex) {
      return {
        ...file,
        reverseFilePath: savedFilePath,
      }
    }
    return file
  })))
}



// 音频反转
export const reverse = (reverseFile: LocalFileInfo): Promise<any> => {
  if (!reverseFile) {
    return Promise.reject()
  }

  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${API_URL}/api/file/mp3/reverse`,
      filePath: reverseFile.path,
      name: 'file',
      formData: {
        'msg': 'voice',
      },
      header: {
        'Content-Type': 'multipart/form-data',
        'accept': 'application/json',
      },
      success: (res) => {
        const data = JSON.parse(res.data)
        const path = data.data.path
        //do something
        Taro.downloadFile({
          url: `${API_URL}/${path}`,
          success: (saveRes) => {
            // 更新文件列表
            // this.await ()
            Taro.saveFile({
              tempFilePath: saveRes.tempFilePath,
              success: (res) => {
                setLSRFile(res.savedFilePath, reverseFile.index)
                resolve()
              },
              fail: () => {
                reject()
              },
            })

            // 清除文件
            request({
              url: `${API_URL}/api/file/mp3/reverse?path=${path}`,
              method: 'DELETE',
            })
          },
        })
      },
    })
  })
}

// 缓存本地音频状态
export const saveFile = (tempFilePath: string): Promise<LocalFileInfo> => {
  return new Promise((resolve, reject) => {
    Taro.saveFile({
      tempFilePath,
      success: (res) => {
        const fileInfo = setLSFile(res.savedFilePath)
        resolve(fileInfo)
        // res.savedFilePath
        // 更新文件列表
        // this.getFiles()
      },
      fail: reject,
    })
  })
}

const removeSavedFilePromise = (filePath: string) => new Promise(resolve => {
  Taro.removeSavedFile({
    filePath: filePath,
    success: resolve,
    fail: resolve,
  })
})

// 删除本地文件 和 文件 map 数据
export const deleteFile = async (file: LocalFileInfo) => {
  if (!file.file || !file.reverseFile) {
    return
  }
  Taro.showLoading({ title: '删除中...', mask: true })

  try {
    let files = await getLSFiles()
    console.log(files)

    await Promise.all([
      removeSavedFilePromise(file.file.filePath),
      removeSavedFilePromise(file.reverseFile.filePath),
    ])
    Taro.showToast({
      title: '删除成功',
      icon: 'success',
    })

    Taro.setStorageSync('voiceFiles', JSON.stringify(files.filter((f) => f.index !== file.index)))
  } catch (error) {
    Taro.showToast({
      title: '删除失败',
      icon: 'none',
    })
  }

  Taro.hideLoading()

}
