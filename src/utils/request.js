import axios from "axios";

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

export default service;