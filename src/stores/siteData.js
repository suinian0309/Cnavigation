import { defineStore } from "pinia";
import defaultShortCut from "@/assets/defaultShortCut";
import { getOptimizedStorage, setOptimizedStorage } from "@/utils/storageUtils";

// 快捷方式数据的存储键名
const SHORTCUT_DATA_KEY = 'optimized_shortcut_data';

const useSiteDataStore = defineStore("siteData", {
  state: () => {
    // 尝试从优化存储中获取快捷方式数据
    const optimizedShortcutData = getOptimizedStorage(SHORTCUT_DATA_KEY, defaultShortCut);
    
    return {
      // 捷径数据
      shortcutData: optimizedShortcutData,
      // 添加搜索历史记录
      searchHistory: [],
    };
  },
  actions: {
    setShortcutData(value) {
      this.shortcutData = value;
      // 使用优化存储保存大型数据
      setOptimizedStorage(SHORTCUT_DATA_KEY, value);
    },
    // 添加搜索历史
    addSearchHistory(keyword) {
      if (!keyword) return;
      // 移除重复项
      this.searchHistory = this.searchHistory.filter(item => item !== keyword);
      // 添加到开头
      this.searchHistory.unshift(keyword);
      // 限制历史记录数量为20条
      if (this.searchHistory.length > 20) {
        this.searchHistory.pop();
      }
    },
    // 清除搜索历史
    clearSearchHistory() {
      this.searchHistory = [];
    },
    // 初始化搜索历史
    initSearchHistory() {
      // 从 localStorage 获取历史记录
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        try {
          this.searchHistory = JSON.parse(savedHistory);
        } catch (error) {
          console.error('初始化搜索历史失败:', error);
          this.searchHistory = [];
        }
      }
    }
  },
  // 开启数据持久化 - 只对搜索历史使用标准持久化
  persist: {
    key: "siteData",
    storage: window.localStorage,
    paths: ["searchHistory"]
  },
});

export default useSiteDataStore;
