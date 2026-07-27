/// <reference types="@dcloudio/types" />

// Vue 3 类型声明
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// 微信小程序全局变量声明（在条件编译 #ifdef MP-WEIXIN 内使用）
declare const wx: any
// 钉钉小程序全局变量声明
declare const dd: any
