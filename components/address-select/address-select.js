// components/address-select/address-select.js
// const {md5} = require('../../utils/md5');
// const CryptoJS = require("crypto-js"); // Node.js 环境
import CryptoJS from "crypto-js";
Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    latitude: {
      type: Number,
      value: null
    },
    longitude: {
      type: Number,
      value: null
    }
  },

  data: {
    addressList: [],
    selectedIndex: -1,
    loading: false,
    error: ''
  },

  observers: {
    'show,latitude,longitude': function(show, lat, lng) {
      if (show && lat && lng) {
        this.getAddressList(lat, lng)
      }
    }
  },

  methods: {
    // 调用腾讯地图API获取地址信息
    getAddressList(lat, lng) {
      this.setData({
        loading: true,
        error: '',
        addressList: [],
        selectedIndex: -1
      })
      const domain = 'https://apis.map.qq.com'
      const key = 'APOBZ-A6OK4-L4QU7-KTFUA-5IT6H-NTFGI'
      const sec_hash = 'NV1IZ0ARAwClJKjMm0CBEHxGNtyMAorl';
      const url = `/ws/geocoder/v1?key=${key}&location=39.901271,116.401477&radius=100`
      // url 进行md5 加密
      // const md5Url = md5(url+sec_hash);
      
      const hash = CryptoJS.MD5(url+sec_hash).toString(CryptoJS.enc.Hex);
      console.log('md5 hash', url+sec_hash, hash)
      wx.request({
        url: domain + url + '&sig=' + hash,
        method: 'GET',
        success: (res) => {
          console.log('腾讯地图API响应:', res.data)
          if (res.data.status === 0) {
            const result = res.data.result
            const addressList = []
            
            // 添加当前位置的详细地址
            if (result.address) {
              addressList.push({
                address: result.address,
                type: '当前位置',
                detail: result.formatted_addresses?.recommend || result.address
              })
            }
            
            // 添加周边POI信息
            if (result.pois && result.pois.length > 0) {
              result.pois.forEach(poi => {
                addressList.push({
                  address: poi.title,
                  type: poi.category,
                  detail: poi.address || poi.title,
                  distance: poi._distance
                })
              })
            }
            
            // 添加行政区划信息
            if (result.ad_info) {
              const adInfo = result.ad_info
              const adminAddress = `${adInfo.province}${adInfo.city}${adInfo.district}`
              if (adminAddress && !addressList.some(item => item.address === adminAddress)) {
                addressList.push({
                  address: adminAddress,
                  type: '行政区划',
                  detail: adminAddress
                })
              }
            }
            
            this.setData({
              addressList: addressList,
              loading: false
            })
          } else {
            this.setData({
              error: res.data.message || '获取地址信息失败',
              loading: false
            })
          }
        },
        fail: (err) => {
          console.error('腾讯地图API调用失败:', err)
          this.setData({
            error: '网络请求失败，请检查网络连接',
            loading: false
          })
        }
      })
    },

    // 选择地址
    selectAddress(e) {
      const index = e.currentTarget.dataset.index
      const address = this.data.addressList[index]
      
      this.setData({
        selectedIndex: index
      })
      
      // 触发选择事件
      this.triggerEvent('select', {
        address: address.detail || address.address,
        item: address
      })
    },

    // 确认选择
    confirmSelect() {
      if (this.data.selectedIndex >= 0) {
        const address = this.data.addressList[this.data.selectedIndex]
        this.triggerEvent('confirm', {
          address: address.detail || address.address,
          item: address
        })
      }
      this.close()
    },

    // 关闭浮层
    close() {
      this.triggerEvent('close')
    },

    // 阻止事件冒泡
    preventBubble() {
      // 阻止点击内容区域时关闭浮层
    }
  }
})