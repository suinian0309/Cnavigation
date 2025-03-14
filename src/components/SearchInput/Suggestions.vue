<template>
  <div>
    <!-- 快捷翻译 -->
    <Transition name="fadeDown" mode="out-in">
      <div
        v-if="
          set.showSuggestions &&
          searchKeyword !== null &&
          status.siteStatus === 'focus' &&
          !status.engineChangeStatus &&
          searchKeywordType === 'text'
        "
        class="translation-container"
      >
        <div
          class="s-result translation-box"
          ref="translationBoxRef"
          @click.stop="toSearch(keyWord, 2)"
        >
          <SvgIcon iconName="icon-translation-two" />
          <span class="text">快捷翻译：{{ keyWord }}</span>
        </div>
      </div>
    </Transition>

    <!-- 搜索历史和直接访问 -->
    <Transition name="fadeDown" mode="out-in">
      <div
        v-if="
          set.showSuggestions &&
          searchKeyword !== null &&
          status.siteStatus === 'focus' &&
          !status.engineChangeStatus &&
          (searchKeywordType !== 'text' || filteredHistory.length > 0)
        "
        class="suggestions"
      >
        <!-- 直接访问 -->
        <div
          v-if="searchKeywordType !== 'text'"
          class="s-result"
          @click.stop="toSearch(searchKeyword, searchKeywordType === 'email' ? 3 : 4)"
        >
          <SvgIcon :iconName="`icon-${searchKeywordType === 'email' ? 'email' : 'link'}`" />
          <span class="text">
            {{ searchKeywordType === "email" ? "发送邮件至" : "直接访问" }}：{{ searchKeyword }}
          </span>
        </div>

        <!-- 搜索历史 -->
        <div v-if="filteredHistory.length > 0" class="history-section">
          <div class="section-title">
            <span>搜索历史</span>
            <span class="clear" @click.stop="clearSearchHistory">清除</span>
          </div>
          <div 
            v-for="item in filteredHistory" 
            :key="item" 
            class="s-result" 
            @click.stop="toSearch(item, 1)"
            v-memo="[item]"
          >
            <SvgIcon iconName="icon-history" />
            <span class="text">{{ item }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed, onBeforeUnmount } from "vue";
import { statusStore, setStore, siteStore } from "@/stores";
import { debounce, throttle, createCancelableDebounce } from "@/utils/eventUtils";
import identifyInput from "@/utils/identifyInput";
import { getSearchSuggestions } from "@/api";

const set = setStore();
const status = statusStore();
const siteData = siteStore();
const emit = defineEmits(["toSearch"]);

/* 搜索关键字 */
const searchKeyword = ref(null);
/* 搜索关键字类别 */
const searchKeywordType = ref("text");
/* 快捷翻译元素 */
const translationBoxRef = ref(null);
/* 是否正在获取建议 */
const isFetchingSuggestions = ref(false);

/* 接收搜索框内容 */
const props = defineProps({
  /* 搜索关键字 */
  keyWord: {
    type: String,
    required: true,
  },
});

/* 过滤搜索历史，只显示包含当前搜索关键词的记录 */
const filteredHistory = computed(() => {
  if (!searchKeyword.value) return siteData.searchHistory;
  return siteData.searchHistory.filter(item => 
    item.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

/* 可取消的防抖函数 */
const debouncedKeywordSearch = createCancelableDebounce((val) => {
  const searchValue = val?.trim();
  /* 是否为空 */
  if (!searchValue || searchValue === "") {
    searchKeyword.value = null;
    return false;
  }
  /* 关闭切换搜索引擎 */
  status.setEngineChangeStatus(false);
  /* 赋值关键字 */
  searchKeyword.value = searchValue;
  /* 判断输入类型 */
  searchKeywordType.value = identifyInput(searchValue);
}, 300);

/* 获取搜索建议 */
const fetchSuggestions = async (keyword) => {
  if (isFetchingSuggestions.value || !keyword || !set.showSuggestions) return;
  
  try {
    isFetchingSuggestions.value = true;
    // 这里可以调用 API 获取搜索建议
    // 目前使用历史记录作为建议，所以不需要额外的 API 调用
  } catch (error) {
    console.error('获取搜索建议失败:', error);
  } finally {
    isFetchingSuggestions.value = false;
  }
};

/* 响应键盘事件 - 使用节流 */
const keyboardEvents = throttle((keyCode, event) => {
  try {
    /* 获取元素 */
    const mainInput = document.getElementById("main-input");
    /* 13 回车 */
    if (keyCode === 13) {
      toSearch(mainInput.value, 1);
    }
  } catch (error) {
    console.error("键盘事件出现错误：" + error);
  }
}, 100);

/* 触发父组件搜索事件 - 使用节流 */
const toSearch = throttle((val, type = 1) => {
  const searchValue = val?.trim();
  if (!searchValue) return;
  
  /* 如果是普通搜索，添加到历史记录 */
  if (type === 1) {
    siteData.addSearchHistory(searchValue);
  }
  
  emit("toSearch", searchValue, type);
  status.setSiteStatus('normal'); /* 搜索后关闭建议框 */
}, 300);

/* 清除搜索历史 - 使用节流 */
const clearSearchHistory = throttle(() => {
  siteData.clearSearchHistory();
}, 300);

/* 监听搜索框变化 */
watch(
  () => props.keyWord,
  (val) => {
    if (set.showSuggestions) {
      /* 判断类型 */
      searchKeywordType.value = identifyInput(val);
      /* 处理搜索框输入 */
      debouncedKeywordSearch.execute(val);
    }
  },
);

/* 组件卸载时取消防抖函数 */
onBeforeUnmount(() => {
  debouncedKeywordSearch.cancel();
});

/* 暴露方法 */
defineExpose({ keyboardEvents, fetchSuggestions });
</script>

<style lang="postcss" scoped>
.translation-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  margin-bottom: 8px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  z-index: 10;

  .translation-box {
    pointer-events: auto;
    width: auto;
    min-width: 200px;
    max-width: 40%;
    background-color: var(--main-background-light-color);
    border-radius: 8px;
    padding: 8px 12px;
    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.1s ease;
    will-change: transform; /* 提示浏览器这些属性会变化，优化性能 */

    .i-icon {
      opacity: 0.8;
      margin-right: 8px;
    }

    .text {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    &:hover {
      transform: translateY(-2px);
      background-color: var(--main-background-hover-color);
    }
  }
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 8px;
  background-color: var(--main-background-light-color);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
  z-index: 10;
  
  .s-result {
    padding: 10px 16px;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: background-color 0.1s;
    
    .i-icon {
      opacity: 0.8;
      margin-right: 10px;
    }
    
    .text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    &:hover {
      background-color: var(--main-background-hover-color);
    }
  }
  
  .history-section {
    .section-title {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 16px;
      font-size: 12px;
      opacity: 0.7;
      
      .clear {
        cursor: pointer;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}

/* 淡入淡出动画 */
.fadeDown-enter-active,
.fadeDown-leave-active {
  transition: all 0.1s ease;
}

.fadeDown-enter-from,
.fadeDown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

