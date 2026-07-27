// types/index.ts
// 水印打卡相机 - 类型定义

/** 用户设置 */
export interface UserSettings {
  logo: string
  logoText: string
  description: string
  showLocation: boolean
  showCoordinates: boolean
  language: string
  flashMode: string
  timerSeconds: number
}

/** 位置信息 */
export interface LocationInfo {
  latitude: number
  longitude: number
  address: string
  speed?: number
  accuracy?: number
  altitude?: number
  verticalAccuracy?: number
  horizontalAccuracy?: number
}

/** 位置获取选项 */
export interface LocationOptions {
  success: (data: LocationInfo) => void
  fail: (err: any) => void
  type?: string
}

/** 水印数据 */
export interface WatermarkData {
  logoText: string
  description: string
  date: string
  datetime: string
  location: string
  coordinates: string
  showLocation: boolean
  showCoordinates: boolean
}

/** 水印生成选项 */
export interface WatermarkOptions {
  imagePath: string
  watermarkData: WatermarkData
  success: (path: string) => void
  fail: (err: any) => void
}

/** 水印行数据 */
export interface WatermarkLine {
  text: string
  font: string
  color: string
}

/** 旧版水印行数据 */
export interface WatermarkLineOld {
  text: string
  fontSize: number
  color: string
  bold?: boolean
}

/** 分享选项 */
export interface ShareOptions {
  filePath: string
  type: ShareType
  success: () => void
  fail: (err: any) => void
}

/** 分享类型 */
export type ShareType = 'album' | 'friend' | 'moments'

/** 分享结果 */
export interface ShareResult {
  success: boolean
  type: string
  error?: any
  cancelled?: boolean
}

/** 地址项 */
export interface AddressItem {
  address: string
  type: string
  detail: string
  distance?: number
}

/** 腾讯地图API响应 */
export interface TencentMapResponse {
  status: number
  message?: string
  result: {
    address?: string
    formatted_addresses?: {
      recommend?: string
    }
    ad_info?: {
      province: string
      city: string
      district: string
    }
    pois?: Array<{
      title: string
      category: string
      address?: string
      _distance?: number
    }>
  }
}

/** 水印样式项 */
export interface WatermarkStyleItem {
  id: string
  name: string
  preview: string
}

/** 闪光灯模式 */
export type FlashMode = 'off' | 'on' | 'auto'

/** 选择器选项 */
export interface PickerOption {
  name: string
  value: string | number
}

/** 相机位置 */
export type CameraPosition = 'back' | 'front'

/** 屏幕方向 */
export type Orientation = 'portrait' | 'landscape-left' | 'landscape-right' | 'portrait-upside-down'

/** 水印ID */
export type WatermarkId = 'default' | 'engineering' | 'time_card' | 'environment' | 'simple_time' | 'temperature' | 'work_record' | 'blue_card'

/** 图片信息 */
export interface ImageInfo {
  width: number
  height: number
  path: string
  type?: string
}

/** 系统信息 */
export interface SystemInfo {
  system?: string
  memorySize?: number
  pixelRatio: number
  platform?: string
  windowWidth?: number
  windowHeight?: number
}
