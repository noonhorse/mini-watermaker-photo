<script setup lang="ts">
import { ref } from 'vue'
import { onLoad, onUnload, onHide } from '@dcloudio/uni-app'
import { getSettings, saveSettings, resetSettings as resetAllSettings, getDefaultSettings } from '@/utils/settings'
import type { UserSettings, PickerOption } from '@/types/index'

const settings = ref<UserSettings>({} as UserSettings)

const flashModes: PickerOption[] = [
  { name: '自动', value: 'auto' },
  { name: '开启', value: 'on' },
  { name: '关闭', value: 'off' }
]
const flashModeIndex = ref(0)

const timerOptions: PickerOption[] = [
  { name: '关闭', value: 0 },
  { name: '3秒', value: 3 },
  { name: '5秒', value: 5 },
  { name: '10秒', value: 10 }
]
const timerIndex = ref(0)

const languages: PickerOption[] = [
  { name: '中文', value: 'zh' },
  { name: 'English', value: 'en' }
]
const languageIndex = ref(0)

onLoad(() => {
  const data = getSettings()
  settings.value = data
  initPickerValues()
})

onUnload(() => {
  saveSettings(settings.value)
})

onHide(() => {
  saveSettings(settings.value)
})

function initPickerValues(): void {
  const fmi = flashModes.findIndex(item => item.value === settings.value.flashMode)
  flashModeIndex.value = fmi >= 0 ? fmi : 0

  const ti = timerOptions.findIndex(item => item.value === settings.value.timerSeconds)
  timerIndex.value = ti >= 0 ? ti : 0

  const li = languages.findIndex(item => item.value === settings.value.language)
  languageIndex.value = li >= 0 ? li : 0
}

function selectLogo(): void {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res: any) => {
      const tempFilePath = res.tempFilePaths[0]
      settings.value.logo = tempFilePath
    },
    fail: (err: any) => {
      console.error('选择图片失败', err)
      uni.showToast({ title: '选择图片失败', icon: 'none' })
    }
  })
}

function onLogoTextChange(e: any): void {
  settings.value.logoText = e.detail.value
}

function onDescriptionChange(e: any): void {
  settings.value.description = e.detail.value
}

function onShowLocationChange(e: any): void {
  settings.value.showLocation = e.detail.value
}

function onShowCoordinatesChange(e: any): void {
  settings.value.showCoordinates = e.detail.value
}

function onFlashModeChange(e: any): void {
  const index = parseInt(e.detail.value)
  flashModeIndex.value = index
  settings.value.flashMode = flashModes[index].value as string
}

function onTimerChange(e: any): void {
  const index = parseInt(e.detail.value)
  timerIndex.value = index
  settings.value.timerSeconds = timerOptions[index].value as number
}

function onLanguageChange(e: any): void {
  const index = parseInt(e.detail.value)
  languageIndex.value = index
  settings.value.language = languages[index].value as string
  updateLanguage(languages[index].value as string)
}

function updateLanguage(language: string): void {
  console.log('切换语言到:', language)
  uni.showToast({
    title: language === 'zh' ? '已切换到中文' : 'Switched to English',
    icon: 'success'
  })
}

function clearCache(): void {
  uni.showModal({
    title: '清除缓存',
    content: '确定要清除所有缓存数据吗？',
    success: (res: any) => {
      if (res.confirm) {
        try {
          uni.clearStorageSync()
          uni.showToast({ title: '缓存已清除', icon: 'success' })
        } catch (error) {
          uni.showToast({ title: '清除失败', icon: 'error' })
        }
      }
    }
  })
}

function logout(): void {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (res: any) => {
      if (res.confirm) {
        uni.showToast({ title: '已退出登录', icon: 'success' })
      }
    }
  })
}

function resetSettingsFn(): void {
  uni.showModal({
    title: '确认重置',
    content: '确定要恢复默认设置吗？',
    success: (res: any) => {
      if (res.confirm) {
        const defaultSettings = getDefaultSettings()
        settings.value = defaultSettings
        initPickerValues()
        uni.showToast({ title: '已恢复默认设置', icon: 'success' })
      }
    }
  })
}

function showAbout(): void {
  uni.showModal({
    title: '关于水印相机',
    content: '水印打卡相机 v1.0.0\n\n一款功能强大的水印相机应用，支持GPS定位、时间水印、自定义Logo等功能。\n\n© 2024 水印相机团队',
    showCancel: false,
    confirmText: '知道了'
  })
}

function saveSettingsFn(): void {
  try {
    saveSettings(settings.value)
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      goBack()
    }, 1500)
  } catch (e) {
    console.error('保存设置失败', e)
    uni.showToast({ title: '保存失败', icon: 'none' })
  }
}

function goBack(): void {
  uni.navigateBack({ delta: 1 })
}
</script>

<template>
  <view class="settings-container">
    <!-- 设置内容 -->
    <scroll-view class="settings-content" scroll-y="true">
      <!-- Logo设置 -->
      <view class="setting-group">
        <view class="section-header">Logo设置</view>

        <view class="setting-item">
          <view class="item-label">Logo图片</view>
          <view class="item-content">
            <view class="logo-preview" @click="selectLogo">
              <image v-if="settings.logo" class="logo-image" :src="settings.logo" mode="aspectFit"></image>
              <view v-else class="logo-placeholder">点击选择Logo</view>
            </view>
          </view>
        </view>

        <view class="setting-item">
          <view class="item-label">Logo文字</view>
          <view class="item-content">
            <input
              class="text-input"
              :value="settings.logoText"
              placeholder="请输入Logo文字"
              @input="onLogoTextChange"
            />
          </view>
        </view>
      </view>

      <!-- 水印文字设置 -->
      <view class="setting-group">
        <view class="section-header">水印文字</view>

        <view class="setting-item">
          <view class="item-label">描述文字</view>
          <view class="item-content">
            <input
              class="text-input"
              :value="settings.description"
              placeholder="请输入描述文字"
              @input="onDescriptionChange"
            />
          </view>
        </view>
      </view>

      <!-- 显示设置 -->
      <view class="setting-group">
        <view class="section-header">显示设置</view>

        <view class="setting-item">
          <view class="item-label">显示地址</view>
          <view class="item-content">
            <switch :checked="settings.showLocation" @change="onShowLocationChange" color="#007aff" />
          </view>
        </view>

        <view class="setting-item">
          <view class="item-label">显示坐标</view>
          <view class="item-content">
            <switch :checked="settings.showCoordinates" @change="onShowCoordinatesChange" color="#007aff" />
          </view>
        </view>
      </view>

      <!-- 相机设置 -->
      <view class="setting-group">
        <view class="section-header">相机设置</view>

        <view class="setting-item">
          <view class="item-label">闪光灯模式</view>
          <view class="item-content">
            <picker @change="onFlashModeChange" :value="flashModeIndex" :range="flashModes" range-key="name">
              <view class="picker-display">{{ flashModes[flashModeIndex].name }}</view>
            </picker>
          </view>
        </view>

        <view class="setting-item">
          <view class="item-label">定时器</view>
          <view class="item-content">
            <picker @change="onTimerChange" :value="timerIndex" :range="timerOptions" range-key="name">
              <view class="picker-display">{{ timerOptions[timerIndex].name }}</view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 语言设置 -->
      <view class="setting-group">
        <view class="section-header">语言设置</view>

        <view class="setting-item">
          <view class="item-label">界面语言</view>
          <view class="item-content">
            <picker @change="onLanguageChange" :value="languageIndex" :range="languages" range-key="name">
              <view class="picker-display">{{ languages[languageIndex].name }}</view>
            </picker>
          </view>
        </view>
      </view>

      <!-- 其他设置 -->
      <view class="setting-group">
        <view class="section-header">其他</view>

        <view class="setting-item" @click="clearCache">
          <view class="item-label">清除缓存</view>
          <view class="item-content">
            <view class="action-text">点击清除</view>
          </view>
        </view>

        <view class="setting-item" @click="resetSettingsFn">
          <view class="item-label">恢复默认设置</view>
          <view class="item-content">
            <view class="action-text">点击恢复</view>
          </view>
        </view>
      </view>

      <!-- 关于 -->
      <view class="setting-group">
        <view class="section-header">关于</view>

        <view class="setting-item">
          <view class="item-label">版本号</view>
          <view class="item-content">
            <view class="version-text">v1.0.0</view>
          </view>
        </view>

        <view class="setting-item" @click="showAbout">
          <view class="item-label">关于应用</view>
          <view class="item-content">
            <view class="action-text">查看详情</view>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部按钮 -->
    <view class="settings-footer">
      <button class="save-btn" @click="saveSettingsFn">保存设置</button>
      <button class="back-btn" @click="goBack">返回相机</button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settings-container {
  width: 100vw;
  height: 100vh;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
}

.settings-content {
  flex: 1;
  padding: 0;
}

/* 分组标题 */
.section-header {
  padding: 32rpx 32rpx 16rpx;
  font-size: 26rpx;
  color: #6d6d72;
  text-transform: uppercase;
  font-weight: 400;
  letter-spacing: 0.5rpx;
}

/* 设置分组 */
.setting-group {
  background: #fff;
  margin: 0 32rpx 32rpx;
  border-radius: 20rpx;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #c6c6c8;
  min-height: 88rpx;
  position: relative;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-item:active {
  background: #d1d1d6;
}

.item-label {
  font-size: 34rpx;
  color: #000;
  flex: 1;
  font-weight: 400;
}

.item-value {
  font-size: 34rpx;
  color: #8e8e93;
  margin-right: 16rpx;
}

/* 响应式设计 */
@media (max-width: 750rpx) {
  .setting-group {
    margin: 0 24rpx 24rpx;
  }

  .section-header {
    padding: 24rpx 24rpx 12rpx;
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .settings-container {
    background: #000;
  }

  .section-header {
    color: #8e8e93;
  }

  .setting-group {
    background: #1c1c1e;
  }

  .setting-item {
    border-bottom-color: #38383a;
  }

  .setting-item:active {
    background: #2c2c2e;
  }

  .item-label {
    color: #fff;
  }

  .item-value {
    color: #8e8e93;
  }
}

/* 底部按钮 */
.settings-footer {
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  display: flex;
  gap: 20rpx;
}

.save-btn {
  flex: 1;
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
}

.back-btn {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
}

/* Logo预览 */
.logo-preview {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx dashed #ccc;
}

.logo-image {
  width: 100%;
  height: 100%;
}

.logo-placeholder {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}

/* 文字输入框 */
.text-input {
  font-size: 30rpx;
  color: #333;
  text-align: right;
  flex: 1;
}

/* 选择器显示 */
.picker-display {
  font-size: 30rpx;
  color: #8e8e93;
  text-align: right;
}

/* 操作文字 */
.action-text {
  font-size: 30rpx;
  color: #007aff;
}

/* 版本号 */
.version-text {
  font-size: 30rpx;
  color: #8e8e93;
}
</style>
