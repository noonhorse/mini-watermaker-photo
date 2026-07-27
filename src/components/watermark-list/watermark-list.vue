<script setup lang="ts">
import { ref } from 'vue'
import type { WatermarkStyleItem } from '@/types/index'

const props = withDefaults(defineProps<{
  show?: boolean
}>(), {
  show: false
})

const emit = defineEmits<{
  onclose: []
  onselect: [payload: { watermarkId: string }]
}>()

const selectedId = ref('style1')

const watermarkStyles: WatermarkStyleItem[] = [
  {
    id: 'default',
    name: '默认样式',
    preview: '/static/watermark-previews/default.png'
  },
  {
    id: 'engineering',
    name: '工程记录',
    preview: '/static/watermark-previews/engineering.png'
  },
  {
    id: 'time_card',
    name: '时间卡片',
    preview: '/static/watermark-previews/time_card.png'
  },
  {
    id: 'environment',
    name: '环境治理',
    preview: '/static/watermark-previews/environment.png'
  },
  {
    id: 'simple_time',
    name: '简约时间',
    preview: '/static/watermark-previews/simple_time.png'
  },
  {
    id: 'temperature',
    name: '温度显示',
    preview: '/static/watermark-previews/temperature.png'
  },
  {
    id: 'work_record',
    name: '工作记录',
    preview: '/static/watermark-previews/work_record.png'
  },
  {
    id: 'blue_card',
    name: '蓝色卡片',
    preview: '/static/watermark-previews/blue_card.png'
  }
]

function hidePanel(): void {
  emit('onclose')
}

function onSelect(id: string): void {
  selectedId.value = id
  emit('onselect', { watermarkId: id })
  hidePanel()
}
</script>

<template>
  <view class="watermark-panel" :class="{ active: show }">
    <view class="panel-content">
      <view class="panel-header">
        <text class="panel-title">水印列表</text>
        <view class="close-btn" @click="hidePanel">×</view>
      </view>
      <scroll-view scroll-y class="watermark-scroll">
        <view class="watermark-list">
          <view
            v-for="item in watermarkStyles"
            :key="item.id"
            class="watermark-item"
            :class="{ selected: item.id === selectedId }"
            @click="onSelect(item.id)"
          >
            <image class="item-preview" :src="item.preview" mode="aspectFill"></image>
            <text class="item-name">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
/* components/watermark-list/watermark-list.vue */
.watermark-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50vh;
  background-color: rgba(0, 0, 0, 0.5);
  transform: translateY(100%);
  transition: transform 0.3s ease-in-out;
  z-index: 1000;
}

.watermark-panel.active {
  transform: translateY(0);
}

.panel-content {
  background-color: #fff;
  border-radius: 20rpx 20rpx 0 0;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 30rpx;
  border-bottom: 1rpx solid #eee;
}

.panel-title {
  font-size: 32rpx;
  font-weight: bold;
}

.close-btn {
  font-size: 40rpx;
  color: #999;
  cursor: pointer;
}

.watermark-scroll {
  flex: 1;
  height: 100%;
}

.watermark-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  padding: 20rpx;
}

.watermark-item {
  border: 1rpx solid #eee;
  border-radius: 10rpx;
  padding: 10rpx;
  text-align: center;
  transition: border-color 0.2s;
}

.watermark-item.selected {
  border-color: #007aff;
}

.item-preview {
  width: 100%;
  height: 200rpx;
  background-color: #f0f0f0;
  border-radius: 5rpx;
}

.item-name {
  font-size: 28rpx;
  margin-top: 10rpx;
  color: #333;
}
</style>
