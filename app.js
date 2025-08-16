// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },
  
  globalData: {
    userInfo: null,
    settings: {
      logo: '',
      logoText: '水印相机',
      description: '打卡记录',
      showLocation: true,
      showCoordinates: false,
      language: 'zh',
      flashMode: 'auto',
      timerSeconds: 0
    }
  },
  
  // 获取用户设置
  getSettings() {
    try {
      const settings = wx.getStorageSync('cameraSettings')
      if (settings) {
        this.globalData.settings = { ...this.globalData.settings, ...settings }
      }
    } catch (e) {
      console.error('获取设置失败', e)
    }
    return this.globalData.settings
  },
  
  // 保存用户设置
  saveSettings(settings) {
    try {
      this.globalData.settings = { ...this.globalData.settings, ...settings }
      wx.setStorageSync('cameraSettings', this.globalData.settings)
    } catch (e) {
      console.error('保存设置失败', e)
    }
  }
})