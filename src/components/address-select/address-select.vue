<script setup lang="ts">
import { ref, watch } from 'vue'
import { md5 } from '@/utils/md5'
import type { AddressItem, TencentMapResponse } from '@/types/index'

const props = withDefaults(defineProps<{
  show?: boolean
  latitude?: number | null
  longitude?: number | null
}>(), {
  show: false,
  latitude: null,
  longitude: null
})

const emit = defineEmits<{
  close: []
  select: [payload: { address: string; item: AddressItem }]
  confirm: [payload: { address: string; item: AddressItem }]
}>()

const addressList = ref<AddressItem[]>([])
const selectedIndex = ref(-1)
const loading = ref(false)
const error = ref('')

watch(() => props.show, (val) => {
  if (val && props.latitude && props.longitude) {
    getAddressList(props.latitude, props.longitude)
  }
})

function getAddressList(lat: number, lng: number): void {
  loading.value = true
  error.value = ''
  addressList.value = []
  selectedIndex.value = -1

  const domain = 'https://apis.map.qq.com'
  const key = 'APOBZ-A6OK4-L4QU7-KTFUA-5IT6H-NTFGI'
  const sec_hash = 'NV1IZ0ARAwClJKjMm0CBEHxGNtyMAorl'
  const locationStr = `${lat},${lng}`
  const url = `/ws/geocoder/v1?key=${key}&location=${locationStr}&get_poi=1&radius=100`

  const hash = md5(url + sec_hash)
  console.log('md5 hash', url + sec_hash, hash)

  uni.request({
    url: domain + url + '&sig=' + hash,
    method: 'GET',
    success: (res: any) => {
      console.log('腾讯地图API响应:', res.data)
      if (res.data.status === 0) {
        const result = res.data.result
        const list: AddressItem[] = []

        if (result.address) {
          list.push({
            address: result.address,
            type: '当前位置',
            detail: result.formatted_addresses?.recommend || result.address
          })
        }

        if (result.pois && result.pois.length > 0) {
          result.pois.forEach((poi: any) => {
            list.push({
              address: poi.title,
              type: poi.category,
              detail: poi.address || poi.title,
              distance: poi._distance
            })
          })
        }

        if (result.ad_info) {
          const adInfo = result.ad_info
          const adminAddress = `${adInfo.province}${adInfo.city}${adInfo.district}`
          if (adminAddress && !list.some(item => item.address === adminAddress)) {
            list.push({
              address: adminAddress,
              type: '行政区划',
              detail: adminAddress
            })
          }
        }

        addressList.value = list
        loading.value = false
      } else {
        error.value = res.data.message || '获取地址信息失败'
        loading.value = false
      }
    },
    fail: (err: any) => {
      console.error('腾讯地图API调用失败:', err)
      error.value = '网络请求失败，请检查网络连接'
      loading.value = false
    }
  })
}

function retryGetAddress(): void {
  if (props.latitude && props.longitude) {
    getAddressList(props.latitude, props.longitude)
  }
}

function selectAddress(index: number): void {
  selectedIndex.value = index
  const item = addressList.value[index]
  emit('select', {
    address: item.detail || item.address,
    item: item
  })
}

function confirmSelect(): void {
  if (selectedIndex.value >= 0) {
    const item = addressList.value[selectedIndex.value]
    emit('confirm', {
      address: item.detail || item.address,
      item: item
    })
  }
  close()
}

function close(): void {
  emit('close')
}

function preventBubble(): void {
  // 阻止点击内容区域时关闭浮层
}
</script>

<template>
  <view v-if="show" class="address-select-overlay" @click="close">
    <view class="address-select-panel" @click.stop="preventBubble">
      <!-- 标题栏 -->
      <view class="panel-header">
        <view class="header-title">选择地址信息</view>
        <view class="close-btn" @click="close">
          <text class="close-icon">×</text>
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="panel-content">
        <!-- 加载状态 -->
        <view v-if="loading" class="loading-state">
          <view class="loading-spinner"></view>
          <text class="loading-text">正在获取地址信息...</text>
        </view>

        <!-- 错误状态 -->
        <view v-else-if="error" class="error-state">
          <text class="error-icon">⚠</text>
          <text class="error-text">{{ error }}</text>
          <button class="retry-btn" @click="retryGetAddress">重试</button>
        </view>

        <!-- 地址列表 -->
        <view v-else class="address-list">
          <view v-if="addressList.length === 0" class="empty-state">
            <text class="empty-text">暂无地址信息</text>
          </view>

          <view v-else>
            <view
              v-for="(item, index) in addressList"
              :key="index"
              class="address-item"
              :class="{ selected: selectedIndex === index }"
              @click="selectAddress(index)"
            >
              <view class="address-main">
                <view class="address-title">{{ item.address }}</view>
                <view class="address-detail">{{ item.detail }}</view>
              </view>
              <view class="address-meta">
                <view class="address-type">{{ item.type }}</view>
                <view v-if="item.distance" class="address-distance">{{ item.distance }}m</view>
              </view>
              <view class="select-indicator">
                <text v-if="selectedIndex === index" class="check-icon">✓</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view v-if="!loading && !error && addressList.length > 0" class="panel-footer">
        <button class="cancel-btn" @click="close">取消</button>
        <button
          class="confirm-btn"
          :class="selectedIndex >= 0 ? 'active' : 'disabled'"
          @click="confirmSelect"
          :disabled="selectedIndex < 0"
        >
          确认选择
        </button>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 浮层遮罩 */
.address-select-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  animation: fadeIn 0.3s ease-out;
}

/* 浮层面板 */
.address-select-panel {
  width: 100%;
  max-height: 80vh;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

/* 标题栏 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
}

.header-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.close-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f5f5f5;
}

.close-icon {
  font-size: 40rpx;
  color: #666;
  line-height: 1;
}

/* 内容区域 */
.panel-content {
  flex: 1;
  overflow: hidden;
  min-height: 400rpx;
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f0f0f0;
  border-top: 4rpx solid #007aff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 错误状态 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.error-icon {
  font-size: 60rpx;
  color: #ff3b30;
  margin-bottom: 20rpx;
}

.error-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 40rpx;
  text-align: center;
}

.retry-btn {
  background: #007aff;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

/* 地址列表 */
.address-list {
  max-height: 60vh;
  overflow-y: auto;
}

.address-item {
  display: flex;
  align-items: center;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
  transition: background-color 0.2s ease;
}

.address-item:active {
  background: #f8f8f8;
}

.address-item.selected {
  background: #f0f8ff;
  border-color: #007aff;
}

.address-main {
  flex: 1;
  margin-right: 20rpx;
}

.address-title {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.address-detail {
  font-size: 26rpx;
  color: #666;
  line-height: 1.4;
}

.address-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 20rpx;
}

.address-type {
  font-size: 22rpx;
  color: #999;
  background: #f5f5f5;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
  margin-bottom: 8rpx;
}

.address-distance {
  font-size: 22rpx;
  color: #007aff;
}

.select-indicator {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.check-icon {
  font-size: 32rpx;
  color: #007aff;
  font-weight: bold;
}

/* 底部按钮 */
.panel-footer {
  display: flex;
  padding: 30rpx 40rpx;
  background: #fff;
  border-top: 1rpx solid #f0f0f0;
  gap: 20rpx;
}

.cancel-btn {
  flex: 1;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
}

.confirm-btn {
  flex: 2;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx 0;
  font-size: 30rpx;
  transition: all 0.2s ease;
}

.confirm-btn.active {
  background: #007aff;
  color: #fff;
}

.confirm-btn.disabled {
  background: #e5e5e5;
  color: #999;
}

/* 动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
