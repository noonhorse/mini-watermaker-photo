// utils/share.ts
// 分享功能工具类
// 已适配 uni-app 多平台
import type { ShareOptions, ShareType, ShareResult } from '@/types/index'

/**
 * 分享图片到不同平台
 * @param options 分享选项
 */
export function shareImage(options: ShareOptions): void {
  const {
    filePath,
    type,
    success = () => {},
    fail = () => {}
  } = options

  if (!filePath) {
    fail({ errMsg: '图片路径不能为空' })
    return
  }

  switch (type) {
    case 'album':
      saveToAlbum(filePath, success, fail)
      break
    case 'friend':
      shareToFriend(filePath, success, fail)
      break
    case 'moments':
      shareToMoments(filePath, success, fail)
      break
    default:
      fail({ errMsg: '不支持的分享类型' })
  }
}

/**
 * 保存图片到相册
 * @param filePath 图片路径
 * @param success 成功回调
 * @param fail 失败回调
 */
export function saveToAlbum(
  filePath: string,
  success: () => void = () => {},
  fail: (err: any) => void = () => {}
): void {
  // #ifdef MP-WEIXIN
  wx.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      success()
    },
    fail: (err: any) => {
      if (err.errMsg.includes('auth')) {
        wx.showModal({
          title: '提示',
          content: '需要授权访问相册才能保存图片',
          confirmText: '去授权',
          success: (res: any) => {
            if (res.confirm) {
              wx.openSetting({
                success: (settingRes: any) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    saveToAlbum(filePath, success, fail)
                  }
                }
              })
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
        fail(err)
      }
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' })
      success()
    },
    fail: (err: any) => {
      console.error('保存失败', err)
      uni.showToast({ title: '保存失败', icon: 'none' })
      fail(err)
    }
  })
  // #endif
}

/**
 * 分享给朋友
 * @param filePath 图片路径
 * @param success 成功回调
 * @param fail 失败回调
 */
export function shareToFriend(
  filePath: string,
  success: () => void = () => {},
  fail: (err: any) => void = () => {}
): void {
  const fileName = `水印照片_${formatDateTime(new Date())}.jpg`

  // #ifdef MP-WEIXIN
  wx.shareFileMessage({
    filePath: filePath,
    fileName: fileName,
    success: () => {
      wx.showToast({ title: '分享成功', icon: 'success' })
      success()
    },
    fail: (err: any) => {
      wx.showToast({ title: '分享失败', icon: 'none' })
      fail(err)
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.share({
    provider: 'weixin',
    type: 2,
    filePath: filePath,
    success: () => {
      uni.showToast({ title: '分享成功', icon: 'success' })
      success()
    },
    fail: (err: any) => {
      uni.showToast({ title: '分享失败', icon: 'none' })
      fail(err)
    }
  })
  // #endif
}

/**
 * 分享到朋友圈（引导用户手动分享）
 * @param filePath 图片路径
 * @param success 成功回调
 * @param fail 失败回调
 */
export function shareToMoments(
  filePath: string,
  success: () => void = () => {},
  fail: (err: any) => void = () => {}
): void {
  uni.showModal({
    title: '分享到朋友圈',
    content: '将先保存图片到相册，然后您可以在微信朋友圈中选择该图片进行分享',
    confirmText: '保存图片',
    success: (res: any) => {
      if (res.confirm) {
        saveToAlbum(filePath, success, fail)
      }
    }
  })
}

/**
 * 显示分享选项菜单
 * @param filePath 图片路径
 * @param callback 选择回调
 */
export function showShareMenu(
  filePath: string,
  callback: (result: ShareResult) => void = () => {}
): void {
  if (!filePath) {
    uni.showToast({
      title: '请先拍照',
      icon: 'none'
    })
    return
  }

  // #ifdef MP-WEIXIN
  wx.showActionSheet({
    itemList: ['保存到相册', '发送给朋友', '分享到朋友圈'],
    success: (res: any) => {
      const types: ShareType[] = ['album', 'friend', 'moments']
      const selectedType = types[res.tapIndex]

      shareImage({
        filePath: filePath,
        type: selectedType,
        success: () => {
          callback({ success: true, type: selectedType })
        },
        fail: (err: any) => {
          callback({ success: false, type: selectedType, error: err })
        }
      })
    },
    fail: () => {
      callback({ success: false, cancelled: true } as ShareResult)
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.showActionSheet({
    itemList: ['保存到相册', '分享'],
    success: (res: any) => {
      const types: ShareType[] = ['album', 'friend']
      const selectedType = types[res.tapIndex]

      shareImage({
        filePath: filePath,
        type: selectedType,
        success: () => {
          callback({ success: true, type: selectedType })
        },
        fail: (err: any) => {
          callback({ success: false, type: selectedType, error: err })
        }
      })
    },
    fail: () => {
      callback({ success: false, cancelled: true } as ShareResult)
    }
  })
  // #endif
}

/**
 * 格式化日期时间
 * @param date 日期对象
 * @returns 格式化后的日期时间字符串
 */
function formatDateTime(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

/**
 * 生成分享统计数据
 * @param type 分享类型
 * @param photoInfo 照片信息
 */
export function recordShareStats(type: string, photoInfo?: any): void {
  try {
    const stats = uni.getStorageSync('shareStats') || {}
    const today = new Date().toDateString()

    if (!stats[today]) {
      stats[today] = { album: 0, friend: 0, moments: 0, total: 0 }
    }

    stats[today][type] = (stats[today][type] || 0) + 1
    stats[today].total = (stats[today].total || 0) + 1

    uni.setStorageSync('shareStats', stats)
    console.log('分享统计已记录:', type, stats[today])
  } catch (err) {
    console.warn('记录分享统计失败:', err)
  }
}
