<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { getCurrentLocation } from '@/utils/location'
import { generateWatermark, formatCoordinates } from '@/utils/watermark'
import { getSettings, saveSettings } from '@/utils/settings'
import type { UserSettings, LocationInfo, FlashMode, CameraPosition, Orientation, WatermarkId } from '@/types/index'

const cameraPosition = ref<CameraPosition>('back')
const flashMode = ref<FlashMode>('off')
const mediaType = ref('image')
const zoomLevel = ref(1)
const minZoom = ref(1)
const maxZoom = ref(3)
const isCapturing = ref(false)
const isLoading = ref(false)
const loadingText = ref('正在处理...')
const timerCount = ref(0)
const currentDate = ref('')
const currentDateTime = ref('')
const orientation = ref<Orientation>('portrait')
const settings = ref<UserSettings>({} as UserSettings)
const locationInfo = ref<LocationInfo>({
  latitude: 39.903732,
  longitude: 116.397772,
  address: '北京市.天安门广场'
})
const lastPhotoPath = ref<string | null>(null)
const showError = ref(false)
const errorTitle = ref('')
const errorMessage = ref('')
const hasPermissions = ref(false)
const showPermissionTooltip = ref(false)
const showWatermarkPanel = ref(false)
const currentWatermarkId = ref<WatermarkId>('default')
const showAddressSelect = ref(false)
const showPreview = ref(false)
const previewImagePath = ref<string | null>(null)
const timeInterval = ref<ReturnType<typeof setInterval> | null>(null)
const timerInterval = ref<ReturnType<typeof setInterval> | null>(null)
const memoryCheckInterval = ref<ReturnType<typeof setInterval> | null>(null)
const initialDistance = ref<number | null>(null)
const initialZoom = ref<number | null>(null)

onLoad(() => {
  // 获取用户设置
  settings.value = getSettings()

  // 更新时间
  updateDateTime()
  timeInterval.value = setInterval(() => {
    updateDateTime()
  }, 1000)

  // 获取位置信息
  getLocation()

  // 监听屏幕方向变化
  listenOrientationChange()

  // 检查权限
  checkPermissions()

  // 检查网络状态
  checkNetworkStatus()

  // 性能优化
  optimizePerformance()
})

onUnload(() => {
  if (timeInterval.value) clearInterval(timeInterval.value)
  if (timerInterval.value) clearInterval(timerInterval.value)
  if (memoryCheckInterval.value) clearInterval(memoryCheckInterval.value)

  // #ifdef MP-WEIXIN
  wx.stopDeviceMotionListening()
  // #endif
  // #ifdef APP-PLUS
  // @ts-ignore
  plus.device.stopDeviceMotionListening && plus.device.stopDeviceMotionListening()
  // #endif
})

function checkPermissions(): void {
  // #ifdef MP-WEIXIN
  wx.getSetting({
    success: (res: any) => {
      const hasCameraPermission = res.authSetting['scope.camera']
      const hasLocationPermission = res.authSetting['scope.userLocation']
      hasPermissions.value = hasCameraPermission && hasLocationPermission
      if (!hasPermissions.value) {
        showPermissionTooltip.value = true
      }
    },
    fail: () => {
      hasPermissions.value = false
      showPermissionTooltip.value = true
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  hasPermissions.value = true
  // #endif
}

function checkNetworkStatus(): void {
  uni.getNetworkType({
    success: (res: any) => {
      if (res.networkType === 'none') {
        uni.showToast({ title: '网络连接异常', icon: 'none', duration: 2000 })
      }
    }
  })

  uni.onNetworkStatusChange((res: any) => {
    if (!res.isConnected) {
      uni.showToast({ title: '网络已断开', icon: 'none', duration: 2000 })
    }
  })
}

function optimizePerformance(): void {
  preloadResources()
  setupPerformanceMonitor()
}

function preloadResources(): void {
  // #ifdef MP-WEIXIN
  const query = wx.createSelectorQuery()
  query.select('#watermarkCanvas').node().exec((res: any[]) => {
    if (res[0] && res[0].node) {
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = 'transparent'
      ctx.fillRect(0, 0, 1, 1)
    }
  })
  // #endif
}

function setupPerformanceMonitor(): void {
  const checkMemory = () => {
    uni.getSystemInfo({
      success: (res: any) => {
        if (res.system && res.system.includes('iOS') && res.memorySize && res.memorySize < 100) {
          uni.showToast({ title: '内存不足，建议清理后台应用', icon: 'none', duration: 3000 })
        }
      }
    })
  }
  memoryCheckInterval.value = setInterval(checkMemory, 30000)
}

function updateDateTime(): void {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')

  currentDate.value = `${year}-${month}-${day}`
  currentDateTime.value = `${hour}:${minute}`
}

function getLocation(): void {
  getCurrentLocation({
    success: (data: LocationInfo) => {
      locationInfo.value = data
    },
    fail: (err: any) => {
      console.error('获取位置失败', err)
      uni.showToast({ title: '获取位置失败，请检查位置权限', icon: 'none', duration: 3000 })
    }
  })
}

function takePhoto(): void {
  if (isCapturing.value) return

  if (!hasPermissions.value) {
    requestPermissions()
    return
  }

  uni.vibrateShort({ type: 'medium' })

  if (settings.value.timerSeconds > 0) {
    startTimer()
    return
  }

  capturePhoto()
}

function requestPermissions(): void {
  showPermissionTooltip.value = false

  // #ifdef MP-WEIXIN
  wx.authorize({
    scope: 'scope.camera',
    success: () => {
      wx.authorize({
        scope: 'scope.userLocation',
        success: () => {
          hasPermissions.value = true
          uni.showToast({ title: '权限授权成功', icon: 'success' })
        },
        fail: () => openSettingsGuide()
      })
    },
    fail: () => openSettingsGuide()
  })
  // #endif

  // #ifndef MP-WEIXIN
  hasPermissions.value = true
  // #endif
}

function openSettingsGuide(): void {
  // #ifdef MP-WEIXIN
  wx.showModal({
    title: '权限设置',
    content: '需要相机和位置权限才能使用水印拍照功能，请在设置中开启权限',
    confirmText: '去设置',
    cancelText: '取消',
    success: (res: any) => {
      if (res.confirm) {
        wx.openSetting({
          success: (settingRes: any) => {
            if (settingRes.authSetting['scope.camera'] && settingRes.authSetting['scope.userLocation']) {
              hasPermissions.value = true
              uni.showToast({ title: '权限设置成功', icon: 'success' })
            }
          }
        })
      }
    }
  })
  // #endif

  // #ifndef MP-WEIXIN
  hasPermissions.value = true
  // #endif
}

function startTimer(): void {
  let count = settings.value.timerSeconds
  timerCount.value = count

  timerInterval.value = setInterval(() => {
    count--
    timerCount.value = count

    if (count <= 0) {
      clearInterval(timerInterval.value!)
      timerCount.value = 0
      capturePhoto()
    }
  }, 1000)
}

function capturePhoto(): void {
  isCapturing.value = true
  isLoading.value = true
  loadingText.value = '正在拍照...'

  // #ifdef MP-WEIXIN || MP-QQ
  const ctx = wx.createCameraContext()
  ctx.takePhoto({
    quality: 'high',
    success: (res: any) => {
      processPhoto(res.tempImagePath)
    },
    fail: (err: any) => {
      console.error('拍照失败', err)
      showErrorDialog('拍照失败', '无法拍摄照片，请检查相机权限或重试')
      isCapturing.value = false
      isLoading.value = false
    }
  })
  // #endif

  // #ifdef APP-PLUS
  const camera = uni.createCameraContext()
  camera.takePhoto({
    quality: 'high',
    success: (res: any) => {
      processPhoto(res.tempImagePath)
    },
    fail: (err: any) => {
      console.error('拍照失败', err)
      showErrorDialog('拍照失败', '无法拍摄照片，请检查相机权限或重试')
      isCapturing.value = false
      isLoading.value = false
    }
  })
  // #endif

  // #ifdef MP-DINGTALK
  dd.biz.util.scan({
    type: 'qrcode',
    onSuccess: (_data: any) => {},
    onFail: (_err: any) => {}
  })
  // #endif

  // #ifndef MP-WEIXIN || MP-QQ || APP-PLUS
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],
    success: (res: any) => {
      processPhoto(res.tempFilePaths[0])
    },
    fail: (err: any) => {
      console.error('拍照失败', err)
      isCapturing.value = false
      isLoading.value = false
    }
  })
  // #endif
}

function processPhoto(imagePath: string): void {
  loadingText.value = '正在添加水印...'

  const watermarkData = {
    logoText: settings.value.logoText || '',
    description: settings.value.description || '',
    date: currentDate.value,
    datetime: currentDateTime.value,
    location: locationInfo.value.address,
    coordinates: formatCoordinates(
      parseFloat(String(locationInfo.value.latitude)),
      parseFloat(String(locationInfo.value.longitude))
    ),
    showLocation: settings.value.showLocation,
    showCoordinates: settings.value.showCoordinates
  }

  generateWatermark({
    imagePath: imagePath,
    watermarkData: watermarkData,
    success: (watermarkedPath: string) => {
      lastPhotoPath.value = watermarkedPath
      previewImagePath.value = watermarkedPath
      showPreview.value = true
      isLoading.value = false
    },
    fail: (err: any) => {
      console.error('添加水印失败', err)

      let errMsg = '水印生成失败，请重试'
      if (err.message && err.message.includes('location')) {
        errMsg = '无法获取位置信息，请检查定位权限'
      } else if (err.message && err.message.includes('canvas')) {
        errMsg = 'Canvas渲染失败，请重试'
      }

      showErrorDialog('添加水印失败', errMsg)
      savePhoto(imagePath)
    }
  })
}

function savePhoto(imagePath: string): void {
  loadingText.value = '正在保存...'

  uni.saveImageToPhotosAlbum({
    filePath: imagePath,
    success: () => {
      uni.showToast({ title: '保存成功', icon: 'success' })
      isCapturing.value = false
      isLoading.value = false
    },
    fail: (err: any) => {
      console.error('保存失败', err)

      // #ifdef MP-WEIXIN
      if (err.errMsg && err.errMsg.includes('auth')) {
        wx.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            savePhoto(imagePath)
          },
          fail: () => {
            wx.showModal({
              title: '需要相册权限',
              content: '保存照片需要访问您的相册，请在设置中开启相册权限',
              confirmText: '去设置',
              cancelText: '取消',
              success: (res: any) => {
                if (res.confirm) {
                  wx.openSetting({
                    success: (settingRes: any) => {
                      if (settingRes.authSetting['scope.writePhotosAlbum']) {
                        savePhoto(imagePath)
                      } else {
                        isCapturing.value = false
                        isLoading.value = false
                      }
                    }
                  })
                } else {
                  isCapturing.value = false
                  isLoading.value = false
                }
              }
            })
          }
        })
      } else {
        uni.showToast({ title: '保存失败', icon: 'none' })
        isCapturing.value = false
        isLoading.value = false
      }
      // #endif

      // #ifndef MP-WEIXIN
      uni.showToast({ title: '保存失败', icon: 'none' })
      isCapturing.value = false
      isLoading.value = false
      // #endif
    }
  })
}

function switchCamera(): void {
  cameraPosition.value = cameraPosition.value === 'back' ? 'front' : 'back'
}

function toggleVideo(): void {
  const newMediaType = mediaType.value === 'image' ? 'video' : 'image'
  mediaType.value = newMediaType

  // #ifdef MP-WEIXIN
  wx.previewMedia({
    sources: [{
      url: '',
      type: newMediaType
    }],
    current: 0,
    success: () => {
      console.log('预览媒体成功')
    },
    fail: (err: any) => {
      console.error('预览媒体失败', err)
    }
  })
  // #endif

  uni.showToast({
    title: newMediaType === 'image' ? '图片模式' : '视频模式',
    icon: 'none',
    duration: 1000
  })
}

function showAddressPanel(): void {
  showAddressSelect.value = true
}

function showWatermarkPanelFn(): void {
  showAddressSelect.value = true
}

function hideWatermarkPanel(): void {
  showWatermarkPanel.value = false
}

function onWatermarkSelect(e: { id: string }): void {
  currentWatermarkId.value = e.id as WatermarkId
  hideWatermarkPanel()
}

function toggleFlash(): void {
  uni.vibrateShort({ type: 'light' })

  const modes: FlashMode[] = ['off', 'on', 'auto']
  const currentIndex = modes.indexOf(flashMode.value)
  const nextIndex = (currentIndex + 1) % modes.length
  const newFlash = modes[nextIndex]

  flashMode.value = newFlash

  const flashTexts: Record<FlashMode, string> = {
    'off': '闪光灯关闭',
    'on': '闪光灯开启',
    'auto': '闪光灯自动'
  }

  uni.showToast({ title: flashTexts[newFlash], icon: 'none', duration: 1000 })
}

function toggleTimer(): void {
  const timers = [0, 3, 5, 10]
  const currentIndex = timers.indexOf(settings.value.timerSeconds)
  const nextIndex = (currentIndex + 1) % timers.length

  const newSettings = {
    ...settings.value,
    timerSeconds: timers[nextIndex]
  }

  settings.value = newSettings
  saveSettings(newSettings)
}

function zoomIn(): void {
  let newZoom = zoomLevel.value + 0.2
  newZoom = Math.min(maxZoom.value, newZoom)
  zoomLevel.value = newZoom
}

function zoomOut(): void {
  let newZoom = zoomLevel.value - 0.2
  newZoom = Math.max(minZoom.value, newZoom)
  zoomLevel.value = newZoom
}

function goToSettings(): void {
  uni.navigateTo({ url: '/pages/settings/settings' })
}

function onCameraError(_e: any): void {
  console.error('相机错误', _e)
  showError.value = true
}

function onCameraStop(): void {
  console.log('相机已停止')
}

function onCameraReady(): void {
  console.log('相机已就绪')
}

function onZoomChange(e: any): void {
  zoomLevel.value = e.detail.value
}

function onTouchStart(e: any): void {
  if (e.touches.length === 2) {
    initialDistance.value = getDistance(e.touches[0], e.touches[1])
    initialZoom.value = zoomLevel.value
  }
}

function onTouchMove(e: any): void {
  if (e.touches.length === 2 && initialDistance.value) {
    const currentDistance = getDistance(e.touches[0], e.touches[1])
    const scale = currentDistance / initialDistance.value
    let newZoom = initialZoom.value! * scale

    newZoom = Math.max(minZoom.value, Math.min(maxZoom.value, newZoom))
    zoomLevel.value = newZoom
  }
}

function onTouchEnd(): void {
  initialDistance.value = null
  initialZoom.value = null
}

function getDistance(touch1: any, touch2: any): number {
  const dx = touch1.clientX - touch2.clientX
  const dy = touch1.clientY - touch2.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function listenOrientationChange(): void {
  // #ifdef MP-WEIXIN
  wx.onDeviceMotionChange((res: any) => {
    const { x, y } = res
    let newOrientation: Orientation = 'portrait'

    if (Math.abs(x) > Math.abs(y)) {
      newOrientation = x > 0 ? 'landscape-left' : 'landscape-right'
    }

    if (orientation.value !== newOrientation) {
      orientation.value = newOrientation
    }
  })

  wx.startDeviceMotionListening({ interval: 'normal' })
  // #endif

  // #ifdef APP-PLUS
  // App端使用plus API监听
  // #endif
}

function showErrorDialog(title: string, message: string): void {
  showError.value = true
  errorTitle.value = title
  errorMessage.value = message
}

function hideErrorDialog(): void {
  showError.value = false
  errorTitle.value = ''
  errorMessage.value = ''
}

function showSuccessToast(message: string): void {
  uni.showToast({ title: message, icon: 'success', duration: 2000 })
}

function retryOperation(): void {
  hideErrorDialog()
  if (errorTitle.value.includes('权限')) {
    checkPermissions()
  } else if (errorTitle.value.includes('拍照')) {
    takePhoto()
  } else {
    getLocation()
  }
}

function hidePermissionTooltip(): void {
  showPermissionTooltip.value = false
}

function onPageTap(): void {
  if (showPermissionTooltip.value) {
    hidePermissionTooltip()
  }
}

function onAddressSelectClose(): void {
  showAddressSelect.value = false
}

function onAddressSelectConfirm(e: { address: string }): void {
  const selectedAddress = e.address
  locationInfo.value.address = selectedAddress
  showAddressSelect.value = false

  uni.showToast({ title: '地址已更新', icon: 'success', duration: 2000 })
}

function onPreviewCancel(): void {
  showPreview.value = false
  previewImagePath.value = null
  isCapturing.value = false
}

function onPreviewConfirm(): void {
  if (previewImagePath.value) {
    showPreview.value = false
    savePhoto(previewImagePath.value)
  }
}

function shareFileToMessage(): void {
  if (!previewImagePath.value) {
    uni.showToast({ title: '没有可分享的图片', icon: 'none' })
    return
  }

  // #ifdef MP-WEIXIN
  wx.shareFileMessage({
    filePath: previewImagePath.value,
    fileName: `水印相机_${new Date().getTime()}.jpg`,
    success: () => {
      uni.showToast({ title: '分享成功', icon: 'success' })
    },
    fail: (err: any) => {
      console.error('分享失败', err)
      uni.showToast({ title: '分享失败', icon: 'none' })
    }
  })
  // #endif

  // #ifdef APP-PLUS
  uni.share({
    provider: 'weixin',
    type: 2,
    filePath: previewImagePath.value,
    success: () => {
      uni.showToast({ title: '分享成功', icon: 'success' })
    },
    fail: (err: any) => {
      console.error('分享失败', err)
      uni.showToast({ title: '分享失败', icon: 'none' })
    }
  })
  // #endif

  // #ifndef MP-WEIXIN || APP-PLUS
  uni.showToast({ title: '当前平台不支持此分享方式', icon: 'none' })
  // #endif
}
</script>

<template>
  <view class="camera-container" @click="onPageTap">
    <!-- 左上角功能区域 -->
    <view class="function-area">
      <view class="watermark-top-left">
        <!-- 闪光灯按钮 -->
        <view class="flash-btn" @click="toggleFlash">
          <image v-if="flashMode === 'on'" class="flash-icon" src="/static/flashlight.png" mode="aspectFit"></image>
          <image v-else-if="flashMode === 'off'" class="flash-icon" src="/static/flashlight-turned-off.png" mode="aspectFit"></image>
          <image v-else class="flash-icon" src="/static/flashlight-auto.png" mode="aspectFit"></image>
          <text class="flash-text">灯光</text>
        </view>
      </view>
    </view>

    <!-- 照片预览界面 -->
    <view v-if="showPreview" class="background-blur preview-picture">
      <image class="background-image" :src="previewImagePath || ''" mode="aspectFit"></image>
    </view>

    <!-- 毛玻璃背景图（权限未授权或摄像头错误时显示） -->
    <view v-if="!hasPermissions || showError" class="background-blur">
      <image class="background-image" src="/static/bg.jpg" mode="aspectFill"></image>
      <view class="blur-overlay"></view>
    </view>

    <!-- 相机预览区域 -->
    <!-- #ifdef MP-WEIXIN || MP-QQ -->
    <camera
      v-if="hasPermissions && !showPreview"
      class="camera-preview"
      :class="orientation"
      :device-position="cameraPosition"
      :flash="flashMode"
      :zoom="zoomLevel"
      @error="onCameraError"
      @stop="onCameraStop"
      @ready="onCameraReady"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- 水印显示组件 -->
      <watermark-display
        :watermark-id="currentWatermarkId"
        :location-info="locationInfo"
        :visible="true"
        @click.native="showAddressPanel"
      ></watermark-display>

      <!-- 倒计时显示 -->
      <cover-view v-if="timerCount > 0" class="timer-overlay">
        <cover-view class="timer-count">{{ timerCount }}</cover-view>
      </cover-view>
    </camera>
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN || MP-QQ -->
    <view
      v-if="hasPermissions && !showPreview"
      class="camera-preview"
      :class="orientation"
    >
      <image
        class="camera-placeholder-img"
        src="/static/bg.jpg"
        mode="aspectFill"
        style="width:100%;height:100%"
      ></image>
      <!-- 水印显示组件 -->
      <watermark-display
        :watermark-id="currentWatermarkId"
        :location-info="locationInfo"
        :visible="true"
        @click.native="showAddressPanel"
      ></watermark-display>
    </view>
    <!-- #endif -->

    <!-- 底部控制栏 (非预览模式) -->
    <view v-if="!showPreview" class="bottom-controls-new">
      <!-- 水印设置按钮 -->
      <view class="control-btn-new" @click="showAddressPanel">
        <image class="btn-icon-new" src="/static/shuiyin.png" mode="aspectFit"></image>
        <view class="btn-text-new">水印设置</view>
      </view>

      <!-- 拍照按钮 -->
      <view class="shutter-btn-new" :class="{ capturing: isCapturing }" @click="takePhoto">
        <view v-if="hasPermissions" class="shutter-inner-new"></view>
        <view v-else class="permission-text-new">点击授权</view>
      </view>

      <!-- 切换摄像头按钮 -->
      <view class="control-btn-new" @click="switchCamera">
        <image class="btn-icon-new" src="/static/switch_camera.png" mode="aspectFit"></image>
        <view class="btn-text-new">切换</view>
      </view>
    </view>

    <!-- 预览操作按钮 -->
    <view v-if="showPreview" class="bottom-controls-new">
      <view class="control-btn-new" @click="onPreviewCancel">
        <image class="btn-icon-new" src="/static/back.png" mode="aspectFit"></image>
        <view class="btn-text-new">重新拍摄</view>
      </view>
      <view class="control-btn-new" @click="shareFileToMessage">
        <image class="btn-icon-new" src="/static/i-share.png" mode="aspectFit"></image>
        <view class="btn-text-new">分享到微信</view>
      </view>
      <view class="control-btn-new" @click="onPreviewConfirm">
        <image class="btn-icon-new" src="/static/download.png" mode="aspectFit"></image>
        <view class="btn-text-new">保存图片</view>
      </view>
    </view>

    <!-- 权限提示tooltip -->
    <view v-if="showPermissionTooltip" class="permission-tooltip">
      <view class="tooltip-content">
        <view class="tooltip-text">点击授权摄像头和位置权限</view>
        <view class="tooltip-buttons">
          <button class="tooltip-btn" @click="requestPermissions">去授权</button>
          <button class="tooltip-btn secondary" @click="hidePermissionTooltip">取消</button>
        </view>
      </view>
      <view class="tooltip-arrow"></view>
    </view>

    <!-- 功能按钮区域 -->
    <view class="function-controls"></view>

    <!-- 加载提示 -->
    <view v-if="isLoading" class="loading-overlay">
      <view class="loading-content">
        <view class="loading-spinner"></view>
        <view class="loading-text">{{ loadingText }}</view>
      </view>
    </view>

    <!-- 隐藏的canvas用于水印处理 -->
    <!-- #ifdef MP-WEIXIN || MP-QQ -->
    <canvas
      id="watermarkCanvas"
      type="2d"
      style="position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px;"
    ></canvas>
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN || MP-QQ -->
    <canvas
      canvas-id="watermarkCanvas"
      style="position: fixed; top: -9999px; left: -9999px; width: 1px; height: 1px;"
    ></canvas>
    <!-- #endif -->

    <!-- 地址选择浮层 -->
    <address-select
      :show="showAddressSelect"
      :latitude="locationInfo.latitude"
      :longitude="locationInfo.longitude"
      @close="onAddressSelectClose"
      @confirm="onAddressSelectConfirm"
    ></address-select>
  </view>
</template>

<style lang="scss" scoped>
.camera-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  background: #000;
  overflow: hidden;
}

/* 毛玻璃背景图 */
.background-blur,
.preview-picture {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.preview-picture {
  height: 80vh;
  z-index: 150;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.blur-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(20rpx);
  -webkit-backdrop-filter: blur(20rpx);
  background: rgba(0, 0, 0, 0.3);
}

.camera-preview {
  width: 100%;
  height: 80vh;
  position: absolute;
  top: 0;
  left: 0;
  transition: transform 0.3s ease;
}

/* 横屏模式 */
.camera-preview.landscape-left {
  transform: rotate(90deg);
}

.camera-preview.landscape-right {
  transform: rotate(-90deg);
}

.camera-preview.portrait-upside-down {
  transform: rotate(180deg);
}

/* 水印叠加层 */
.watermark-overlay {
  width: 100%;
  height: 80vh;
  position: absolute;
  top: auto;
  left: 0;
  pointer-events: none;
}

/* 功能区域容器 */
.function-area {
  position: absolute;
  top: calc(106rpx + env(safe-area-inset-top));
  left: 30rpx;
  pointer-events: auto;
  z-index: 100;
}

/* 左上角设置按钮 */
.watermark-top-left {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

/* 闪光灯按钮样式 */
.flash-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 60rpx;
}

.flash-icon {
  width: 36rpx;
  height: 36rpx;
  margin-bottom: 8rpx;
}

.flash-text {
  color: #fff;
  font-size: 20rpx;
  text-align: center;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
}

/* 倒计时叠加层 */
.timer-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-count {
  width: 200rpx;
  height: 200rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 80rpx;
  font-weight: bold;
  color: #007aff;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 新的底部控制栏 */
.bottom-controls-new {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 16vh;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 60rpx;
  padding-bottom: env(safe-area-inset-bottom);
  z-index: 100;
}

/* 新的控制按钮样式 */
.control-btn-new {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn-new:active {
  transform: scale(0.9);
}

.btn-icon-new {
  width: 48rpx;
  height: 48rpx;
  margin-bottom: 8rpx;
}

.btn-text-new {
  color: #fff;
  font-size: 22rpx;
  text-align: center;
}

/* 新的拍照按钮样式 */
.shutter-btn-new {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4rpx solid #fff;
  background: rgba(255, 255, 255, 0.1);
  touch-action: manipulation;
  transition: all 0.3s ease;
}

.shutter-btn-new.capturing {
  background: #ff3b30;
  animation: captureFlash 0.3s ease-out;
}

.shutter-inner-new {
  width: 108rpx;
  height: 108rpx;
  border-radius: 50%;
  margin: 8rpx;
  background: #fff;
}

.permission-text-new {
  color: rgb(12, 135, 236);
  font-size: 24rpx;
  font-weight: 500;
  text-align: center;
  line-height: 1.2;
}

@keyframes captureFlash {
  0% { background: #fff; transform: scale(1); }
  50% { background: #007aff; transform: scale(1.1); }
  100% { background: #fff; transform: scale(1); }
}

/* 权限提示tooltip */
.permission-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 20rpx;
  z-index: 1000;
  animation: tooltipFadeIn 0.3s ease-out;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 20rpx 30rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  white-space: nowrap;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
}

.tooltip-buttons {
  display: flex;
  gap: 10rpx;
  margin-top: 10rpx;
}

.tooltip-btn {
  background: #007aff;
  color: #fff;
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border-radius: 8rpx;
  border: none;
  line-height: 1.4;
}

.tooltip-btn.secondary {
  background: rgba(255, 255, 255, 0.2);
}

.tooltip-arrow {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 12rpx solid transparent;
  border-right: 12rpx solid transparent;
  border-top: 12rpx solid rgba(0, 0, 0, 0.8);
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 功能控制区域 */
.function-controls {
  position: absolute;
  right: 40rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

/* 加载叠加层 */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5rpx);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  padding: 60rpx;
  border-radius: 20rpx;
  backdrop-filter: blur(10rpx);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.3);
  animation: fadeIn 0.3s ease-out;
}

.loading-spinner {
  width: 80rpx;
  height: 80rpx;
  border: 6rpx solid rgba(255, 255, 255, 0.2);
  border-top: 6rpx solid #fff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 30rpx;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  text-align: center;
}

/* 淡入动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
