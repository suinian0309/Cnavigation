import axios from "axios";
import { cacheApiCall } from "./apiCache";

// 创建axios实例
const service = axios.create({
  timeout: 30000,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
  }
});

// 响应拦截
service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("请求失败，请稍后重试:" + error);
    return Promise.reject(error);
  },
);

/**
 * 发送请求
 * @param {Object} config - axios 配置
 * @param {Object} cacheOptions - 缓存选项
 * @returns {Promise<Object>} - 响应数据
 */
const request = async (config, cacheOptions = null) => {
  // 如果不需要缓存，直接发送请求
  if (!cacheOptions) {
    return service(config);
  }
  
  // 使用缓存
  return cacheApiCall(
    () => service(config),
    {
      url: config.url,
      params: config.params || {},
      ...cacheOptions
    }
  );
};

export default request;