/**
 * MD5 哈希算法实现
 * 基于RFC 1321标准
 */

/**
 * 将字符串转换为UTF-8字节数组
 * @param {string} str 输入字符串
 * @returns {Array} UTF-8字节数组
 */
function stringToUtf8Bytes(str) {
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      // 代理对
      i++;
      const hi = code;
      const lo = str.charCodeAt(i);
      const codePoint = 0x10000 + (((hi & 0x3ff) << 10) | (lo & 0x3ff));
      bytes.push(0xf0 | (codePoint >> 18));
      bytes.push(0x80 | ((codePoint >> 12) & 0x3f));
      bytes.push(0x80 | ((codePoint >> 6) & 0x3f));
      bytes.push(0x80 | (codePoint & 0x3f));
    }
  }
  return bytes;
}

/**
 * 左旋转操作
 * @param {number} value 要旋转的值
 * @param {number} amount 旋转位数
 * @returns {number} 旋转后的值
 */
function leftRotate(value, amount) {
  return (value << amount) | (value >>> (32 - amount));
}

/**
 * MD5辅助函数F
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function md5F(x, y, z) {
  return (x & y) | ((~x) & z);
}

/**
 * MD5辅助函数G
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function md5G(x, y, z) {
  return (x & z) | (y & (~z));
}

/**
 * MD5辅助函数H
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function md5H(x, y, z) {
  return x ^ y ^ z;
}

/**
 * MD5辅助函数I
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @returns {number}
 */
function md5I(x, y, z) {
  return y ^ (x | (~z));
}

/**
 * MD5核心计算函数
 * @param {Array} message 消息字节数组
 * @returns {Array} MD5哈希值（4个32位整数）
 */
function md5Core(message) {
  // 初始化MD5缓冲区
  let h0 = 0x67452301;
  let h1 = 0xEFCDAB89;
  let h2 = 0x98BADCFE;
  let h3 = 0x10325476;

  // 预处理：添加填充位
  const originalLength = message.length;
  message.push(0x80); // 添加1位

  // 填充0直到长度≡448 (mod 512)
  while (message.length % 64 !== 56) {
    message.push(0);
  }

  // 添加原始长度（以位为单位）
  const bitLength = originalLength * 8;
  for (let i = 0; i < 8; i++) {
    message.push((bitLength >>> (i * 8)) & 0xFF);
  }

  // 处理512位块
  for (let offset = 0; offset < message.length; offset += 64) {
    // 将64字节块转换为16个32位字
    const w = [];
    for (let i = 0; i < 16; i++) {
      w[i] = message[offset + i * 4] |
             (message[offset + i * 4 + 1] << 8) |
             (message[offset + i * 4 + 2] << 16) |
             (message[offset + i * 4 + 3] << 24);
    }

    // 初始化此块的哈希值
    let a = h0, b = h1, c = h2, d = h3;

    // 主循环
    for (let i = 0; i < 64; i++) {
      let f, g;
      if (i < 16) {
        f = md5F(b, c, d);
        g = i;
      } else if (i < 32) {
        f = md5G(b, c, d);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        f = md5H(b, c, d);
        g = (3 * i + 5) % 16;
      } else {
        f = md5I(b, c, d);
        g = (7 * i) % 16;
      }

      // MD5常数表
      const k = [
        0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee,
        0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
        0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be,
        0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
        0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa,
        0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
        0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed,
        0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
        0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c,
        0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
        0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05,
        0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
        0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039,
        0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
        0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1,
        0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
      ];

      // 旋转量表
      const s = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
      ];

      const temp = d;
      d = c;
      c = b;
      b = (b + leftRotate((a + f + k[i] + w[g]) >>> 0, s[i])) >>> 0;
      a = temp;
    }

    // 添加此块的哈希到结果
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
  }

  return [h0, h1, h2, h3];
}

/**
 * 将32位整数转换为小端字节序的十六进制字符串
 * @param {number} value 32位整数
 * @returns {string} 8位十六进制字符串
 */
function toHexString(value) {
  const hex = value.toString(16).padStart(8, '0');
  // 转换为小端字节序
  return hex.substr(6, 2) + hex.substr(4, 2) + hex.substr(2, 2) + hex.substr(0, 2);
}

/**
 * 计算字符串的MD5哈希值
 * @param {string} input 输入字符串
 * @returns {string} MD5哈希值（32位十六进制字符串）
 */
function md5(input) {
  if (typeof input !== 'string') {
    throw new Error('Input must be a string');
  }

  const bytes = stringToUtf8Bytes(input);
  const hash = md5Core(bytes);
  
  return hash.map(toHexString).join('');
}

/**
 * 计算文件内容的MD5哈希值（用于小程序环境）
 * @param {ArrayBuffer} buffer 文件内容的ArrayBuffer
 * @returns {string} MD5哈希值（32位十六进制字符串）
 */
function md5FromBuffer(buffer) {
  if (!(buffer instanceof ArrayBuffer)) {
    throw new Error('Input must be an ArrayBuffer');
  }

  const bytes = Array.from(new Uint8Array(buffer));
  const hash = md5Core(bytes);
  
  return hash.map(toHexString).join('');
}

module.exports = {
  md5,
  md5FromBuffer
};