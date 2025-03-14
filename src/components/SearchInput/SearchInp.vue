<template>
  <!-- 搜索框 -->
  <div
    :class="[
      'search-input',
      set.smallInput ? 'small' : null,
      status.siteStatus === 'focus' ? 'focus' : null,
    ]"
    @click.stop
  >
    <!-- 搜索框遮罩 -->
    <div
      v-if="status.siteStatus === 'focus'"
      class="mask"
      @click="closeSearchInput(false)"
      @contextmenu.stop="
        (event) => {
          event.preventDefault();
        }
      "
    />
    <!-- 主搜索框 -->
    <div class="all" ref="searchAllRef" @animationend="inputAnimationEnd">
      <div class="engine" title="切换搜索引擎" @click="changeEngine">
        <Transition name="fade" mode="out-in">
          <SvgIcon
            :iconName="currentEngineIcon"
            :key="set.searchEngine"
          />
        </Transition>
      </div>
      <input
        class="input"
        id="main-input"
        ref="searchInputRef"
        type="text"
        label="search"
        title="请输入搜索内容"
        autocomplete="false"
        :placeholder="inputTip"
        v-model="status.searchInputValue"
        @focus="status.setSiteStatus('focus')"
        @click.stop="status.setEngineChangeStatus(false)"
        @keydown.stop="pressKeyboard"
        @input="handleInput"
      />
      <div class="go" title="搜索" @click="handleSearch">
        <SvgIcon iconName="icon-search" className="search" />
      </div>
    </div>
    <!-- 搜索引擎切换 -->
    <SearchEngine />
    <!-- 搜索建议 -->
    <Suggestions ref="suggestionsRef" :keyWord="status.searchInputValue" @toSearch="toSearch" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { statusStore, setStore } from "@/stores";
import SearchEngine from "@/components/SearchInput/SearchEngine.vue";
import Suggestions from "@/components/SearchInput/Suggestions.vue";
import defaultEngine from "@/assets/defaultEngine.json";
import siteData from "@/stores/siteData";
import { debounce, throttle, createCancelableDebounce } from "@/utils/eventUtils";

const set = setStore();
const status = statusStore();

// 当前搜索引擎图标
const currentEngineIcon = computed(() => {
  if (set.searchEngine === 'custom') {
    return 'icon-custom';
  }
  
  return `icon-${defaultEngine[set.searchEngine]?.icon || set.searchEngine}`;
});

/* 搜索框配置 */
const inputTip = import.meta.env.VITE_INPUT_TIP ?? "想要搜点什么";

/* 搜索框数据 */
const searchAllRef = ref(null);
const searchInputRef = ref(null);

/* 搜索建议子组件 */
const suggestionsRef = ref(null);

/* 可取消的防抖函数 */
const debouncedSearch = createCancelableDebounce((value) => {
  if (value && value.trim()) {
    suggestionsRef.value?.fetchSuggestions(value);
  }
}, 300);

/* 处理输入事件 - 使用防抖 */
const handleInput = () => {
  debouncedSearch.execute(status.searchInputValue);
};

/* 关闭搜索框 */
const closeSearchInput = (check = false) => {
  if (check && !set.autoInputBlur) {
    status.setSiteStatus("focus");
  } else {
    status.setSearchInputValue("");
    status.setSiteStatus("normal");
    searchInputRef.value?.blur();
  }
  status.setEngineChangeStatus(false);
  
  // 取消正在进行的防抖搜索
  debouncedSearch.cancel();
};

/* 前往搜索 - 使用节流 */
const toSearch = throttle((val, type = 1) => {
  const searchValue = val?.trim();
  /* 定义跳转方法 */
  const jumpLink = (url) => {
    if (set.urlJumpType === "href") {
      window.location.href = url;
    } else if (set.urlJumpType === "open") {
      window.open(url, "_blank");
    }
  };
  /* 是否为空 */
  if (searchValue) {
    const searchFormat = encodeURIComponent(searchValue);
    console.log("前往搜索：" + searchValue, type);
    switch (type) {
      /* 默认搜索 */
      case 1:
        if (set.searchEngine !== "custom") {
          const engine = defaultEngine[set.searchEngine];
          jumpLink(engine?.url + searchFormat);
        } else {
          jumpLink(set.customEngineUrl + searchFormat);
        }
        break;
      /* 快捷翻译 */
      case 2: {
        const hasTranslation = defaultEngine[set.searchEngine]?.translation;
        jumpLink(
          hasTranslation
            ? hasTranslation + searchFormat
            : `https://fanyi.baidu.com/#en/zh/${searchFormat}`,
        );
        break;
      }
      /* 电子邮件 */
      case 3:
        jumpLink(`mailto:${searchFormat}`);
        break;
      /* 直接访问 */
      case 4: {
        const urlRegex = /^(https?:\/\/)/i;
        const url = urlRegex.test(searchFormat) ? searchFormat : `http://${searchFormat}`;
        jumpLink(url);
        break;
      }
      default:
        break;
    }
    closeSearchInput(true);
    siteData.addSearchHistory(searchValue);
  } else {
    if (status.siteStatus === "focus") {
      $message.info("请输入搜索内容", { duration: 1500 });
    }
    status.setSiteStatus("focus");
    searchInputRef.value?.focus();
  }
}, 500);

/* 搜索框动画结束 */
const inputAnimationEnd = () => {
  console.log("搜索框动画结束");
  /* 自动 focus */
  if (set.autoFocus) {
    status.setSiteStatus("focus");
    searchInputRef.value?.focus();
  }
};

/* 键盘事件 - 使用节流 */
const pressKeyboard = throttle((event) => {
  /* 获取键的键码 */
  const keyCode = event.keyCode;
  /* 子组件事件 */
  suggestionsRef.value?.keyboardEvents(keyCode, event);
}, 100);

/* 更换搜索引擎 */
const changeEngine = () => {
  status.setSiteStatus("focus", false);
  status.setEngineChangeStatus(!status.engineChangeStatus);
};

/* 处理搜索按钮点击 - 使用节流 */
const handleSearch = throttle(() => {
  if (!status.searchInputValue) return;
  toSearch(status.searchInputValue, 1);
}, 300);

/* 组件卸载时取消防抖函数 */
onBeforeUnmount(() => {
  debouncedSearch.cancel();
});
</script>

<style lang="postcss" scoped>
.search-input {
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: 680px;
  width: calc(100% - 60px);
  transition: width 0.1s linear;
  
  .mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  
  .all {
    position: relative;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 44px;
    background-color: var(--main-background-color);
    border-radius: 22px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    box-shadow: var(--main-box-shadow);
    z-index: 2;
    transition: all 0.1s ease;
    animation: search-input-in 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    will-change: transform, opacity; /* 提示浏览器这些属性会变化，优化性能 */
    
    .engine {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--main-text-color);
      transition: all 0.1s ease;
      
      &:hover {
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.9);
      }
      
      :deep(.i-icon) {
        width: 20px;
        height: 20px;
        font-size: 20px;
      }
    }
    
    .input {
      flex: 1;
      height: 100%;
      background-color: transparent;
      border: none;
      outline: none;
      color: var(--main-text-color);
      font-size: 16px;
      padding: 0 10px;
      
      &::placeholder {
        color: var(--main-text-grey-color);
        opacity: 0.7;
      }
    }
    
    .go {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: var(--main-text-color);
      transition: all 0.1s ease;
      
      &:hover {
        transform: scale(1.1);
      }
      
      &:active {
        transform: scale(0.9);
      }
      
      :deep(.i-icon) {
        width: 20px;
        height: 20px;
        font-size: 20px;
      }
    }
  }
  
  &.small {
    .all {
      width: 44px;
      
      .input, .go {
        display: none;
      }
    }
    
    &.focus {
      .all {
        width: 100%;
        
        .input, .go {
          display: block;
        }
      }
    }
  }
  
  &.focus {
    .all {
      background-color: var(--main-input-hover-color);
      box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
      
      .input {
        color: #333;
        
        &::placeholder {
          color: #999;
        }
      }
      
      .engine, .go {
        color: #666;
      }
    }
  }
}

@keyframes search-input-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

