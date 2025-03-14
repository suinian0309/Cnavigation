/**
 * API 缓存工具
 * 用于优化 API 请求，减少不必要的网络请求
 */

// 默认缓存时间（毫秒）
const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5分钟

/**
 * 生成缓存键
 * @param {String} url - API 地址
 * @param {Object} params - 请求参数
 * @returns {String} - 缓存键
 */
const generateCacheKey = (url, params = {}) => {
  const paramString = Object.keys(params)
    .sort()
    .map(key => `${key}=${JSON.stringify(params[key])}`)
    .join('&');
  
  return `api_cache_${url}${paramString ? `_${paramString}` : ''}`;
};

/**
 * 获取缓存数据
 * @param {String} key - 缓存键
 * @returns {Object|null} - 缓存数据或 null
 */
const getCache = (key) => {
  const cachedData = localStorage.getItem(key);
  if (!cachedData) return null;
  
  try {
    const { data, timestamp, expireTime } = JSON.parse(cachedData);
    // 检查缓存是否过期
    if (Date.now() - timestamp < expireTime) {
      return data;
    }
    return null;
  } catch (error) {
    console.error("解析 API 缓存失败:", error);
    return null;
  }
};

/**
 * 设置缓存数据
 * @param {String} key - 缓存键
 * @param {Object} data - 缓存数据
 * @param {Number} expireTime - 过期时间（毫秒）
 */
const setCache = (key, data, expireTime = DEFAULT_CACHE_TIME) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      data,
      timestamp: Date.now(),
      expireTime
    }));
  } catch (error) {
    console.error("设置 API 缓存失败:", error);
  }
};

/**
 * 清除指定前缀的所有缓存
 * @param {String} prefix - 缓存键前缀
 */
export const clearCacheByPrefix = (prefix = 'api_cache_') => {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * 缓存 API 请求
 * @param {Function} apiCall - API 请求函数
 * @param {Object} options - 缓存选项
 * @returns {Promise<Object>} - API 响应数据
 */
export const cacheApiCall = async (apiCall, options = {}) => {
  const {
    url,
    params = {},
    expireTime = DEFAULT_CACHE_TIME,
    forceRefresh = false,
    useStaleCache = true
  } = options;
  
  // 生成缓存键
  const cacheKey = generateCacheKey(url, params);
  
  // 如果不强制刷新，尝试从缓存获取
  if (!forceRefresh) {
    const cachedData = getCache(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }
  
  // 缓存不存在或已过期，发起网络请求
  try {
    const data = await apiCall();
    
    // 更新缓存
    setCache(cacheKey, data, expireTime);
    
    return data;
  } catch (error) {
    console.error(`API 请求失败 (${url}):`, error);
    
    // 如果请求失败且允许使用过期缓存
    if (useStaleCache) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data } = JSON.parse(cachedData);
          return data;
        } catch (e) {
          // 忽略解析错误
        }
      }
    }
    
    // 重新抛出错误
    throw error;
  }
}; 