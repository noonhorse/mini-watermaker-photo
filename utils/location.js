// utils/location.js
// 位置服务工具函数

/**
 * 获取当前位置信息
 * @param {Object} options 配置选项
 * @param {Function} options.success 成功回调
 * @param {Function} options.fail 失败回调
 * @param {string} options.type 坐标类型，默认为gcj02
 */
function getCurrentLocation(options = {}) {
  const {
    success = () => {},
    fail = () => {},
    type = 'gcj02'
  } = options

  // 检查位置权限
  wx.getSetting({
    success: (res) => {
      if (res.authSetting['scope.userLocation']) {
        // 已授权，直接获取位置
        getLocationData(type, success, fail)
      } else {
        // 未授权，请求授权
        requestLocationPermission(type, success, fail)
      }
    },
    fail: (err) => {
      console.error('获取设置失败', err)
      fail(err)
    }
  })
}

/**
 * 请求位置权限
 * @param {string} type 坐标类型
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function requestLocationPermission(type, success, fail) {
  wx.authorize({
    scope: 'scope.userLocation',
    success: () => {
      // 授权成功，获取位置
      getLocationData(type, success, fail)
    },
    fail: () => {
      // 授权失败，引导用户手动开启
      wx.showModal({
        title: '位置权限',
        content: '需要获取您的位置信息来添加地址水印，请在设置中开启位置权限',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting({
              success: (settingRes) => {
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
}

/**
 * 获取位置数据
 * @param {string} type 坐标类型
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function getLocationData(type, success, fail) {
  wx.getLocation({
    type: type,
    altitude: true,
    success: (res) => {
      const locationData = {
        latitude: res.latitude,
        longitude: res.longitude,
        speed: res.speed,
        accuracy: res.accuracy,
        altitude: res.altitude,
        verticalAccuracy: res.verticalAccuracy,
        horizontalAccuracy: res.horizontalAccuracy
      }
      
      // 获取地址信息
      reverseGeocode(res.latitude, res.longitude, (address) => {
        locationData.address = address
        success(locationData)
      }, (err) => {
        // 即使地址获取失败，也返回坐标信息
        locationData.address = ''
        success(locationData)
      })
    },
    fail: (err) => {
      console.error('获取位置失败', err)
      fail(err)
    }
  })
}

/**
 * 逆地理编码 - 根据坐标获取地址
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function reverseGeocode(latitude, longitude, success, fail) {
  // 这里使用腾讯地图API作为示例
  // 实际使用时需要申请API密钥
  const key = 'YOUR_TENCENT_MAP_KEY' // 需要替换为实际的API密钥
  
  if (!key || key === 'YOUR_TENCENT_MAP_KEY') {
    // 如果没有配置API密钥，使用模拟数据
    getMockAddress(latitude, longitude, success)
    return
  }
  
  wx.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/',
    data: {
      location: `${latitude},${longitude}`,
      key: key,
      get_poi: 1
    },
    success: (res) => {
      if (res.data.status === 0) {
        const result = res.data.result
        const address = result.address || ''
        const formattedAddress = formatAddress(result)
        success(formattedAddress)
      } else {
        console.error('逆地理编码失败', res.data)
        getMockAddress(latitude, longitude, success)
      }
    },
    fail: (err) => {
      console.error('请求地址失败', err)
      getMockAddress(latitude, longitude, success)
    }
  })
}

/**
 * 格式化地址信息
 * @param {Object} result 地理编码结果
 * @returns {string} 格式化的地址
 */
function formatAddress(result) {
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
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @param {Function} success 成功回调
 */
function getMockAddress(latitude, longitude, success) {
  // 根据坐标范围返回模拟地址
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
 * @param {number} lat1 第一个点的纬度
 * @param {number} lng1 第一个点的经度
 * @param {number} lat2 第二个点的纬度
 * @param {number} lng2 第二个点的经度
 * @returns {number} 距离（米）
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const radLat1 = lat1 * Math.PI / 180.0
  const radLat2 = lat2 * Math.PI / 180.0
  const a = radLat1 - radLat2
  const b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0
  
  let s = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
  ))
  
  s = s * 6378.137 // 地球半径
  s = Math.round(s * 10000) / 10000
  
  return s * 1000 // 转换为米
}

/**
 * 格式化坐标显示
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @param {number} precision 精度，默认6位小数
 * @returns {string} 格式化的坐标字符串
 */
function formatCoordinates(latitude, longitude, precision = 6) {
  if (!latitude || !longitude) return ''
  
  const lat = parseFloat(latitude).toFixed(precision)
  const lng = parseFloat(longitude).toFixed(precision)
  
  return `${lat}, ${lng}`
}

/**
 * 检查坐标是否有效
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @returns {boolean} 是否有效
 */
function isValidCoordinates(latitude, longitude) {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  )
}

module.exports = {
  getCurrentLocation,
  reverseGeocode,
  calculateDistance,
  formatCoordinates,
  isValidCoordinates
}