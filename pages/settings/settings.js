// pages/settings/settings.js
const app = getApp()

Page({
  data: {
    settings: {}, // 当前设置
    
    // 闪光灯模式选项
    flashModes: [
      { name: '自动', value: 'auto' },
      { name: '开启', value: 'on' },
      { name: '关闭', value: 'off' }
    ],
    flashModeIndex: 0,
    
    // 定时器选项
    timerOptions: [
      { name: '关闭', value: 0 },
      { name: '3秒', value: 3 },
      { name: '5秒', value: 5 },
      { name: '10秒', value: 10 }
    ],
    timerIndex: 0,
    
    // 语言选项
    languages: [
      { name: '中文', value: 'zh' },
      { name: 'English', value: 'en' }
    ],
    languageIndex: 0
  },

  onLoad() {
    // 获取当前设置
    const settings = app.getSettings()
    this.setData({ settings })
    
    // 设置选择器的默认值
    this.initPickerValues()
  },

  // 初始化选择器的值
  initPickerValues() {
    const { settings } = this.data
    
    // 闪光灯模式
    const flashModeIndex = this.data.flashModes.findIndex(item => item.value === settings.flashMode)
    this.setData({ flashModeIndex: flashModeIndex >= 0 ? flashModeIndex : 0 })
    
    // 定时器
    const timerIndex = this.data.timerOptions.findIndex(item => item.value === settings.timerSeconds)
    this.setData({ timerIndex: timerIndex >= 0 ? timerIndex : 0 })
    
    // 语言
    const languageIndex = this.data.languages.findIndex(item => item.value === settings.language)
    this.setData({ languageIndex: languageIndex >= 0 ? languageIndex : 0 })
  },

  // 选择Logo
  selectLogo() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        this.setData({
          'settings.logo': tempFilePath
        })
      },
      fail: (err) => {
        console.error('选择图片失败', err)
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
      }
    })
  },

  // Logo文字变化
  onLogoTextChange(e) {
    this.setData({
      'settings.logoText': e.detail.value
    })
  },

  // 描述文字变化
  onDescriptionChange(e) {
    this.setData({
      'settings.description': e.detail.value
    })
  },

  // 显示地址开关
  onShowLocationChange(e) {
    this.setData({
      'settings.showLocation': e.detail.value
    })
  },

  // 显示坐标开关
  onShowCoordinatesChange(e) {
    this.setData({
      'settings.showCoordinates': e.detail.value
    })
  },

  // 闪光灯模式变化
  onFlashModeChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      flashModeIndex: index,
      'settings.flashMode': this.data.flashModes[index].value
    })
  },

  // 定时器变化
  onTimerChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      timerIndex: index,
      'settings.timerSeconds': this.data.timerOptions[index].value
    })
  },

  // 语言变化
  onLanguageChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      languageIndex: index,
      'settings.language': this.data.languages[index].value
    })
    
    // 这里可以添加语言切换逻辑
    this.updateLanguage(this.data.languages[index].value)
  },

  // 更新语言
  updateLanguage(language) {
    // 实际项目中这里应该实现国际化逻辑
    console.log('切换语言到:', language)
    wx.showToast({
      title: language === 'zh' ? '已切换到中文' : 'Switched to English',
      icon: 'success'
    })
  },

  // 显示通知设置
  showNotificationSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示个性化设置
  showPersonalizationSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示隐私设置
  showPrivacySettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示个人信息收集清单
  showPersonalInfoList() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示第三方信息共享清单
  showThirdPartyInfoList() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 显示个人信息保护设置
  showPersonalProtectionSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 清除缓存
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除本地存储
            wx.clearStorageSync()
            
            wx.showToast({
              title: '缓存已清除',
              icon: 'success'
            })
          } catch (error) {
            wx.showToast({
              title: '清除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          // 这里可以添加实际的退出登录逻辑
        }
      }
    })
  },

  // 恢复默认设置
  resetSettings() {
    wx.showModal({
      title: '确认重置',
      content: '确定要恢复默认设置吗？',
      success: (res) => {
        if (res.confirm) {
          const defaultSettings = {
            logo: '',
            logoText: '水印相机',
            description: '打卡记录',
            showLocation: true,
            showCoordinates: false,
            language: 'zh',
            flashMode: 'auto',
            timerSeconds: 0
          }
          
          this.setData({ settings: defaultSettings })
          this.initPickerValues()
          
          wx.showToast({
            title: '已恢复默认设置',
            icon: 'success'
          })
        }
      }
    })
  },

  // 显示关于信息
  showAbout() {
    wx.showModal({
      title: '关于水印相机',
      content: '水印打卡相机 v1.0.0\n\n一款功能强大的水印相机应用，支持GPS定位、时间水印、自定义Logo等功能。\n\n© 2024 水印相机团队',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 保存设置
  saveSettings() {
    try {
      app.saveSettings(this.data.settings)
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        this.goBack()
      }, 1500)
    } catch (e) {
      console.error('保存设置失败', e)
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      })
    }
  },

  // 返回相机页面
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 页面卸载时自动保存
  onUnload() {
    app.saveSettings(this.data.settings)
  },

  // 页面隐藏时自动保存
  onHide() {
    app.saveSettings(this.data.settings)
  }
})