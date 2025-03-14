<template>
  <Provider>
    <!-- 壁纸 -->
    <Cover @loadComplete="loadComplete" />
    <!-- 主界面 -->
    <Transition name="fade" mode="out-in">
      <main
        tabindex="0"
        id="main"
        :class="`main-${status.siteStatus}`"
        :style="{ pointerEvents: mainClickable ? 'auto' : 'none' }"
        @click="handleMainClick"
        @contextmenu="mainContextmenu"
        @keydown="mainPressKeyboard"
      >
        <div class="top-section">
          <WeatherTime />
          <SearchInp @contextmenu.stop />
        </div>
        <div class="middle-section">
          <Hitokoto />
          <AllFunc @contextmenu.stop />
        </div>
        <Toolbar />
        <!-- 状态切换 -->
        <Transition name="fade">
          <div
            class="all-controls"
            v-show="status.siteStatus !== 'focus' && status.siteStatus !== 'normal'"
          >
            <div
              class="change-status"
              :title="status.mainBoxBig ? '收起' : '展开'"
              @click.stop="status.setMainBoxBig(!status.mainBoxBig)"
            >
              <Transition name="fade" mode="out-in">
                <SvgIcon
                  :iconName="`icon-${status.mainBoxBig ? 'packup' : 'unfold'}`"
                  :key="status.mainBoxBig ? 'packup' : 'unfold'"
                />
              </Transition>
            </div>
            <div
              class="change-status"
              :title="set.themeType === 'light' ? '深色模式' : '浅色模式'"
              @click.stop="set.themeType = set.themeType === 'light' ? 'dark' : 'light'"
            >
              <SvgIcon :iconName="`icon-${set.themeType === 'light' ? 'yueliang-copy' : 'Sunny'}`" />
            </div>
            <LoginButton />
            <div
              class="change-status"
              :title="status.siteStatus !== 'set' ? '设置' : '首页'"
              @click.stop="status.setSiteStatus(status.siteStatus !== 'set' ? 'set' : 'normal')"
            >
              <SvgIcon :iconName="`icon-${status.siteStatus !== 'set' ? 'setting' : 'home'}`" />
            </div>
          </div>
        </Transition>
      </main>
    </Transition>
  </Provider>
</template>

<script setup>
import { onMounted, nextTick, watch, ref } from "vue";
import { statusStore, setStore, siteStore } from "@/stores";
import { getGreeting } from "@/utils/timeTools";
import Provider from "@/components/Provider.vue";
import Cover from "@/components/Cover.vue";
import WeatherTime from "@/components/WeatherTime.vue";
import SearchInp from "@/components/SearchInput/SearchInp.vue";
import AllFunc from "@/components/AllFunc/AllFunc.vue";
import Hitokoto from '@/components/Hitokoto.vue';
import Toolbar from '@/components/Toolbar.vue';
import LoginButton from '@/components/LoginButton.vue';

const set = setStore();
const status = statusStore();
const site = siteStore();
const mainClickable = ref(false);

/* 获取配置 */
const welcomeText = import.meta.env.VITE_WELCOME_TEXT ?? "欢迎访问本站";

/* 主界面点击事件 */
const handleMainClick = () => {
  // 当站点状态为"box"或其他非normal状态时，点击将重置为normal
  if (status.siteStatus === "box" || status.siteStatus === "set") {
    status.setSiteStatus("normal");
  } else if (status.siteStatus === "focus") {
    // 保持原有的focus状态点击行为
    status.setSiteStatus("normal");
  }
};

/* 鼠标右键 */
const mainContextmenu = (event) => {
  event.preventDefault();
  status.setSiteStatus("box");
};

/* 加载完成事件 */
const loadComplete = () => {
  nextTick().then(() => {
    mainClickable.value = true;
    $message.info(getGreeting() + "，" + welcomeText, {
      showIcon: false,
      duration: 3000,
    });
  });
};

/* 全局键盘事件 */
const mainPressKeyboard = (event) => {
  const keyCode = event.keyCode;
  /* 回车 */
  if (keyCode === 13) {
    /* focus 元素 */
    const mainInput = document.getElementById("main-input");
    status.setSiteStatus("focus");
    mainInput?.focus();
  }
};

/* 根据主题类别更改 */
const changeThemeType = (val) => {
  const htmlElement = document.querySelector("html");
  const themeType = val === "light" ? "light" : "dark";
  htmlElement.setAttribute("theme", themeType);
};

/* 监听颜色变化 */
watch(
  () => set.themeType,
  (val) => changeThemeType(val),
);

onMounted(() => {
  changeThemeType(set.themeType);
  site.initSearchHistory();
});
</script>

<style lang="postcss" scoped>
#main,
#loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: calc(20vh + 40px);

  .top-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }

  .middle-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 30px;
    margin-bottom: auto;
    margin-top: 20px;
  }

  &.main-normal,
  &.main-focus {
    .main-box {
      opacity: 0;
      margin-top: 0;
      transform: scale(0.35);
      pointer-events: none;
    }
  }

  &.main-box,
  &.main-set {
    .main-box {
      opacity: 1;
      margin-top: calc(5vh - 100px);
      transform: scale(1);
      visibility: visible;
      @media (max-width: 478px) {
        margin-top: calc(7vh - 100px);
      }
    }
    .search-input {
      :deep(.all) {
        opacity: 0;
        width: 0;
        visibility: hidden;
      }
    }
  }

  &.big {
    height: 54vh;
    margin-top: calc(5vh - 100px) !important;
  }

  .all-controls {
    position: fixed;
    top: 20px;
    right: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
    z-index: 1000;

    .change-status {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      font-size: 18px;
      border-radius: 8px;
      color: var(--main-text-color);
      background-color: var(--main-background-light-color);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;

      &:hover {
        background-color: var(--main-background-hover-color);
        transform: scale(1.05);
      }

      &:active {
        transform: scale(0.95);
      }

      .i-icon {
        font-size: 18px;
        fill: currentColor;
        color: inherit;
      }
    }
  }
}
#loading {
  color: var(--main-text-color);
  justify-content: center;
  padding-top: 0;
  .logo {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
    animation: logo-breathe 3s infinite alternate;
  }
  .tip {
    font-size: 20px;
  }
}
</style>
