import Taro from '@tarojs/taro'
import { deleteFile as deleteFileApi } from '@/services/file'

import { API_URL } from './'

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
  roomId?: string,
  otherName?: string,
  duration: number,
}

// 获取本地缓存的列表
const getLSFiles = (): LocalFileInfo[]  => {
  const voiceFiles = JSON.parse(Taro.getStorageSync('voiceFiles') || '[]')
  return voiceFiles.sort((a: LocalFileInfo, b: LocalFileInfo) => a.index > b.index ? -1 : 1)
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

// 写入本地缓存的正常文件
const setLSFile = (savedFilePath: string) => {
  const voiceFiles = getLSFiles()
  const index = voiceFiles.length > 0 ? voiceFiles[0].index + 1 : 1
  const fileInfo = {
    path: savedFilePath,
    index,
    reverseFilePath: '',
    duration: 0,
  }

  voiceFiles.unshift(fileInfo)

  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles))
  return fileInfo
}

// 写入本地缓存的反转文件
const setLSRFile = (savedFilePath: string, oriFileIndex: number, duration: number) => {
  const voiceFiles = getLSFiles()
  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles.map((file: LocalFileInfo) => {
    if (file.index === oriFileIndex) {
      return {
        ...file,
        reverseFilePath: savedFilePath,
        duration,
      }
    }
    return file
  })))
  return oriFileIndex
}

// 获取音频文件长度
export const getDurationByFilePath = (path: string): number => {
  const match = path.match(/\.durationTime=(\d+)/)
  return +(match && match[1] ? match[1] : 0) / 1000
}

// 设置本地 room id
export const setLSRFileValue = (index: number, key: 'otherName' | 'roomId', value: string) => {
  const voiceFiles = getLSFiles()
  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles.map((file: LocalFileInfo) => {
    if (file.index === index) {
      file[key] = value
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
      fail: reject,
      success: (res) => {
        const data = JSON.parse(res.data)
        const { path, duration } = data.data
        //do something
        Taro.downloadFile({
          url: `${API_URL}/${path}`,
          success: (saveRes) => {
            // 更新文件列表
            // this.await ()
            Taro.saveFile({
              tempFilePath: saveRes.tempFilePath,
              success: (res) => {
                const index = setLSRFile(res.savedFilePath, reverseFile.index, duration)
                resolve(index)
              },
              fail: reject,
            })

            // 清除文件
            deleteFileApi({ path })
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

// 上传文件
export const uploadFile = ({
  path,
  duration,
}: {
  path: string,
  duration: number,
}): Promise<any> => {
  return new Promise((resolve, reject) => {
    Taro.uploadFile({
      url: `${API_URL}/api/file/mp3/upload`,
      filePath: path,
      name: 'file',
      formData: {
        duration,
      },
      header: {
        'Content-Type': 'multipart/form-data',
        'accept': 'application/json',
      },
      success: (res) => {
        if (res.statusCode !== 200) {
          return reject()
        }
        const data = JSON.parse(res.data)
        resolve(data)
      },
      fail: reject,
    })
  })
}
