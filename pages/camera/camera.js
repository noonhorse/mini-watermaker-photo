// pages/camera/camera.js
const app = getApp()
const locationUtil = require('../../utils/location.js')
const watermarkUtil = require('../../utils/watermark.js')
const shareUtil = require('../../utils/share.js')

Page({
  data: {
    cameraPosition: 'back', // 摄像头位置：back/front
    flashMode: 'off', // 闪光灯模式：off/on/auto（默认关闭）
    mediaType: 'image', // 媒体类型：image/video（默认图片）
    zoomLevel: 1, // 缩放级别
    minZoom: 1, // 最小缩放
    maxZoom: 3, // 最大缩放
    isCapturing: false, // 是否正在拍照
    isLoading: false, // 是否显示加载
    loadingText: '正在处理...', // 加载文字
    timerCount: 0, // 倒计时
    currentDate: '', // 当前日期
    currentDateTime: '', // 当前时间
    orientation: 'portrait', // 屏幕方向：portrait/landscape
    settings: {}, // 用户设置
    locationInfo: { // 位置信息
      latitude: 39.903732,
      longitude: 116.397772,
      address: '北京市.天安门广场'
    },
    lastPhotoPath: null, // 最后拍摄的照片路径
    showError: false, // 是否显示错误对话框
    errorTitle: '', // 错误标题
    errorMessage: '', // 错误消息
    hasPermissions: false, // 是否有权限
    showPermissionTooltip: false, // 是否显示权限提示tooltip
    showWatermarkPanel: false, // 是否显示水印面板
    currentWatermarkId: 'default', // 当前水印ID
    showAddressSelect: false, // 是否显示地址选择浮层
    showPreview: false, // 是否显示照片预览
    previewImagePath: null // 预览图片路径
  },

  onLoad() {
    // 获取用户设置
    this.setData({
      settings: app.getSettings()
    })
    
    // 更新时间
    this.updateDateTime()
    this.timeInterval = setInterval(() => {
      this.updateDateTime()
    }, 1000)
    
    // 获取位置信息
    this.getLocation()
    
    // 监听屏幕方向变化
    this.listenOrientationChange()
    
    // 检查权限
    this.checkPermissions()
    
    // 检查网络状态
    this.checkNetworkStatus()
    
    // 性能优化
    this.optimizePerformance()
  },

  // 检查权限
  checkPermissions() {
    wx.getSetting({
      success: (res) => {
        const hasCameraPermission = res.authSetting['scope.camera']
        const hasLocationPermission = res.authSetting['scope.userLocation']
        const hasPermissions = hasCameraPermission && hasLocationPermission
        
        this.setData({
          hasPermissions: hasPermissions
        })
        
        if (!hasPermissions) {
          // 显示权限提示tooltip
          this.setData({
            showPermissionTooltip: true
          })
        }
      },
      fail: () => {
        this.setData({
          hasPermissions: false,
          showPermissionTooltip: true
        })
      }
    })
  },

  // 检查网络状态
  checkNetworkStatus() {
    wx.getNetworkType({
      success: (res) => {
        if (res.networkType === 'none') {
          wx.showToast({
            title: '网络连接异常',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
    
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        wx.showToast({
          title: '网络已断开',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  // 性能优化
  optimizePerformance() {
    // 预加载必要资源
    this.preloadResources()
    
    // 设置页面性能监控
    this.setupPerformanceMonitor()
  },

  // 预加载资源
  preloadResources() {
    // 预创建canvas上下文以提高水印生成速度
    // setTimeout(() => {
      const query = wx.createSelectorQuery()
      query.select('#watermarkCanvas').node().exec((res) => {
        if (res[0] && res[0].node) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          // 预热canvas
          ctx.fillStyle = 'transparent'
          ctx.fillRect(0, 0, 1, 1)
        }
      })
    // }, 100)
  },

  // 性能监控
  setupPerformanceMonitor() {
    // 监控内存使用
    const checkMemory = () => {
      wx.getSystemInfo({
        success: (res) => {
          // 如果可用内存过低，提示用户
          if (res.system && res.system.includes('iOS') && res.memorySize && res.memorySize < 100) {
            wx.showToast({
              title: '内存不足，建议清理后台应用',
              icon: 'none',
              duration: 3000
            })
          }
        }
      })
    }
    
    // 每30秒检查一次内存
    this.memoryCheckInterval = setInterval(checkMemory, 30000)
  },

  onUnload() {
    // 清除定时器
    if (this.timeInterval) {
      clearInterval(this.timeInterval)
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval)
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
    }
    
    // 停止设备方向监听
    wx.stopDeviceMotionListening()
  },

  // 更新当前时间
  updateDateTime() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hour = String(now.getHours()).padStart(2, '0')
    const minute = String(now.getMinutes()).padStart(2, '0')
    const second = String(now.getSeconds()).padStart(2, '0')
    
    this.setData({
      currentDate: `${year}-${month}-${day}`,
      currentDateTime: `${hour}:${minute}`
    })
  },

  // 获取位置信息
  getLocation() {
    locationUtil.getCurrentLocation({
      success: (locationData) => {
        this.setData({
          locationInfo: locationData
        })
      },
      fail: (err) => {
        console.error('获取位置失败', err)
        wx.showToast({
          title: '获取位置失败，请检查位置权限',
          icon: 'none',
          duration: 3000
        })
      }
    })
  },

  // 拍照或请求权限
  takePhoto() {
    if (this.data.isCapturing) return
    
    // 如果没有权限，请求权限
    if (!this.data.hasPermissions) {
      this.requestPermissions()
      return
    }
    
    // 触觉反馈
    wx.vibrateShort({
      type: 'medium'
    })
    
    // 如果设置了定时器
    if (this.data.settings.timerSeconds > 0) {
      this.startTimer()
      return
    }
    
    this.capturePhoto()
  },

  // 请求权限
  requestPermissions() {
    // 隐藏tooltip
    this.setData({
      showPermissionTooltip: false
    })
    
    // 请求相机权限
    wx.authorize({
      scope: 'scope.camera',
      success: () => {
        // 请求位置权限
        wx.authorize({
          scope: 'scope.userLocation',
          success: () => {
            this.setData({
              hasPermissions: true
            })
            wx.showToast({
              title: '权限授权成功',
              icon: 'success'
            })
          },
          fail: () => {
            this.openSettingsGuide()
          }
        })
      },
      fail: () => {
        this.openSettingsGuide()
      }
    })
  },

  // 引导用户到设置页面
  openSettingsGuide() {
    wx.showModal({
      title: '权限设置',
      content: '需要相机和位置权限才能使用水印拍照功能，请在设置中开启权限',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              if (settingRes.authSetting['scope.camera'] && settingRes.authSetting['scope.userLocation']) {
                this.setData({
                  hasPermissions: true
                })
                wx.showToast({
                  title: '权限设置成功',
                  icon: 'success'
                })
              }
            }
          })
        }
      }
    })
  },

  // 开始倒计时
  startTimer() {
    let count = this.data.settings.timerSeconds
    this.setData({ timerCount: count })
    
    this.timerInterval = setInterval(() => {
      count--
      this.setData({ timerCount: count })
      
      if (count <= 0) {
        clearInterval(this.timerInterval)
        this.setData({ timerCount: 0 })
        this.capturePhoto()
      }
    }, 1000)
  },

  // 执行拍照
  capturePhoto() {
    this.setData({ 
      isCapturing: true,
      isLoading: true,
      loadingText: '正在拍照...'
    })
    
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.processPhoto(res.tempImagePath)
      },
      fail: (err) => {
        console.error('拍照失败', err)
        this.showErrorDialog('拍照失败', '无法拍摄照片，请检查相机权限或重试')
        this.setData({ 
          isCapturing: false,
          isLoading: false
        })
      }
    })
  },

  // 处理照片（添加水印）
  processPhoto(imagePath) {
    this.setData({ loadingText: '正在添加水印...' })
    
    // 准备水印数据
    const watermarkData = {
      logoText: this.data.settings.logoText || '',
      description: this.data.settings.description || '',
      date: this.data.currentDate,
      datetime: this.data.currentDateTime,
      location: this.data.locationInfo.address,
      coordinates: watermarkUtil.formatCoordinates(
        parseFloat(this.data.locationInfo.latitude),
        parseFloat(this.data.locationInfo.longitude)
      ),
      showLocation: this.data.settings.showLocation,
      showCoordinates: this.data.settings.showCoordinates
    }
    
    // 延迟一下确保canvas已经渲染
    // setTimeout(() => {
      // 生成带水印的图片
      watermarkUtil.generateWatermark({
        imagePath: imagePath,
        watermarkData: watermarkData,
        success: (watermarkedPath) => {
          this.setData({ 
            lastPhotoPath: watermarkedPath,
            previewImagePath: watermarkedPath,
            showPreview: true,
            isLoading: false
          })
        },
        fail: (err) => {
          console.error('添加水印失败', err)
          
          let errorMessage = '水印生成失败，请重试'
          if (err.message && err.message.includes('location')) {
            errorMessage = '无法获取位置信息，请检查定位权限'
          } else if (err.message && err.message.includes('canvas')) {
            errorMessage = 'Canvas渲染失败，请重试'
          }
          
          this.showErrorDialog('添加水印失败', errorMessage)
          // 如果水印添加失败，保存原图
          this.savePhoto(imagePath)
        }
      })
    // }, 100)
  },
  // 保存照片
  savePhoto(imagePath) {
    this.setData({ loadingText: '正在保存...' })
    
    wx.saveImageToPhotosAlbum({
      filePath: imagePath,
      success: () => {
        wx.showToast({
          title: '保存成功',
          icon: 'success'
        })
        this.setData({ 
          isCapturing: false,
          isLoading: false
        })
      },
      fail: (err) => {
        console.error('保存失败', err)
        
        // 检查是否是权限问题
        if (err.errMsg && err.errMsg.includes('auth')) {
          // 请求相册写入权限
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              // 权限获取成功，重新保存
              this.savePhoto(imagePath)
            },
            fail: () => {
              // 权限被拒绝，引导用户手动开启
              wx.showModal({
                title: '需要相册权限',
                content: '保存照片需要访问您的相册，请在设置中开启相册权限',
                confirmText: '去设置',
                cancelText: '取消',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting({
                      success: (settingRes) => {
                        if (settingRes.authSetting['scope.writePhotosAlbum']) {
                          // 用户开启了权限，重新保存
                          this.savePhoto(imagePath)
                        } else {
                          this.setData({ 
                            isCapturing: false,
                            isLoading: false
                          })
                        }
                      }
                    })
                  } else {
                    this.setData({ 
                      isCapturing: false,
                      isLoading: false
                    })
                  }
                }
              })
            }
          })
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'none'
          })
          this.setData({ 
            isCapturing: false,
            isLoading: false
          })
        }
      }
    })
  },

  // 切换摄像头
  switchCamera() {
    // 轻微触觉反馈
    // wx.vibrateShort({
    //   type: 'light'
    // })
    
    const newPosition = this.data.cameraPosition === 'back' ? 'front' : 'back'
    this.setData({
      cameraPosition: newPosition
    })
    // 不提示了，画面有展示
    // wx.showToast({
    //   title: newPosition === 'back' ? '后置摄像头' : '前置摄像头',
    //   icon: 'none',
    //   duration: 1000
    // })
  },

  // 切换图片/视频模式
  toggleVideo() {
    // 轻微触觉反馈
    // wx.vibrateShort({
    //   type: 'light'
    // })
    
    const newMediaType = this.data.mediaType === 'image' ? 'video' : 'image'
    this.setData({
      mediaType: newMediaType
    })
    
    // 调用wx.previewMedia方法
    wx.previewMedia({
      sources: [{
        url: '', // 这里可以根据需要设置预览的媒体URL
        type: newMediaType
      }],
      current: 0,
      success: () => {
        console.log('预览媒体成功')
      },
      fail: (err) => {
        console.error('预览媒体失败', err)
      }
    })
    
    wx.showToast({
      title: newMediaType === 'image' ? '图片模式' : '视频模式',
      icon: 'none',
      duration: 1000
    })
  },
  showAddressPanel() {
    this.setData({ showAddressSelect: true });
  },
  // 显示水印面板
  showWatermarkPanel() {
    // 修改为显示地址选择浮层
    this.setData({ showAddressSelect: true });
  },

  // 隐藏水印面板
  hideWatermarkPanel() {
    this.setData({ showWatermarkPanel: false });
  },

  // 处理水印选择
  onWatermarkSelect(e) {
    const selectedId = e.detail.id;
    this.setData({ currentWatermarkId: selectedId });
    console.log('选中的水印ID:', selectedId);
    this.hideWatermarkPanel();
  },

  // 切换闪光灯
  toggleFlash() {
    // 轻微触觉反馈
    wx.vibrateShort({
      type: 'light'
    })
    
    // 切换顺序：关闭 -> 开启 -> 自动 -> 关闭
    const modes = ['off', 'on', 'auto']
    const currentIndex = modes.indexOf(this.data.flashMode)
    const nextIndex = (currentIndex + 1) % modes.length
    const newFlash = modes[nextIndex]
    
    this.setData({
      flashMode: newFlash
    })
    
    const flashTexts = {
      'off': '闪光灯关闭',
      'on': '闪光灯开启',
      'auto': '闪光灯自动'
    }
    
    wx.showToast({
      title: flashTexts[newFlash],
      icon: 'none',
      duration: 1000
    })
  },

  // 切换定时器
  toggleTimer() {
    const timers = [0, 3, 5, 10]
    const currentIndex = timers.indexOf(this.data.settings.timerSeconds)
    const nextIndex = (currentIndex + 1) % timers.length
    
    const newSettings = {
      ...this.data.settings,
      timerSeconds: timers[nextIndex]
    }
    
    this.setData({ settings: newSettings })
    app.saveSettings(newSettings)
  },

  // 放大
  zoomIn() {
    if (this.data.zoomLevel < 3) {
      this.setData({
        zoomLevel: Math.round((this.data.zoomLevel + 0.5) * 10) / 10
      })
    }
  },

  // 缩小
  zoomOut() {
    if (this.data.zoomLevel > 1) {
      this.setData({
        zoomLevel: Math.round((this.data.zoomLevel - 0.5) * 10) / 10
      })
    }
  },

  // 前往设置页面
  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },

  // 相机错误处理
  onCameraError(e) {
    console.error('相机错误', e)
    this.setData({
      showError: true
    })
    // wx.showToast({
    //   title: '相机启动失败',
    //   icon: 'none'
    // })
  },

  // 相机停止
  onCameraStop() {
    console.log('相机已停止')
  },

  // 相机就绪
  onCameraReady() {
    console.log('相机已就绪')
  },

  // 缩放控制
  onZoomChange(e) {
    const zoom = e.detail.value
    this.setData({
      zoomLevel: zoom
    })
  },

  // 手势缩放
  onTouchStart(e) {
    if (e.touches.length === 2) {
      this.data.initialDistance = this.getDistance(e.touches[0], e.touches[1])
      this.data.initialZoom = this.data.zoomLevel
    }
  },

  onTouchMove(e) {
    if (e.touches.length === 2 && this.data.initialDistance) {
      const currentDistance = this.getDistance(e.touches[0], e.touches[1])
      const scale = currentDistance / this.data.initialDistance
      let newZoom = this.data.initialZoom * scale
      
      // 限制缩放范围
      newZoom = Math.max(this.data.minZoom, Math.min(this.data.maxZoom, newZoom))
      
      this.setData({
        zoomLevel: newZoom
      })
    }
  },

  onTouchEnd(e) {
    this.data.initialDistance = null
    this.data.initialZoom = null
  },

  // 计算两点间距离
  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX
    const dy = touch1.clientY - touch2.clientY
    return Math.sqrt(dx * dx + dy * dy)
  },

  // 监听屏幕方向变化
   listenOrientationChange() {
     wx.onDeviceMotionChange((res) => {
       // 根据重力感应判断屏幕方向
       const { x, y } = res
       let orientation = 'portrait'
       
       if (Math.abs(x) > Math.abs(y)) {
         orientation = x > 0 ? 'landscape-left' : 'landscape-right'
       // 不需要倒置摄像头内容
      //  } else {
      //    orientation = y > 0 ? 'portrait' : 'portrait-upside-down'
       }
       
       if (this.data.orientation !== orientation) {
         this.setData({ orientation })
       }
     })
     
     // 开始监听设备方向
     wx.startDeviceMotionListening({
       interval: 'normal'
     })
   },

   // 缩放放大
   zoomIn() {
     let newZoom = this.data.zoomLevel + 0.2
     newZoom = Math.min(this.data.maxZoom, newZoom)
     this.setData({
       zoomLevel: newZoom
     })
   },

   // 缩放缩小
   zoomOut() {
     let newZoom = this.data.zoomLevel - 0.2
     newZoom = Math.max(this.data.minZoom, newZoom)
     this.setData({
       zoomLevel: newZoom
     })
   },

   // 显示错误对话框
   showErrorDialog(title, message) {
     this.setData({
       showError: true,
       errorTitle: title,
       errorMessage: message
     })
   },

   // 隐藏错误对话框
   hideErrorDialog() {
     this.setData({
       showError: false,
       errorTitle: '',
       errorMessage: ''
     })
   },

   // 显示成功提示
   showSuccessToast(message) {
     wx.showToast({
       title: message,
       icon: 'success',
       duration: 2000
     })
   },

   // 重试操作
    retryOperation() {
      this.hideErrorDialog()
      // 根据错误类型执行不同的重试操作
      if (this.data.errorTitle.includes('权限')) {
        this.checkPermissions()
      } else if (this.data.errorTitle.includes('拍照')) {
        this.takePhoto()
      } else {
        this.getLocation()
      }
    },

    // 隐藏权限提示tooltip
    hidePermissionTooltip() {
      this.setData({
        showPermissionTooltip: false
      })
    },

    // 页面点击事件，用于隐藏tooltip
    onPageTap() {
      if (this.data.showPermissionTooltip) {
        this.hidePermissionTooltip()
      }
    },

    // 地址选择浮层关闭事件
    onAddressSelectClose() {
      this.setData({ showAddressSelect: false });
    },

    // 地址选择确认事件
    onAddressSelectConfirm(e) {
      const selectedAddress = e.detail.address;
      this.setData({
        'locationInfo.address': selectedAddress,
        showAddressSelect: false
      });
      
      wx.showToast({
        title: '地址已更新',
        icon: 'success',
        duration: 2000
      });
    },

    // 取消预览，重新拍摄
    onPreviewCancel() {
      this.setData({
        showPreview: false,
        previewImagePath: null,
        isCapturing: false
      })
    },

    // 确认保存照片
  onPreviewConfirm() {
    if (this.data.previewImagePath) {
      this.setData({
        showPreview: false
      })
      this.savePhoto(this.data.previewImagePath)
    }
  },

  // 分享图片到微信聊天框
  shareFileToMessage() {
    if (!this.data.previewImagePath) {
      wx.showToast({
        title: '没有可分享的图片',
        icon: 'none'
      })
      return
    }

    wx.shareFileMessage({
      filePath: this.data.previewImagePath,
      fileName: `水印相机_${new Date().getTime()}.jpg`,
      success: () => {
        wx.showToast({
          title: '分享成功',
          icon: 'success'
        })
      },
      fail: (err) => {
        console.error('分享失败', err)
        wx.showToast({
          title: '分享失败',
          icon: 'none'
        })
      }
    })
  }
})