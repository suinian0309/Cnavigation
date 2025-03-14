import { defineStore } from "pinia";

const useStatusDataStore = defineStore("statusData", {
  state: () => {
    return {
      // 壁纸状态
      imgLoadStatus: false,
      // 站点状态
      // normal 正常 / focus 搜索 / box 盒子 / set 设置
      siteStatus: "normal",
      // 切换搜索引擎
      engineChangeStatus: false,
      // 搜索框文本
      searchInputValue: "",
      // 功能面板是否展开
      featurePanelExpanded: false,
    };
  },
  getters: {},
  actions: {
    setImgLoadStatus(value) {
      this.imgLoadStatus = value;
    },
    setSiteStatus(value, alsoChange = true) {
      this.siteStatus = value;
      if (value !== "focus") this.searchInputValue = "";
      if (alsoChange) this.engineChangeStatus = false;
    },
    setEngineChangeStatus(value) {
      this.engineChangeStatus = value;
    },
    setSearchInputValue(value) {
      this.searchInputValue = value;
    },
    setFeaturePanelExpanded(value) {
      this.featurePanelExpanded = value;
    },
  },
  // 开启数据持久化
  persist: {
    key: "statusData",
    storage: window.localStorage,
    paths: ["featurePanelExpanded"],
  },
});

export default useStatusDataStore;
