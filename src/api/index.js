import request from "@/utils/request";
import axios from 'axios';
import { cacheApiCall } from "@/utils/apiCache";
// 移除不存在的工具栏接口导入
import defaultShortcut from "@/assets/defaultShortCut.json";

// 一言 API 地址
const HITOKOTO_API = 'https://v1.hitokoto.cn/';
// 一言缓存时间（毫秒）
const HITOKOTO_CACHE_TIME = 30 * 60 * 1000; // 30分钟

/**
 * 获取搜索建议
 * @param {String} keyWord - 搜索关键字
 */
export const getSearchSuggestions = async (keyWord) => {
  // 直接从历史记录中筛选
  const siteData = JSON.parse(localStorage.getItem('siteData') || '{"searchHistory":[]}');
  const history = siteData.searchHistory || [];
  return history.filter(item => 
    item.toLowerCase().includes(keyWord.toLowerCase())
  );
};

/**
 * 获取一言
 * @param {Boolean} forceRefresh - 是否强制刷新，忽略缓存
 */
export const getHitokoto = async (forceRefresh = false) => {
  return cacheApiCall(
    async () => {
      const response = await axios.get(HITOKOTO_API);
      return {
        content: response.data.hitokoto,
        source: response.data.from
      };
    },
    {
      url: HITOKOTO_API,
      expireTime: HITOKOTO_CACHE_TIME,
      forceRefresh,
      useStaleCache: true
    }
  ).catch(() => {
    // 如果请求失败，返回默认值
    return {
      content: "生活不止眼前的苟且，还有诗和远方。",
      source: "网络"
    };
  });
};

// 添加获取本地工具栏配置的方法
export const getUserToolbar = () => {
  return Promise.resolve(defaultShortcut);
};