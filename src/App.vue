<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'

onLaunch(() => {
  console.log('App Launch')

  // 展示本地存储能力
  const logs = uni.getStorageSync('logs') || []
  logs.unshift(Date.now())
  uni.setStorageSync('logs', logs)

  // 登录
  // #ifdef MP-WEIXIN
  wx.login({
    success: (res: any) => {
      console.log('登录成功', res.code)
    }
  })
  // #endif

  // #ifdef MP-DINGTALK
  dd.getAuthCode({
    success: (res: any) => {
      console.log('钉钉登录成功', res.authCode)
    }
  })
  // #endif

  // #ifdef MP-LARK
  uni.login({
    success: (res: any) => {
      console.log('飞书登录成功', res.code)
    }
  })
  // #endif
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import './uni.scss';

/* 全局样式 */
page {
  height: 100%;
  background: #000;
}

/* 通用按钮样式 */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 40rpx;
  border-radius: 10rpx;
  font-size: 28rpx;
  color: #fff;
  background: linear-gradient(45deg, #007aff, #5ac8fa);
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 122, 255, 0.3);
}

.btn:active {
  transform: scale(0.95);
  opacity: 0.8;
}

.btn-disabled {
  background: #ccc;
  color: #999;
  box-shadow: none;
}

/* 图标样式 */
.icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}

/* 文本样式 */
.text-primary {
  color: #007aff;
}

.text-secondary {
  color: #666;
}

.text-white {
  color: #fff;
}

.text-center {
  text-align: center;
}

/* 布局样式 */
.flex {
  display: flex;
}

.flex-column {
  flex-direction: column;
}

.flex-center {
  align-items: center;
  justify-content: center;
}

.flex-between {
  justify-content: space-between;
}

.flex-around {
  justify-content: space-around;
}

/* 间距样式 */
.m-10 { margin: 10rpx; }
.m-20 { margin: 20rpx; }
.mt-10 { margin-top: 10rpx; }
.mt-20 { margin-top: 20rpx; }
.mb-10 { margin-bottom: 10rpx; }
.mb-20 { margin-bottom: 20rpx; }
.ml-10 { margin-left: 10rpx; }
.ml-20 { margin-left: 20rpx; }
.mr-10 { margin-right: 10rpx; }
.mr-20 { margin-right: 20rpx; }

.p-10 { padding: 10rpx; }
.p-20 { padding: 20rpx; }
.pt-10 { padding-top: 10rpx; }
.pt-20 { padding-top: 20rpx; }
.pb-10 { padding-bottom: 10rpx; }
.pb-20 { padding-bottom: 20rpx; }
.pl-10 { padding-left: 10rpx; }
.pl-20 { padding-left: 20rpx; }
.pr-10 { padding-right: 10rpx; }
.pr-20 { padding-right: 20rpx; }
</style>
