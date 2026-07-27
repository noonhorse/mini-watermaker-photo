// utils/settings.ts
// 设置管理模块 - 替代 App.vue 中的 globalData 模式
import type { UserSettings } from '@/types/index'

const STORAGE_KEY = 'cameraSettings'

const DEFAULT_SETTINGS: UserSettings = {
  logo: '',
  logoText: '水印相机',
  description: '打卡记录',
  showLocation: true,
  showCoordinates: false,
  language: 'zh',
  flashMode: 'auto',
  timerSeconds: 0
}

let _settings: UserSettings = { ...DEFAULT_SETTINGS }

/**
 * 获取用户设置
 * @returns 当前设置
 */
export function getSettings(): UserSettings {
  try {
    const stored = uni.getStorageSync(STORAGE_KEY)
    if (stored && typeof stored === 'object') {
      _settings = { ...DEFAULT_SETTINGS, ...stored }
    }
  } catch (e) {
    console.error('获取设置失败', e)
  }
  return { ..._settings }
}

/**
 * 保存用户设置
 * @param newSettings 要保存的设置（部分或全部）
 */
export function saveSettings(newSettings: Partial<UserSettings>): void {
  try {
    _settings = { ..._settings, ...newSettings }
    uni.setStorageSync(STORAGE_KEY, _settings)
  } catch (e) {
    console.error('保存设置失败', e)
  }
}

/**
 * 重置为默认设置
 */
export function resetSettings(): void {
  _settings = { ...DEFAULT_SETTINGS }
  try {
    uni.setStorageSync(STORAGE_KEY, _settings)
  } catch (e) {
    console.error('重置设置失败', e)
  }
}

/**
 * 获取默认设置
 * @returns 默认设置
 */
export function getDefaultSettings(): UserSettings {
  return { ...DEFAULT_SETTINGS }
}
