<template>
  <!-- 全局配置组件 -->
  <n-config-provider
    :locale="zhCN"
    :date-locale="dateZhCN"
    :theme="theme"
    :theme-overrides="themeOverrides"
    abstract
    inline-theme-disabled
  >
    <n-dialog-provider>
      <n-notification-provider>
        <n-message-provider :max="1">
          <slot />
          <NaiveProviderContent />
        </n-message-provider>
      </n-notification-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

<script setup>
import { defineComponent, h, computed } from "vue";
import { setStore } from "@/stores";
import {
  zhCN,
  dateZhCN,
  darkTheme,
  lightTheme,
  NConfigProvider,
  NDialogProvider,
  NNotificationProvider,
  NMessageProvider,
  useDialog,
  useNotification,
  useMessage,
} from "naive-ui";

const set = setStore();

/* 主题 */
const theme = computed(() => {
  return set.themeType === 'dark' ? darkTheme : lightTheme;
});

/* 全局主题 */
const themeOverrides = {
  common: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    primaryColor: "#ffffff",
    primaryColorHover: "#ffffff70",
    primaryColorSuppl: "#ffffff30",
    primaryColorPressed: "#ffffff30",
  },
};

/* 挂载 Naive 组件 */
const setupNaiveTools = () => {
  /* 通知 */
  window.$notification = useNotification();
  /* 信息 */
  window.$message = useMessage();
  /* 对话框 */
  window.$dialog = useDialog();
};

/* Naive 功能组件 */
const NaiveProviderContent = defineComponent({
  name: 'NaiveProviderContent',
  setup() {
    setupNaiveTools();
  },
  render() {
    return h("div", { class: "main-tools" });
  },
});
</script>
