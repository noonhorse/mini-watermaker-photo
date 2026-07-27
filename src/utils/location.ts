// utils/location.ts
// 位置服务工具函数
// 已适配 uni-app 多平台
import type { LocationInfo, LocationOptions } from '@/types/index'

/**
 * 获取当前位置信息
 * @param options 配置选项
 */
export function getCurrentLocation(options: LocationOptions): void {
  const {
    success = () => {},
    fail = () => {},
    type = 'gcj02'
  } = options

  // 检查位置权限
  // #ifdef MP-WEIXIN
  wx.getSetting({
    success: (res: any) => {
      if (res.authSetting['scope.userLocation']) {
        getLocationData(type, success, fail)
      } else {
        requestLocationPermission(type, success, fail)
      }
    },
    fail: (err: any) => {
      console.error('获取设置失败', err)
      fail(err)
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  getLocationData(type, success, fail)
  // #endif
}

/**
 * 请求位置权限
 * @param type 坐标类型
 * @param success 成功回调
 * @param fail 失败回调
 */
function requestLocationPermission(
  type: string,
  success: (data: LocationInfo) => void,
  fail: (err: any) => void
): void {
  // #ifdef MP-WEIXIN
  wx.authorize({
    scope: 'scope.userLocation',
    success: () => {
      getLocationData(type, success, fail)
    },
    fail: () => {
      wx.showModal({
        title: '位置权限',
        content: '需要获取您的位置信息来添加地址水印，请在设置中开启位置权限',
        confirmText: '去设置',
        success: (res: any) => {
          if (res.confirm) {
            wx.openSetting({
              success: (settingRes: any) => {
                if (settingRes.authSetting['scope.userLocation']) {
                  getLocationData(type, success, fail)
                } else {
                  fail({ errMsg: '用户拒绝授权位置权限' })
                }
              }
            })
          } else {
            fail({ errMsg: '用户取消授权' })
          }
        }
      })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  getLocationData(type, success, fail)
  // #endif
}

/**
 * 获取位置数据
 * @param type 坐标类型
 * @param success 成功回调
 * @param fail 失败回调
 */
function getLocationData(
  type: string,
  success: (data: LocationInfo) => void,
  fail: (err: any) => void
): void {
  uni.getLocation({
    type: type as any,
    altitude: true,
    success: (res: any) => {
      const locationData: LocationInfo = {
        latitude: res.latitude,
        longitude: res.longitude,
        speed: res.speed,
        accuracy: res.accuracy,
        altitude: res.altitude,
        verticalAccuracy: res.verticalAccuracy,
        horizontalAccuracy: res.horizontalAccuracy,
        address: ''
      }

      // 获取地址信息
      reverseGeocode(
        res.latitude,
        res.longitude,
        (address: string) => {
          locationData.address = address
          success(locationData)
        },
        () => {
          // 即使地址获取失败，也返回坐标信息
          locationData.address = ''
          success(locationData)
        }
      )
    },
    fail: (err: any) => {
      console.error('获取位置失败', err)
      fail(err)
    }
  })
}

/**
 * 逆地理编码 - 根据坐标获取地址
 * @param latitude 纬度
 * @param longitude 经度
 * @param success 成功回调
 * @param fail 失败回调
 */
function reverseGeocode(
  latitude: number,
  longitude: number,
  success: (address: string) => void,
  fail: (err: any) => void
): void {
  // 这里使用腾讯地图API作为示例
  const key = 'YOUR_TENCENT_MAP_KEY'

  if (!key || key === 'YOUR_TENCENT_MAP_KEY') {
    getMockAddress(latitude, longitude, success)
    return
  }

  uni.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/',
    data: {
      location: `${latitude},${longitude}`,
      key: key,
      get_poi: 1
    },
    success: (res: any) => {
      if (res.data.status === 0) {
        const result = res.data.result
        const formattedAddress = formatAddress(result)
        success(formattedAddress)
      } else {
        console.error('逆地理编码失败', res.data)
        getMockAddress(latitude, longitude, success)
      }
    },
    fail: (err: any) => {
      console.error('请求地址失败', err)
      getMockAddress(latitude, longitude, success)
    }
  })
}

/**
 * 格式化地址信息
 * @param result 地理编码结果
 * @returns 格式化的地址
 */
function formatAddress(result: any): string {
  const {
    address_component,
    formatted_addresses,
    pois
  } = result

  let formattedAddress = ''

  if (formatted_addresses && formatted_addresses.recommend) {
    formattedAddress = formatted_addresses.recommend
  } else if (address_component) {
    const {
      province,
      city,
      district,
      street,
      street_number
    } = address_component

    formattedAddress = `${province}${city}${district}${street}${street_number}`
  }

  // 如果有POI信息，优先使用
  if (pois && pois.length > 0) {
    const poi = pois[0]
    if (poi.title) {
      formattedAddress = poi.title
    }
  }

  return formattedAddress || '未知位置'
}

/**
 * 获取模拟地址（用于测试或API不可用时）
 * @param latitude 纬度
 * @param longitude 经度
 * @param success 成功回调
 */
function getMockAddress(
  latitude: number,
  longitude: number,
  success: (address: string) => void
): void {
  let mockAddress = '未知位置'

  // 北京地区
  if (latitude >= 39.4 && latitude <= 41.0 && longitude >= 115.7 && longitude <= 117.4) {
    const addresses = [
      '北京市朝阳区建国门外大街1号',
      '北京市海淀区中关村大街27号',
      '北京市西城区西单北大街133号',
      '北京市东城区王府井大街255号',
      '北京市丰台区南三环西路16号'
    ]
    mockAddress = addresses[Math.floor(Math.random() * addresses.length)]
  }
  // 上海地区
  else if (latitude >= 30.7 && latitude <= 31.9 && longitude >= 120.9 && longitude <= 122.0) {
    const addresses = [
      '上海市黄浦区南京东路399号',
      '上海市浦东新区陆家嘴环路1000号',
      '上海市徐汇区淮海中路1045号',
      '上海市静安区南京西路1266号',
      '上海市长宁区延安西路1118号'
    ]
    mockAddress = addresses[Math.floor(Math.random() * addresses.length)]
  }
  // 广州地区
  else if (latitude >= 22.7 && latitude <= 23.9 && longitude >= 112.9 && longitude <= 114.0) {
    const addresses = [
      '广东省广州市天河区天河路208号',
      '广东省广州市越秀区中山五路219号',
      '广东省广州市海珠区新港中路397号',
      '广东省广州市荔湾区上下九步行街',
      '广东省广州市白云区机场路1630号'
    ]
    mockAddress = addresses[Math.floor(Math.random() * addresses.length)]
  }
  // 深圳地区
  else if (latitude >= 22.4 && latitude <= 22.8 && longitude >= 113.8 && longitude <= 114.6) {
    const addresses = [
      '广东省深圳市福田区深南大道1006号',
      '广东省深圳市南山区科技园南区',
      '广东省深圳市罗湖区人民南路2002号',
      '广东省深圳市宝安区新安街道107国道',
      '广东省深圳市龙岗区龙岗大道2288号'
    ]
    mockAddress = addresses[Math.floor(Math.random() * addresses.length)]
  }

  success(mockAddress)
}

/**
 * 计算两点间距离（米）
 * @param lat1 第一个点的纬度
 * @param lng1 第一个点的经度
 * @param lat2 第二个点的纬度
 * @param lng2 第二个点的经度
 * @returns 距离（米）
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const radLat1 = (lat1 * Math.PI) / 180.0
  const radLat2 = (lat2 * Math.PI) / 180.0
  const a = radLat1 - radLat2
  const b = (lng1 * Math.PI) / 180.0 - (lng2 * Math.PI) / 180.0

  let s =
    2 *
    Math.asin(
      Math.sqrt(
        Math.pow(Math.sin(a / 2), 2) +
          Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
      )
    )

  s = s * 6378.137 // 地球半径
  s = Math.round(s * 10000) / 10000

  return s * 1000 // 转换为米
}

/**
 * 格式化坐标显示
 * @param latitude 纬度
 * @param longitude 经度
 * @param precision 精度，默认6位小数
 * @returns 格式化的坐标字符串
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
  precision: number = 6
): string {
  if (!latitude || !longitude) return ''

  const lat = parseFloat(String(latitude)).toFixed(precision)
  const lng = parseFloat(String(longitude)).toFixed(precision)

  return `${lat}, ${lng}`
}

/**
 * 检查坐标是否有效
 * @param latitude 纬度
 * @param longitude 经度
 * @returns 是否有效
 */
export function isValidCoordinates(
  latitude: number,
  longitude: number
): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  )
}
