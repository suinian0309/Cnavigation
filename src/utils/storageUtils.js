/**
 * 存储工具函数
 * 用于优化本地存储，包括压缩和解压缩功能
 */

/**
 * 压缩数据
 * @param {Object|Array|String} data - 要压缩的数据
 * @returns {String} - 压缩后的字符串
 */
export const compressData = (data) => {
  try {
    // 将数据转换为 JSON 字符串
    const jsonString = JSON.stringify(data);
    
    // 简单的数据压缩 - 对于小型数据，我们不做复杂压缩
    // 对于大型数据，可以考虑使用 LZString 等库进行压缩
    if (jsonString.length < 1024) {
      return jsonString;
    }
    
    // 这里可以添加更复杂的压缩算法
    // 例如使用 LZString 库: return LZString.compress(jsonString);
    // 但为了避免引入额外依赖，我们这里使用简单的 Base64 编码
    return btoa(encodeURIComponent(jsonString));
  } catch (error) {
    console.error('数据压缩失败:', error);
    return JSON.stringify(data);
  }
};

/**
 * 解压缩数据
 * @param {String} compressedData - 压缩后的字符串
 * @returns {Object|Array|String} - 解压缩后的数据
 */
export const decompressData = (compressedData) => {
  try {
    // 检查是否是压缩数据
    if (compressedData.startsWith('{') || compressedData.startsWith('[')) {
      return JSON.parse(compressedData);
    }
    
    // 解压缩数据
    // 如果使用了 LZString: return JSON.parse(LZString.decompress(compressedData));
    // 对于 Base64 编码
    return JSON.parse(decodeURIComponent(atob(compressedData)));
  } catch (error) {
    console.error('数据解压缩失败:', error);
    try {
      return JSON.parse(compressedData);
    } catch {
      return compressedData;
    }
  }
};

/**
 * 优化存储 - 根据数据大小决定是否压缩
 * @param {String} key - 存储键名
 * @param {Object|Array|String} data - 要存储的数据
 */
export const setOptimizedStorage = (key, data) => {
  try {
    const jsonString = JSON.stringify(data);
    
    // 如果数据较小，直接存储
    if (jsonString.length < 1024) {
      localStorage.setItem(key, jsonString);
      return;
    }
    
    // 数据较大，进行压缩
    const compressed = compressData(data);
    localStorage.setItem(key, compressed);
    
    // 添加标记表示这是压缩数据
    localStorage.setItem(`${key}_compressed`, 'true');
  } catch (error) {
    console.error(`存储数据 ${key} 失败:`, error);
  }
};

/**
 * 获取优化存储的数据
 * @param {String} key - 存储键名
 * @param {*} defaultValue - 默认值
 * @returns {Object|Array|String} - 获取的数据
 */
export const getOptimizedStorage = (key, defaultValue = null) => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    
    // 检查是否是压缩数据
    const isCompressed = localStorage.getItem(`${key}_compressed`) === 'true';
    
    if (isCompressed) {
      return decompressData(data);
    }
    
    return JSON.parse(data);
  } catch (error) {
    console.error(`获取数据 ${key} 失败:`, error);
    return defaultValue;
  }
}; 