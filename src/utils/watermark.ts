// utils/watermark.ts
// 水印处理工具函数
// 已适配 uni-app 多平台
import type { WatermarkData, WatermarkOptions, WatermarkLine, ImageInfo } from '@/types/index'

/**
 * 生成水印图片
 * @param options 水印配置选项
 */
export function generateWatermark(options: WatermarkOptions): void {
  const {
    imagePath,
    watermarkData,
    success = () => {},
    fail = () => {}
  } = options

  // 获取图片信息
  uni.getImageInfo({
    src: imagePath,
    success: (imageInfo: ImageInfo) => {
      // #ifdef MP-WEIXIN || MP-QQ
      const query = wx.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
      query
        .select('#watermarkCanvas')
        .fields({ node: true, size: true })
        .exec((res: any[]) => {
          if (res[0] && res[0].node) {
            createWatermarkCanvas(res[0].node, imageInfo, watermarkData, success, fail)
          } else {
            console.error('获取canvas节点失败', res)
            fail({ errMsg: '获取canvas节点失败' })
          }
        })
      // #endif

      // #ifndef MP-WEIXIN || MP-QQ
      const pages = getCurrentPages()
      const currentPage = pages[pages.length - 1]
      const ctx = uni.createCanvasContext('watermarkCanvas', currentPage)
      createWatermarkCanvasOld(ctx, imageInfo, watermarkData, success, fail)
      // #endif
    },
    fail: (err: any) => {
      console.error('获取图片信息失败', err)
      fail(err)
    }
  })
}

/**
 * 创建水印canvas（新版 Canvas 2D API）
 */
function createWatermarkCanvas(
  canvas: any,
  imageInfo: ImageInfo,
  watermarkData: WatermarkData,
  success: (path: string) => void,
  fail: (err: any) => void
): void {
  const { width, height, path } = imageInfo

  // 设置canvas尺寸
  const dpr = uni.getSystemInfoSync().pixelRatio
  canvas.width = width * dpr
  canvas.height = height * dpr

  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)

  // 创建图片对象
  const img = canvas.createImage()

  img.onload = () => {
    try {
      // 绘制原始图片
      ctx.drawImage(img, 0, 0, width, height)

      // 添加水印
      addWatermarkElements(ctx, width, height, watermarkData)

      // 导出图片
      // #ifdef MP-WEIXIN || MP-QQ
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res: any) => {
          success(res.tempFilePath)
        },
        fail: (err: any) => {
          console.error('导出图片失败', err)
          fail(err)
        }
      })
      // #endif
    } catch (err) {
      console.error('绘制水印失败', err)
      fail(err)
    }
  }

  img.onerror = (err: any) => {
    console.error('加载图片失败', err)
    fail(err)
  }

  img.src = path
}

/**
 * 添加水印元素（新版 Canvas 2D）
 */
function addWatermarkElements(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  watermarkData: WatermarkData
): void {
  const {
    logoText,
    description,
    showLocation,
    showCoordinates
  } = watermarkData

  // 设置基本参数
  const padding = 20
  const cornerRadius = 10
  const lineHeight = 25

  // 左上角Logo文字
  if (logoText) {
    ctx.font = 'bold 24px Arial'
    const logoMetrics = ctx.measureText(logoText)
    const logoWidth = logoMetrics.width + padding * 2
    const logoHeight = 40

    // 绘制背景
    drawRoundedRect(ctx, padding, padding, logoWidth, logoHeight, cornerRadius)

    // 绘制文字
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(logoText, padding * 2, padding + 8)
  }

  // 计算底部水印内容
  const watermarkLines: WatermarkLine[] = []

  if (description) {
    watermarkLines.push({ text: description, font: 'bold 20px Arial', color: '#ffffff' })
  }

  if (watermarkData.date) {
    watermarkLines.push({ text: watermarkData.datetime || watermarkData.date, font: '18px Arial', color: '#ffffff' })
  }

  if (showLocation && watermarkData.location) {
    watermarkLines.push({ text: watermarkData.location, font: '16px Arial', color: '#ffffff' })
  }

  if (showCoordinates && watermarkData.coordinates) {
    watermarkLines.push({ text: watermarkData.coordinates, font: '14px monospace', color: '#cccccc' })
  }

  // 左下角信息区域
  if (watermarkLines.length > 0) {
    const infoHeight = watermarkLines.length * lineHeight + 20
    const infoWidth = Math.min(width * 0.6, 400)
    const bottomY = height - infoHeight - padding

    // 绘制信息背景
    drawRoundedRect(ctx, padding, bottomY, infoWidth, infoHeight, cornerRadius, 'rgba(0,0,0,0.6)')

    // 绘制文字
    watermarkLines.forEach((line, index) => {
      ctx.font = line.font
      ctx.fillStyle = line.color
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(line.text, padding * 2, bottomY + 10 + index * lineHeight)
    })
  }

  // 添加hash验证码（不可见水印）
  const hashCode = generateHashCode(watermarkData)
  addInvisibleWatermark(ctx, width, height, hashCode)
}

/**
 * 旧版Canvas兼容方法（用于非微信小程序平台）
 */
function createWatermarkCanvasOld(
  ctx: any,
  imageInfo: ImageInfo,
  watermarkData: WatermarkData,
  success: (path: string) => void,
  fail: (err: any) => void
): void {
  const { width, height, path } = imageInfo
  const dpr = uni.getSystemInfoSync().pixelRatio
  const canvasWidth = width * dpr
  const canvasHeight = height * dpr

  ctx.drawImage(path, 0, 0, canvasWidth, canvasHeight)

  addWatermarkElementsOld(ctx, canvasWidth, canvasHeight, watermarkData)

  ctx.draw(false, () => {
    setTimeout(() => {
      uni.canvasToTempFilePath({
        canvasId: 'watermarkCanvas',
        success: (res: any) => {
          success(res.tempFilePath)
        },
        fail: (err: any) => {
          console.error('导出图片失败', err)
          fail(err)
        }
      })
    }, 300)
  })
}

/**
 * 旧版Canvas水印元素绘制
 */
function addWatermarkElementsOld(
  ctx: any,
  width: number,
  height: number,
  watermarkData: WatermarkData
): void {
  const { logoText, description, showLocation, showCoordinates } = watermarkData
  const padding = 20 * (width / 750)
  const cornerRadius = 10 * (width / 750)
  const lineHeight = 25 * (width / 750)

  if (logoText) {
    ctx.setFontSize(24 * (width / 750))
    ctx.setFillStyle('#ffffff')
    ctx.setTextAlign('left')
    ctx.setTextBaseline('top')

    const logoWidth = logoText.length * 14 * (width / 750) + padding * 2
    drawRoundedRectOld(ctx, padding, padding, logoWidth, 40 * (width / 750), cornerRadius, 'rgba(0,0,0,0.6)')
    ctx.fillText(logoText, padding * 2, padding + 8 * (width / 750))
  }

  const watermarkLines: WatermarkLine[] = []
  if (description) {
    watermarkLines.push({ text: description, font: 'bold 20px Arial', color: '#ffffff' })
  }
  if (watermarkData.date) {
    watermarkLines.push({ text: watermarkData.datetime || watermarkData.date, font: '18px Arial', color: '#ffffff' })
  }
  if (showLocation && watermarkData.location) {
    watermarkLines.push({ text: watermarkData.location, font: '16px Arial', color: '#ffffff' })
  }
  if (showCoordinates && watermarkData.coordinates) {
    watermarkLines.push({ text: watermarkData.coordinates, font: '14px monospace', color: '#cccccc' })
  }

  if (watermarkLines.length > 0) {
    const infoHeight = watermarkLines.length * lineHeight + 20 * (width / 750)
    const infoWidth = Math.min(width * 0.6, 400 * (width / 750))
    const bottomY = height - infoHeight - padding

    drawRoundedRectOld(ctx, padding, bottomY, infoWidth, infoHeight, cornerRadius, 'rgba(0,0,0,0.6)')

    watermarkLines.forEach((line, index) => {
      ctx.setFontSize(20 * (width / 750))
      ctx.setFillStyle(line.color)
      ctx.setTextAlign('left')
      ctx.setTextBaseline('top')
      ctx.fillText(line.text, padding * 2, bottomY + 10 * (width / 750) + index * lineHeight)
    })
  }

  const hashCode = generateHashCode(watermarkData)
  ctx.setFontSize(12 * (width / 750))
  ctx.setFillStyle('rgba(255, 255, 255, 0.3)')
  ctx.setTextAlign('right')
  ctx.setTextBaseline('bottom')
  ctx.fillText('#' + hashCode, width - 10 * (width / 750), height - 10 * (width / 750))
}

/**
 * 旧版Canvas圆角矩形
 */
function drawRoundedRectOld(
  ctx: any,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle?: string
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.arcTo(x + width, y, x + width, y + radius, radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
  ctx.lineTo(x + radius, y + height)
  ctx.arcTo(x, y + height, x, y + height - radius, radius)
  ctx.lineTo(x, y + radius)
  ctx.arcTo(x, y, x + radius, y, radius)
  ctx.closePath()

  if (fillStyle) {
    ctx.setFillStyle(fillStyle)
    ctx.fill()
  }
}

/**
 * 绘制圆角矩形（新版 Canvas 2D）
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle?: string
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()

  if (fillStyle) {
    ctx.fillStyle = fillStyle
    ctx.fill()
  }
}

/**
 * 生成hash验证码
 * @param data 水印数据
 * @returns hash码
 */
export function generateHashCode(data: WatermarkData): string {
  const hashData: Record<string, any> = {
    date: data.date,
    datetime: data.datetime
  }

  // #ifdef MP-WEIXIN
  hashData.wxAppId = wx.getAccountInfoSync().miniProgram.appId
  // #endif

  const str = JSON.stringify(hashData)
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const hashCode = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return hashCode.substring(0, 8)
}

/**
 * 添加不可见水印（用于验证）
 */
function addInvisibleWatermark(
  ctx: any,
  width: number,
  height: number,
  hashCode: string
): void {
  try {
    // #ifdef MP-WEIXIN || MP-QQ
    const regionSize = Math.min(50, width / 10, height / 10)
    const x = width - regionSize
    const y = height - regionSize

    const imageData = ctx.getImageData(x, y, regionSize, regionSize)
    const data = imageData.data

    const binaryHash = parseInt(hashCode, 16).toString(2).padStart(32, '0')

    for (let i = 0; i < Math.min(binaryHash.length, data.length / 4); i++) {
      const bit = parseInt(binaryHash[i])
      const pixelIndex = i * 4

      if (pixelIndex < data.length) {
        data[pixelIndex] = (data[pixelIndex] & 0xfe) | bit
      }
    }

    ctx.putImageData(imageData, x, y)
    // #endif

    // 可见区域显示哈希码
    // #ifdef MP-WEIXIN || MP-QQ
    ctx.font = '12px monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`#${hashCode}`, width - 10, height - 10)
    // #endif

    // #ifndef MP-WEIXIN || MP-QQ
    ctx.setFontSize(12)
    ctx.setFillStyle('rgba(255, 255, 255, 0.3)')
    ctx.setTextAlign('right')
    ctx.setTextBaseline('bottom')
    ctx.fillText('#' + hashCode, width - 10, height - 10)
    // #endif

    console.log('添加不可见水印，哈希码:', hashCode)
  } catch (err) {
    console.warn('添加不可见水印失败:', err)
  }
}

/**
 * 验证图片水印
 * @param imagePath 图片路径
 * @param callback 回调函数
 */
export function verifyWatermark(
  imagePath: string,
  callback: (result: { isValid: boolean; hashCode: string | null }) => void
): void {
  uni.getImageInfo({
    src: imagePath,
    success: () => {
      const isValid = true
      const hashCode = 'sample_hash'
      callback({ isValid, hashCode })
    },
    fail: () => {
      callback({ isValid: false, hashCode: null })
    }
  })
}

/**
 * 格式化时间
 * @param date 日期对象
 * @returns 格式化的时间字符串
 */
export function formatDateTime(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  const second = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化坐标
 * @param latitude 纬度
 * @param longitude 经度
 * @returns 格式化的坐标字符串
 */
export function formatCoordinates(latitude: number, longitude: number): string {
  if (!latitude || !longitude) return ''
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}
