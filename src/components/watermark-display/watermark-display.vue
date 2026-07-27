<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { WatermarkId, LocationInfo } from '@/types/index'

const props = withDefaults(defineProps<{
  watermarkId?: WatermarkId
  locationInfo?: LocationInfo
  visible?: boolean
}>(), {
  watermarkId: 'default',
  locationInfo: () => ({ latitude: 0, longitude: 0, address: '' }),
  visible: true
})

const miniName = ref('水印相片')
const hash = ref('')
const title = ref<string | undefined>(undefined)
const weekday = ref('')
const currentTime = ref('')
const currentDate = ref('')
const latitude = ref(39.903732)
const longitude = ref(116.397772)
const address = ref('北京市.天安门广场')
const timeInterval = ref<ReturnType<typeof setInterval> | null>(null)

const currentLocation = computed(() => {
  return props.locationInfo?.address || address.value
})

watch(() => props.locationInfo, (val) => {
  if (val) {
    if (val.latitude) latitude.value = val.latitude
    if (val.longitude) longitude.value = val.longitude
    if (val.address) address.value = val.address
  }
}, { immediate: true })

onMounted(() => {
  updateTime()
  timeInterval.value = setInterval(() => {
    updateTime()
  }, 60000)
})

onBeforeUnmount(() => {
  if (timeInterval.value) {
    clearInterval(timeInterval.value)
  }
})

function updateTime(): void {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  const wd = weekdays[now.getDay()]

  currentTime.value = `${hours}:${minutes}`
  weekday.value = wd
  currentDate.value = `${year}.${month}.${day}`
}
</script>

<template>
  <!-- 水印显示组件 -->
  <view v-if="visible" class="watermark-overlay">
    <!-- 默认水印样式 -->
    <view v-if="watermarkId === 'default'" class="watermark-bottom-left">
      <view v-if="title" class="description-text">{{ title }}</view>
      <view class="date-text">{{ currentTime }}</view>
      <view class="datetime-text">{{ currentDate }}</view>
      <view class="location-text">
        <image class="location-icon" src="/static/dingwei.png" mode="aspectFit"></image>
        <text class="location-text-content">位置{{ currentLocation }}</text>
      </view>
    </view>

    <!-- 工程记录水印 -->
    <view v-if="watermarkId === 'engineering'" class="watermark-engineering">
      <view class="engineering-header">{{ title || '' }}</view>
      <view class="engineering-time">拍摄时间：{{ currentTime }}</view>
      <view class="engineering-date">拍摄日期：{{ currentDate }}</view>
      <view class="engineering-location">拍摄地点：{{ currentLocation }}</view>
    </view>

    <!-- 时间卡片水印 -->
    <view v-if="watermarkId === 'time_card'" class="watermark-time-card">
      <view class="time-card-time">{{ currentTime }}</view>
      <view class="time-card-name">姓名</view>
      <view class="time-card-date">{{ currentDate }} 周{{ weekday }}</view>
      <view class="time-card-location">{{ currentLocation }}</view>
    </view>

    <!-- 环境治理水印 -->
    <view v-if="watermarkId === 'environment'" class="watermark-environment">
      <view class="env-title">{{ title || '环境治理' }}</view>
      <view class="env-datetime">{{ currentDate }} {{ currentTime }}</view>
      <view class="env-location">{{ currentLocation }}</view>
      <view class="env-detail">工作内容：备注等</view>
    </view>

    <!-- 简约时间水印 -->
    <view v-if="watermarkId === 'simple_time'" class="watermark-simple-time">
      <view class="simple-time">{{ currentTime }}</view>
      <view class="simple-name">姓名 {{ currentDate }}</view>
      <view class="simple-location">{{ currentLocation }}</view>
    </view>

    <!-- 温度显示水印 -->
    <view v-if="watermarkId === 'temperature'" class="watermark-temperature">
      <view class="temp-time">{{ currentTime }}</view>
      <view class="temp-date">{{ currentDate }} 周{{ weekday }}</view>
      <view class="temp-location">{{ currentLocation }}</view>
    </view>

    <!-- 工作记录水印 -->
    <view v-if="watermarkId === 'work_record'" class="watermark-work-record">
      <view class="work-title">{{ title || '' }}</view>
      <view class="work-time">{{ currentTime }}</view>
      <view class="work-name">姓名</view>
      <view class="work-location">{{ currentLocation }}</view>
    </view>

    <!-- 蓝色卡片水印 -->
    <view v-if="watermarkId === 'blue_card'" class="watermark-blue-card">
      <view class="blue-title">{{ title || '' }}</view>
      <view class="blue-time">{{ currentTime }}</view>
      <view class="blue-name">姓名</view>
      <view class="blue-date">{{ currentDate }}</view>
      <view class="blue-location">{{ currentLocation }}</view>
    </view>

    <!-- 灰色水印 -->
    <view class="watermark-mini-name">
      <view class="watermark-mini-text">{{ miniName }} 经度: {{ latitude ? latitude.toFixed(6) : '无' }}, 纬度{{ longitude ? longitude.toFixed(6) : '无' }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* 水印显示组件样式 */
.watermark-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

/* 默认水印样式 */
.watermark-bottom-left,
.watermark-mini-name {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  color: #fff;
  font-size: 28rpx;
  text-shadow: 2rpx 2rpx 4rpx rgba(0, 0, 0, 0.8);
}

.watermark-mini-name {
  bottom: 70rpx;
}

.watermark-mini-text {
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.description-text {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.date-text {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.datetime-text {
  font-size: 28rpx;
  margin-bottom: 10rpx;
}

.location-text {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  margin-bottom: 5rpx;
}

.location-icon {
  width: 24rpx;
  height: 24rpx;
  margin-right: 8rpx;
}

.location-text-content {
  flex: 1;
}

/* 工程记录水印样式 */
.watermark-engineering {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: linear-gradient(135deg, #4A90E2, #357ABD);
  color: #fff;
  padding: 20rpx 30rpx;
  border-radius: 15rpx;
  font-size: 26rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.engineering-header {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.engineering-time,
.engineering-date,
.engineering-location {
  font-size: 24rpx;
  margin-bottom: 5rpx;
  opacity: 0.9;
}

/* 时间卡片水印样式 */
.watermark-time-card {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 25rpx 35rpx;
  border-radius: 20rpx;
  font-size: 28rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.2);
}

.time-card-time {
  font-size: 48rpx;
  font-weight: bold;
  color: #2C3E50;
  margin-bottom: 8rpx;
}

.time-card-name {
  font-size: 32rpx;
  color: #3498DB;
  margin-bottom: 8rpx;
}

.time-card-date,
.time-card-location {
  font-size: 24rpx;
  color: #7F8C8D;
  margin-bottom: 5rpx;
}

/* 环境治理水印样式 */
.watermark-environment {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: linear-gradient(135deg, #27AE60, #2ECC71);
  color: #fff;
  padding: 20rpx 30rpx;
  border-radius: 15rpx;
  font-size: 26rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.env-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.env-datetime,
.env-location,
.env-detail {
  font-size: 24rpx;
  margin-bottom: 5rpx;
  opacity: 0.9;
}

/* 简约时间水印样式 */
.watermark-simple-time {
  position: absolute;
  bottom: 150rpx;
  right: 30rpx;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 20rpx 25rpx;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: right;
}

.simple-time {
  font-size: 42rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.simple-name,
.simple-location {
  font-size: 24rpx;
  margin-bottom: 5rpx;
  opacity: 0.9;
}

/* 温度显示水印样式 */
.watermark-temperature {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: linear-gradient(135deg, #E67E22, #F39C12);
  color: #fff;
  padding: 20rpx 30rpx;
  border-radius: 15rpx;
  font-size: 26rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.3);
}

.temp-time {
  font-size: 38rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.temp-date,
.temp-location {
  font-size: 24rpx;
  margin-bottom: 5rpx;
  opacity: 0.9;
}

/* 工作记录水印样式 */
.watermark-work-record {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #2C3E50;
  padding: 25rpx 35rpx;
  border-radius: 18rpx;
  font-size: 26rpx;
  box-shadow: 0 6rpx 20rpx rgba(0, 0, 0, 0.25);
  border-left: 8rpx solid #3498DB;
}

.work-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #3498DB;
  margin-bottom: 10rpx;
}

.work-time {
  font-size: 36rpx;
  font-weight: bold;
  color: #2C3E50;
  margin-bottom: 8rpx;
}

.work-name,
.work-location {
  font-size: 24rpx;
  color: #7F8C8D;
  margin-bottom: 5rpx;
}

/* 蓝色卡片水印样式 */
.watermark-blue-card {
  position: absolute;
  bottom: 150rpx;
  left: 30rpx;
  background: linear-gradient(135deg, #3498DB, #2980B9);
  color: #fff;
  padding: 25rpx 35rpx;
  border-radius: 20rpx;
  font-size: 26rpx;
  box-shadow: 0 6rpx 20rpx rgba(52, 152, 219, 0.4);
}

.blue-title {
  font-size: 28rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
  opacity: 0.9;
}

.blue-time {
  font-size: 42rpx;
  font-weight: bold;
  margin-bottom: 8rpx;
}

.blue-name {
  font-size: 32rpx;
  margin-bottom: 8rpx;
}

.blue-date,
.blue-location {
  font-size: 24rpx;
  margin-bottom: 5rpx;
  opacity: 0.9;
}
</style>
