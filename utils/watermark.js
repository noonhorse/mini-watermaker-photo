// utils/watermark.js
// 水印处理工具函数

/**
 * 生成水印图片
 * @param {Object} options 水印配置选项
 * @param {string} options.imagePath 原始图片路径
 * @param {Object} options.watermarkData 水印数据
 * @param {Function} options.success 成功回调
 * @param {Function} options.fail 失败回调
 */
function generateWatermark(options) {
  const {
    imagePath,
    watermarkData,
    success = () => {},
    fail = () => {}
  } = options

  // 获取图片信息
  wx.getImageInfo({
    src: imagePath,
    success: (imageInfo) => {
      // 获取canvas节点
      const query = wx.createSelectorQuery().in(getCurrentPages()[getCurrentPages().length - 1])
      query.select('#watermarkCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res[0] && res[0].node) {
            createWatermarkCanvas(res[0].node, imageInfo, watermarkData, success, fail)
          } else {
            console.error('获取canvas节点失败', res)
            fail({ errMsg: '获取canvas节点失败' })
          }
        })
    },
    fail: (err) => {
      console.error('获取图片信息失败', err)
      fail(err)
    }
  })
}

/**
 * 创建水印canvas
 * @param {Object} canvas canvas节点
 * @param {Object} imageInfo 图片信息
 * @param {Object} watermarkData 水印数据
 * @param {Function} success 成功回调
 * @param {Function} fail 失败回调
 */
function createWatermarkCanvas(canvas, imageInfo, watermarkData, success, fail) {
  const { width, height, path } = imageInfo
  
  // 设置canvas尺寸
  const dpr = wx.getSystemInfoSync().pixelRatio
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
      wx.canvasToTempFilePath({
        canvas: canvas,
        success: (res) => {
          success(res.tempFilePath)
        },
        fail: (err) => {
          console.error('导出图片失败', err)
          fail(err)
        }
      })
    } catch (err) {
      console.error('绘制水印失败', err)
      fail(err)
    }
  }
  
  img.onerror = (err) => {
    console.error('加载图片失败', err)
    fail(err)
  }
  
  img.src = path
}

/**
 * 添加水印元素
 * @param {CanvasRenderingContext2D} ctx canvas上下文
 * @param {number} width 画布宽度
 * @param {number} height 画布高度
 * @param {Object} watermarkData 水印数据
 */
function addWatermarkElements(ctx, width, height, watermarkData) {
  const {
    logoText,
    description,
    showAddress,
    showCoordinates,
    currentTime,
    location
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
    drawRoundedRect(ctx, padding, padding, logoWidth, logoHeight, cornerRadius, 'rgba(0,0,0,0.6)')
    
    // 绘制文字
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(logoText, padding * 2, padding + 8)
  }
  
  // 计算底部水印内容
  const watermarkLines = []
  
  if (description) {
    watermarkLines.push({ text: description, font: 'bold 20px Arial', color: '#ffffff' })
  }
  
  if (currentTime) {
    const timeText = formatDateTime(currentTime)
    watermarkLines.push({ text: timeText, font: '18px Arial', color: '#ffffff' })
  }
  
  if (showAddress && location && location.address) {
    watermarkLines.push({ text: `📍 ${location.address}`, font: '16px Arial', color: '#ffffff' })
  }
  
  if (showCoordinates && location && location.latitude && location.longitude) {
    const coordText = formatCoordinates(location.latitude, location.longitude)
    watermarkLines.push({ text: coordText, font: '14px monospace', color: '#cccccc' })
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
 * 绘制圆角矩形
 * @param {CanvasRenderingContext2D} ctx canvas上下文
 * @param {number} x x坐标
 * @param {number} y y坐标
 * @param {number} width 宽度
 * @param {number} height 高度
 * @param {number} radius 圆角半径
 * @param {string} fillStyle 填充样式
 */
function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
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
 * @param {Object} data 水印数据
 * @returns {string} hash码
 */
function generateHashCode(data) {
  // 创建包含时间戳的唯一数据
  const hashData = {
    ...data,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(2)
  }
  
  const str = JSON.stringify(hashData)
  let hash = 0
  
  // 使用更复杂的哈希算法
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  // 生成8位哈希码
  const hashCode = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
  return hashCode.substring(0, 8)
}

/**
 * 添加不可见水印（用于验证）
 * @param {CanvasRenderingContext2D} ctx canvas上下文
 * @param {number} width 画布宽度
 * @param {number} height 画布高度
 * @param {string} hashCode hash码
 */
function addInvisibleWatermark(ctx, width, height, hashCode) {
  try {
    // 在图片的右下角添加极小的不可见标记
    const regionSize = Math.min(50, width / 10, height / 10)
    const x = width - regionSize
    const y = height - regionSize
    
    const imageData = ctx.getImageData(x, y, regionSize, regionSize)
    const data = imageData.data
    
    // 将哈希码转换为二进制并嵌入到像素中
    const binaryHash = parseInt(hashCode, 16).toString(2).padStart(32, '0')
    
    for (let i = 0; i < Math.min(binaryHash.length, data.length / 4); i++) {
      const bit = parseInt(binaryHash[i])
      const pixelIndex = i * 4
      
      // 修改红色通道的最低位
      if (pixelIndex < data.length) {
        data[pixelIndex] = (data[pixelIndex] & 0xFE) | bit
      }
    }
    
    ctx.putImageData(imageData, x, y)
    
    // 在可见区域显示哈希码（用于验证）
    ctx.font = '12px monospace'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(`#${hashCode}`, width - 10, height - 10)
    
    console.log('添加不可见水印，哈希码:', hashCode)
  } catch (err) {
    console.warn('添加不可见水印失败:', err)
  }
}

/**
 * 验证图片水印
 * @param {string} imagePath 图片路径
 * @param {Function} callback 回调函数
 */
function verifyWatermark(imagePath, callback) {
  // 这里应该实现水印验证逻辑
  // 由于微信小程序的限制，这里只是示例
  wx.getImageInfo({
    src: imagePath,
    success: (res) => {
      // 模拟验证结果
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
 * @param {Date} date 日期对象
 * @returns {string} 格式化的时间字符串
 */
function formatDateTime(date = new Date()) {
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
 * @param {number} latitude 纬度
 * @param {number} longitude 经度
 * @returns {string} 格式化的坐标字符串
 */
function formatCoordinates(latitude, longitude) {
  if (!latitude || !longitude) return ''
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

module.exports = {
  generateWatermark,
  verifyWatermark,
  generateHashCode,
  formatDateTime,
  formatCoordinates
}