import { createApp } from "vue";
// Pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
// IconFont
import SvgIcon from "@/components/SvgIcon.vue";
// 主组件
import App from "@/App.vue";
// 全局样式 - 使用 PostCSS 替代 Sass
import "@/style/postcss/global.pcss";

// 确保 SVG 图标已加载
if (typeof window._iconfont_svg_string_theme_ === 'undefined' || 
    typeof window._iconfont_svg_string_4182315 === 'undefined') {
  console.error('Icon fonts not loaded properly');
}

// 检查图标是否正确加载
if (typeof window._iconfont_svg_string_theme_ === 'undefined') {
  console.error('Theme icons not loaded properly');
}

// 根组件
const app = createApp(App);

// Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

// 挂载
app.use(pinia);
app.component("SvgIcon", SvgIcon);

// 错误处理
app.config.errorHandler = (err) => {
  console.error('全局错误:', err);
};

app.mount("#app");
