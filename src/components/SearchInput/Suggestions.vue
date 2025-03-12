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
            <span class="clear" @click.stop="siteData.clearSearchHistory">清除</span>
          </div>
          <div v-for="item in filteredHistory" :key="item" class="s-result" @click.stop="toSearch(item, 1)">
            <SvgIcon iconName="icon-history" />
            <span class="text">{{ item }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { statusStore, setStore, siteStore } from "@/stores";
import debounce from "@/utils/debounce";
import identifyInput from "@/utils/identifyInput";

const set = setStore();
const status = statusStore();
const siteData = siteStore();
const emit = defineEmits(["toSearch"]);

// 搜索关键字
const searchKeyword = ref(null);
// 搜索关键字类别
const searchKeywordType = ref("text");
// 快捷翻译元素
const translationBoxRef = ref(null);

// 接收搜索框内容
const props = defineProps({
  // 搜索关键字
  keyWord: {
    type: String,
    required: true,
  },
});

// 过滤搜索历史，只显示包含当前搜索关键词的记录
const filteredHistory = computed(() => {
  if (!searchKeyword.value) return siteData.searchHistory;
  return siteData.searchHistory.filter(item => 
    item.toLowerCase().includes(searchKeyword.value.toLowerCase())
  );
});

// 搜索框输入处理
const keywordsSearch = debounce((val) => {
  const searchValue = val?.trim();
  // 是否为空
  if (!searchValue || searchValue === "") {
    searchKeyword.value = null;
    return false;
  }
  // 关闭切换搜索引擎
  status.setEngineChangeStatus(false);
  // 赋值关键字
  searchKeyword.value = searchValue;
  // 判断输入类型
  searchKeywordType.value = identifyInput(searchValue);
}, 300);

// 响应键盘事件
const keyboardEvents = (keyCode, event) => {
  try {
    // 获取元素
    const mainInput = document.getElementById("main-input");
    // 13 回车
    if (keyCode === 13) {
      toSearch(mainInput.value, 1);
    }
  } catch (error) {
    console.error("键盘事件出现错误：" + error);
  }
};

// 触发父组件搜索事件
const toSearch = (val, type = 1) => {
  const searchValue = val?.trim();
  if (!searchValue) return;
  
  // 如果是普通搜索，添加到历史记录
  if (type === 1) {
    siteData.addSearchHistory(searchValue);
  }
  
  emit("toSearch", searchValue, type);
  status.setSiteStatus('normal'); // 搜索后关闭建议框
};

// 监听搜索框变化
watch(
  () => props.keyWord,
  (val) => {
    if (set.showSuggestions) {
      // 判断类型
      searchKeywordType.value = identifyInput(val);
      // 处理搜索框输入
      keywordsSearch(val);
    }
  },
);

// 暴露方法
defineExpose({ keyboardEvents });
</script>

<style lang="scss" scoped>
.translation-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  margin-bottom: 8px;
  pointer-events: none;
  display: flex;
  justify-content: center;

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
    transition: all 0.3s ease;

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
      box-shadow: 0 -4px 16px rgba(0, 0, 0, 0.15);
    }
  }
}

.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  margin-top: 8px;
  padding: 8px 0;
  color: var(--main-text-color);
  background-color: var(--main-background-light-color);
  backdrop-filter: blur(30px) saturate(1.25);
  border-radius: 16px;
  transition: all 0.3s ease;
  z-index: 1;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;

  .s-result {
    cursor: pointer;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 8px 12px;
    margin: 0 8px;
    font-size: 14px;
    border-radius: 8px;
    transition: all 0.3s ease;

    .i-icon {
      opacity: 0.8;
      margin-right: 8px;
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
      padding: 0 20px;
      margin-bottom: 8px;
      color: var(--main-text-grey-color);
      font-size: 0.9em;
      
      .clear {
        cursor: pointer;
        &:hover {
          color: var(--main-text-color);
        }
      }
    }
  }
}
</style>
