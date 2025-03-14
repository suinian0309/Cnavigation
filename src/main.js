import { createApp } from "vue";
// Pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// 导入优化的持久化插件
import { createOptimizedPersistedState } from "@/utils/optimizedPersist";
// IconFont
import SvgIcon from "@/components/SvgIcon.vue";
// 主组件
import App from "@/App.vue";
// 全局样式 - 使用 PostCSS 替代 Sass
import "@/style/postcss/global.pcss";

// 确保 SVG 图标已加载 - 使用更健壮的检查方式
try {
  // 延迟检查图标加载，给予足够的加载时间
  setTimeout(() => {
    if (typeof window._iconfont_svg_string_theme_ === 'undefined' || 
        typeof window._iconfont_svg_string_4182315 === 'undefined') {
      console.warn('Icon fonts not loaded properly, trying to load them dynamically');
      
      // 尝试动态加载图标字体
      const themeScript = document.createElement('script');
      themeScript.src = '/lib/theme-font.js';
      document.head.appendChild(themeScript);
      
      const iconScript = document.createElement('script');
      iconScript.src = '/lib/iconfont.js';
      document.head.appendChild(iconScript);
    }
  }, 1000);
} catch (error) {
  console.error('Error checking icon fonts:', error);
}

// 根组件
const app = createApp(App);

// Pinia
const pinia = createPinia();
// 使用标准持久化插件
pinia.use(piniaPluginPersistedstate);
// 使用优化的持久化插件 - 对于大型数据
pinia.use(createOptimizedPersistedState({
  key: 'optimized_pinia',
  // 这里可以指定需要优化存储的 store
  // 例如: stores: ['siteData']
}));

// 挂载
app.use(pinia);
app.component("SvgIcon", SvgIcon);

// 错误处理
app.config.errorHandler = (err) => {
  console.error('全局错误:', err);
};

app.mount("#app");
