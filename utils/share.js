// utils/share.js
// 分享功能工具类

/**
 * 分享图片到不同平台
 * @param {Object} options 分享选项
 * @param {string} options.filePath 图片文件路径
 * @param {string} options.type 分享类型：album/friend/moments
 * @param {Function} options.success 成功回调
 * @param {Function} options.fail 失败回调
 */
function shareImage(options) {
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
 * @param {string} filePath 图片路径
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function saveToAlbum(filePath, success, fail) {
  wx.saveImageToPhotosAlbum({
    filePath: filePath,
    success: () => {
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      success()
    },
    fail: (err) => {
      if (err.errMsg.includes('auth')) {
        wx.showModal({
          title: '提示',
          content: '需要授权访问相册才能保存图片',
          confirmText: '去授权',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting({
                success: (settingRes) => {
                  if (settingRes.authSetting['scope.writePhotosAlbum']) {
                    // 重新尝试保存
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
}

/**
 * 分享给朋友
 * @param {string} filePath 图片路径
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function shareToFriend(filePath, success, fail) {
  const fileName = `水印照片_${formatDateTime(new Date())}.jpg`
  
  wx.shareFileMessage({
    filePath: filePath,
    fileName: fileName,
    success: () => {
      wx.showToast({
        title: '分享成功',
        icon: 'success'
      })
      success()
    },
    fail: (err) => {
      wx.showToast({
        title: '分享失败',
        icon: 'none'
      })
      fail(err)
    }
  })
}

/**
 * 分享到朋友圈（引导用户手动分享）
 * @param {string} filePath 图片路径
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function shareToMoments(filePath, success, fail) {
  wx.showModal({
    title: '分享到朋友圈',
    content: '将先保存图片到相册，然后您可以在微信朋友圈中选择该图片进行分享',
    confirmText: '保存图片',
    success: (res) => {
      if (res.confirm) {
        saveToAlbum(filePath, success, fail)
      }
    }
  })
}

/**
 * 显示分享选项菜单
 * @param {string} filePath 图片路径
 * @param {Function} callback 选择回调
 */
function showShareMenu(filePath, callback = () => {}) {
  if (!filePath) {
    wx.showToast({
      title: '请先拍照',
      icon: 'none'
    })
    return
  }

  wx.showActionSheet({
    itemList: ['保存到相册', '发送给朋友', '分享到朋友圈'],
    success: (res) => {
      const types = ['album', 'friend', 'moments']
      const selectedType = types[res.tapIndex]
      
      shareImage({
        filePath: filePath,
        type: selectedType,
        success: () => {
          callback({ success: true, type: selectedType })
        },
        fail: (err) => {
          callback({ success: false, type: selectedType, error: err })
        }
      })
    },
    fail: () => {
      callback({ success: false, cancelled: true })
    }
  })
}

/**
 * 格式化日期时间
 * @param {Date} date 日期对象
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDateTime(date) {
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
 * @param {string} type 分享类型
 * @param {Object} photoInfo 照片信息
 */
function recordShareStats(type, photoInfo) {
  try {
    const stats = wx.getStorageSync('shareStats') || {}
    const today = new Date().toDateString()
    
    if (!stats[today]) {
      stats[today] = { album: 0, friend: 0, moments: 0, total: 0 }
    }
    
    stats[today][type] = (stats[today][type] || 0) + 1
    stats[today].total = (stats[today].total || 0) + 1
    
    wx.setStorageSync('shareStats', stats)
    console.log('分享统计已记录:', type, stats[today])
  } catch (err) {
    console.warn('记录分享统计失败:', err)
  }
}

module.exports = {
  shareImage,
  saveToAlbum,
  shareToFriend,
  shareToMoments,
  showShareMenu,
  recordShareStats
}