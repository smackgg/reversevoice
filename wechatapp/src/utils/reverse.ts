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
  file: File,
  reverseFile: File,
}

// 获取本地缓存的列表
const getLSFiles = () => {

  const voiceFiles = JSON.parse(Taro.getStorageSync('voiceFiles') || '[]')
  return voiceFiles.sort((a: LocalFileInfo, b: LocalFileInfo) => a.index > b.index ? -1 : 1)
}

// 写入本地缓存的正常文件
const setLSFile = (savedFilePath: string) => {
  console.log('savedFilePath', 111)
  const voiceFiles = getLSFiles()
  console.log(voiceFiles)
  const index = voiceFiles.length > 0 ? voiceFiles[voiceFiles.length - 1].index + 1 : 1
  const fileInfo = {
    path: savedFilePath,
    index,
  }

  voiceFiles.push(fileInfo)

  Taro.setStorageSync('voiceFiles', JSON.stringify(voiceFiles))
  return fileInfo
}

// 获取本地缓存列表
export const getFiles = () => new Promise((resolve, reject) => {
  Taro.getSavedFileList({
    success: (res: any) => {
      const localFiles = getLSFiles()
      const fileList = res.fileList || []
      const files = localFiles.map((localFile: LocalFileInfo) => {
        fileList.forEach((file: File) => {
          if (localFile.path === file.filePath) {
            localFile.file = file
          }
          if (localFile.reverseFilePath === file.filePath) {
            localFile.reverseFile = file
          }
        })
        return localFile
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
            // this.getFiles()
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
        console.log(res.savedFilePath)
        const fileInfo = setLSFile(res.savedFilePath)
        resolve(fileInfo)
        // res.savedFilePath
        // 更新文件列表
        // this.getFiles()
      },
      fail: () => {
        reject()
      },
    })
  })
}
