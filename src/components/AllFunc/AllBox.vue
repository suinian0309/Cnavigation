<template>
  <!-- 有捷径时显示捷径列表 -->
  <template v-if="shortcutData && shortcutData.length > 0 || true">
    <div 
      class="shortcuts-container" 
      @click="handleContainerClick"
      :style="{ height: `${totalHeight}px` }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="shortcut-item"
        :class="{ 'add-item': item.isAddButton }"
        :style="{
          position: 'absolute',
          top: `${item.top}px`,
          left: `${item.left}px`,
          width: `${itemWidth}px`,
          height: `${itemHeight}px`
        }"
        @contextmenu.stop="item.isAddButton ? () => {} : shortCutContextmenu($event, item.data)"
        @click.stop="item.isAddButton ? addShortcutModalOpen() : shortCutJump(item.data.url)"
      >
        <i class="icon-wrapper" :style="item.isAddButton ? {} : getIconStyle(item.data)">
          <template v-if="item.isAddButton">
            <SvgIcon iconName="icon-add" />
          </template>
          <template v-else>
            <SvgIcon v-if="getIconName(item.data)" :iconName="getIconName(item.data)" />
            <img v-else-if="item.data.icon === 'auto' || item.data.icon === 'default'" :src="getFaviconUrl(item.data.url)" class="favicon-img" alt="网站图标" />
            <template v-else-if="item.data.icon === 'generated'">{{ item.data.name.charAt(0) }}</template>
            <!-- 自定义URL图标通过背景图片显示，不需要额外内容 -->
            <span v-else></span>
          </template>
        </i>
        <div class="shortcut-name">{{ item.data.name }}</div>
      </div>
      
      <!-- 添加捷径弹窗 - 移动到shortcuts-container内部 -->
      <div class="modal-container" :style="getModalPosition()">
        <ShortcutAddModal 
          v-model:show="addShortcutModalShow"
          :is-edit="addShortcutModalType"
          :initial-data="addShortcutValue"
          @submit="handleShortcutSubmit"
          @close="addShortcutClose"
          @click.stop
        />
      </div>
    </div>
  </template>
  
  <!-- 无捷径时显示空状态 -->
  <div v-else class="empty-shortcuts">
    <span class="tip">暂无捷径，去添加</span>
    <n-button strong secondary @click.stop="addShortcutModalOpen">
      <template #icon>
        <SvgIcon iconName="icon-add" />
      </template>
      添加捷径
    </n-button>
    
    <!-- 无捷径时的弹窗容器 -->
    <div class="modal-container" :style="getModalPosition()">
      <ShortcutAddModal 
        v-model:show="addShortcutModalShow"
        :is-edit="addShortcutModalType"
        :initial-data="addShortcutValue"
        @submit="handleShortcutSubmit"
        @close="addShortcutClose"
        @click.stop
      />
    </div>
  </div>
  
  <!-- 捷径右键菜单 -->
  <n-dropdown
    placement="bottom-start"
    trigger="manual"
    size="large"
    :x="shortCutDropdownX"
    :y="shortCutDropdownY"
    :options="shortCutDropdownOptions"
    :show="shortCutDropdownShow"
    :on-clickoutside="
      () => {
        shortCutDropdownShow = false;
      }
    "
    @select="shortCutDropdownSelect"
  />
</template>

<script setup>
import { ref, nextTick, h, onMounted, computed, onUnmounted, watch } from "vue";
import {
  NButton,
  NSpace,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NDropdown,
  useMessage,
  useDialog,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { siteStore, setStore, statusStore } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import ShortcutAddModal from "@/components/AllFunc/ShortcutAddModal.vue";
import identifyInput from "@/utils/identifyInput";
import { useElementSize } from '@vueuse/core';
import { throttle, debounce } from "@/utils/eventUtils";

const set = setStore();
const site = siteStore();
const status = statusStore();
const { shortcutData } = storeToRefs(site);
const $message = useMessage();
const $dialog = useDialog();

/* 主题相关 */
const isDarkTheme = ref(false);
const updateThemeClass = () => {
  isDarkTheme.value = document.body.classList.contains('dark');
};

// 监听主题变化
onMounted(() => {
  updateThemeClass();
  // 创建一个MutationObserver来监听body的class变化
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        updateThemeClass();
      }
    });
  });
  
  observer.observe(document.body, { attributes: true });
});

/* 图标渲染 */
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

/* 添加捷径数据 */
const addShortcutRef = ref(null);
const addShortcutModalShow = ref(false);
const addShortcutModalType = ref(false); /* false 添加 / true 编辑 */
const addShortcutValue = ref({
  id: null,
  name: "",
  url: "",
  icon: "auto", /* 自动图标 */
  folder: "none" /* 收纳夹，默认为无 */
});
const addShortcutRules = {
  id: {
    required: true,
    type: "number",
    message: "请输入合集ID",
    trigger: ["input", "blur"],
  },
  name: {
    required: true,
    message: "请输入名称",
    trigger: ["input", "blur"],
  },
  url: {
    required: true,
    validator(rule, value) {
      if (!value) {
        return new Error("请输入站点链接");
      } else if (identifyInput(value) !== "url") {
        return new Error("请检查是否为正确的网址");
      }
      return true;
    },
    trigger: ["input", "blur"],
  },
};

/* 右键菜单数据 */
const shortCutDropdownX = ref(0);
const shortCutDropdownY = ref(0);
const shortCutDropdownShow = ref(false);
const shortCutDropdownOptions = [
  {
    label: "编辑",
    key: "edit",
    icon: renderIcon("edit"),
  },
  {
    label: "删除",
    key: "delete",
    icon: renderIcon("delete-1"),
  },
];

/* 关闭弹窗 */
const addShortcutClose = () => {
  addShortcutModalShow.value = false;
  addShortcutValue.value = {
    id: null,
    name: "",
    url: "",
    icon: "auto",
    folder: "none"
  };
};

/* 选择图标 */
const selectIcon = () => {
  /* 这里可以实现图标选择的逻辑 */
  /* 可以使用下拉菜单或弹窗展示图标选项 */
  $message.info("图标选择功能即将完善");
};

/* 选择收纳夹 */
const selectFolder = () => {
  /* 这里可以实现收纳夹选择的逻辑 */
  /* 可以使用下拉菜单或弹窗展示收纳夹选项 */
  $message.info("收纳夹功能即将完善");
};

/* 开启添加捷径 */
const addShortcutModalOpen = () => {
  /* 生成 ID */
  if (!shortcutData.value) {
    shortcutData.value = [];
  }
  
  const shortcutMaxID = shortcutData.value.reduce((max, item) => {
    return item.id > max ? item.id : max;
  }, -1);
  /* 生成表单数据 */
  addShortcutValue.value = {
    id: shortcutMaxID + 1,
    name: "",
    url: "",
    icon: "auto",
    folder: "none"
  };
  addShortcutModalType.value = false;
  addShortcutModalShow.value = true;
};

/* 处理捷径提交 */
const handleShortcutSubmit = (data) => {
  /* 新增捷径 */
  if (!addShortcutModalType.value) {
    /* 是否重复 */
    const isDuplicate = shortcutData.value?.some(
      (item) =>
        item.name === data.name || item.url === data.url,
    );
    if (isDuplicate) {
      $message.error("新增名称或链接与已有捷径重复");
      return false;
    }
    shortcutData.value.push({
      id: data.id,
      name: data.name || "未命名", /* 如果名称为空，设置默认名称 */
      url: data.url,
      icon: data.icon,
      folder: data.folder,
      customIconUrl: data.customIconUrl,
      iconStyle: data.iconStyle
    });
    $message.success("捷径添加成功");
    return true;
  } else {
    /* 编辑捷径 */
    const index = shortcutData.value.findIndex((item) => item.id === data.id);
    if (index === -1) {
      $message.error("捷径中不存在该项，请重试");
      return false;
    }
    shortcutData.value[index].name = data.name || shortcutData.value[index].name;
    shortcutData.value[index].url = data.url;
    shortcutData.value[index].icon = data.icon;
    shortcutData.value[index].folder = data.folder;
    shortcutData.value[index].customIconUrl = data.customIconUrl;
    shortcutData.value[index].iconStyle = data.iconStyle;
    $message.success("捷径编辑成功");
    return true;
  }
};

/* 删除捷径 */
const delShortcuts = () => {
  const deleteId = addShortcutValue.value.id;
  if (typeof deleteId === "number") {
    const indexToRemove = shortcutData.value.findIndex((item) => item.id === deleteId);
    if (indexToRemove !== -1) {
      shortcutData.value.splice(indexToRemove, 1);
      /* 将后续元素的 id 前移一格 */
      for (let i = indexToRemove; i < shortcutData.value.length; i++) {
        shortcutData.value[i].id = i;
      }
      $message.success("捷径删除成功");
      return true;
    }
    $message.error("捷径删除失败，请重试");
  } else {
    $message.error("捷径删除失败，请重试");
  }
};

/* 开启右键菜单 - 使用节流 */
const shortCutContextmenu = throttle((e, data) => {
  e.preventDefault();
  shortCutDropdownShow.value = false;
  /* 写入弹窗数据 */
  const { id, name, url } = data;
  addShortcutValue.value = { id, name, url };
  nextTick().then(() => {
    shortCutDropdownShow.value = true;
    shortCutDropdownX.value = e.clientX;
    shortCutDropdownY.value = e.clientY;
  });
}, 200);

/* 右键菜单点击 */
const shortCutDropdownSelect = (key) => {
  shortCutDropdownShow.value = false;
  switch (key) {
    case "edit":
      addShortcutModalType.value = true;
      addShortcutModalShow.value = true;
      break;
    case "delete":
      $dialog.warning({
        title: "删除捷径",
        content: `确认删除 ${addShortcutValue.value.name} 捷径？此操作将无法恢复！`,
        positiveText: "删除",
        negativeText: "取消",
        onPositiveClick: () => {
          delShortcuts();
        },
      });
      break;
    default:
      break;
  }
};

/* 捷径跳转 - 使用节流 */
const shortCutJump = throttle((url) => {
  const urlRegex = /^(https?:\/\/)/i;
  const urlFormat = urlRegex.test(url) ? url : `http://${url}`;
  if (set.urlJumpType === "href") {
    window.location.href = urlFormat;
  } else if (set.urlJumpType === "open") {
    window.open(urlFormat, "_blank");
  }
}, 300);

/* 获取图标名称 */
const getIconName = (item) => {
  // 如果item有icon属性且不是auto、default、generated或custom，使用对应的图标
  if (item.icon && !['auto', 'default', 'generated', 'custom'].includes(item.icon)) {
    return `icon-${item.icon}`;
  }
  
  // 如果是自动模式或默认模式，返回null，让模板中使用favicon
  if (item.icon === 'auto' || item.icon === 'default') {
    return null;
  }
  
  // 如果是自定义URL或生成的图标，也返回null，使用自定义样式
  return null;
};

/* 获取网站favicon */
const getFaviconUrl = (url) => {
  if (!url) return '';
  
  // 确保URL格式正确
  let formattedUrl = url;
  if (!url.match(/^https?:\/\//i)) {
    formattedUrl = `http://${url}`;
  }
  
  try {
    // 提取域名
    const urlObj = new URL(formattedUrl);
    const domain = urlObj.hostname;
    
    // 返回Google的favicon服务URL
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch (e) {
    console.error('URL解析错误:', e);
    return '';
  }
};

/* 获取图标样式 */
const getIconStyle = (item) => {
  // 如果是生成的图标，使用保存的样式
  if (item.icon === 'generated' && item.iconStyle) {
    return {
      backgroundColor: item.iconStyle.backgroundColor || '#d4af87',
      color: item.iconStyle.color || '#ffffff',
      fontSize: '24px',
      fontWeight: '500'
    };
  }
  
  // 如果是自定义URL图标
  if (item.icon === 'custom' && item.customIconUrl) {
    return {
      backgroundImage: `url(${item.customIconUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  }
  
  // 默认样式
  return {
    backgroundColor: 'var(--main-background-light-color)'
  };
};

// 虚拟滚动相关
const parentRef = ref(null);
const containerWidth = ref(0);
const scrollY = ref(0);

// 更新容器宽度
const updateContainerWidth = () => {
  const container = document.querySelector('.shortcuts-container');
  if (container) {
    containerWidth.value = container.clientWidth;
  } else {
    // 如果容器不存在，使用feature-panel的宽度作为参考
    const featurePanel = document.querySelector('.feature-panel');
    if (featurePanel) {
      containerWidth.value = featurePanel.clientWidth - 40; // 减去padding
    } else {
      // 如果feature-panel也不存在，使用窗口宽度的一半作为参考
      containerWidth.value = window.innerWidth / 2;
    }
  }
};

// 监听窗口大小变化 - 使用节流而不是防抖，以便在调整大小时能够实时更新
const handleResize = throttle(() => {
  updateContainerWidth();
}, 50);

// 监听父容器的滚动事件
onMounted(() => {
  const featurePanel = document.querySelector('.feature-panel');
  if (featurePanel) {
    featurePanel.addEventListener('scroll', () => {
      scrollY.value = featurePanel.scrollTop;
    });
  }
  
  // 初始化容器宽度
  updateContainerWidth();
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
});

// 移除事件监听
onUnmounted(() => {
  const featurePanel = document.querySelector('.feature-panel');
  if (featurePanel) {
    featurePanel.removeEventListener('scroll', () => {});
  }
  
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize);
});

// 计算项目尺寸 - 响应式调整
const baseItemSize = 120; // 基础尺寸，从80增加到120
const minItemSize = 50; // 最小尺寸，从40增加到50

// 计算项目尺寸比例 - 从1.0到0.5的平滑过渡
const itemSizeRatio = computed(() => {
  // 根据容器宽度计算比例，实现平滑过渡
  // 当容器宽度大于等于1000px时，比例为1.0
  // 当容器宽度小于等于400px时，比例为0.5
  // 中间值线性插值
  if (containerWidth.value >= 1000) return 1.0;
  if (containerWidth.value <= 400) return 0.5;
  
  // 线性插值计算比例
  return 0.5 + (containerWidth.value - 400) / (1000 - 400) * 0.5;
});

// 计算项目尺寸
const itemSize = computed(() => {
  return Math.max(minItemSize, Math.floor(baseItemSize * itemSizeRatio.value));
});

// 项目宽度和高度保持一致
const itemWidth = computed(() => itemSize.value);
const itemHeight = computed(() => itemSize.value * 1.5); // 高度是宽度的1.5倍，保持图标下方有文字空间

// 计算每行可以显示的项目数
const itemsPerRow = computed(() => {
  // 项目之间的间距
  const spacing = 20;
  // 计算每行可以放置的项目数量
  const count = Math.floor((containerWidth.value + spacing) / (itemWidth.value + spacing));
  // 确保至少显示2个
  return Math.max(2, count);
});

// 计算所有项目数据
const allItems = computed(() => {
  if (!shortcutData.value || shortcutData.value.length === 0) {
    // 如果没有快捷方式，返回只包含添加按钮的数组
    return [{
      id: 'add-button',
      isAddButton: true,
      data: {
        name: '添加网站捷径'
      }
    }];
  }
  
  // 返回快捷方式数据加上添加按钮
  const items = shortcutData.value.map(item => ({
    id: item.id,
    data: item
  }));
  
  // 添加按钮作为最后一个项目
  items.push({
    id: 'add-button',
    isAddButton: true,
    data: {
      name: '添加网站捷径'
    }
  });
  
  return items;
});

// 计算所有项目的位置
const allItemsWithPosition = computed(() => {
  // 如果没有项目，返回空数组
  if (allItems.value.length === 0) {
    return [];
  }
  
  // 项目之间的间距
  const horizontalSpacing = 20;
  const verticalSpacing = 14;
  
  // 计算每行的总宽度
  const rowWidth = itemsPerRow.value * itemWidth.value + (itemsPerRow.value - 1) * horizontalSpacing;
  
  // 计算左侧起始位置，使项目水平居中
  const startX = Math.max(0, (containerWidth.value - rowWidth) / 2);
  
  return allItems.value.map((item, index) => {
    const row = Math.floor(index / itemsPerRow.value);
    const col = index % itemsPerRow.value;
    
    return {
      ...item,
      top: row * (itemHeight.value + verticalSpacing),
      left: startX + col * (itemWidth.value + horizontalSpacing),
      width: itemWidth.value,
      height: itemHeight.value
    };
  });
});

// 计算容器的总高度
const totalHeight = computed(() => {
  if (visibleItems.value.length === 0) {
    return itemHeight.value + 60; // 最小高度
  }
  
  // 找到最后一个项目的位置
  const lastItem = visibleItems.value[visibleItems.value.length - 1];
  
  // 返回最后一个项目的底部位置加上一些额外空间
  return lastItem.top + itemHeight.value + 40; // 额外空间用于底部边距
});

// 计算可见项目 - 使用watch监听containerWidth变化
const visibleItems = ref([]);

// 更新可见项目
const updateVisibleItems = () => {
  visibleItems.value = allItemsWithPosition.value;
};

// 监听allItemsWithPosition和containerWidth变化
watch([allItemsWithPosition, containerWidth], () => {
  updateVisibleItems();
}, { immediate: true });

/* 处理容器点击事件 */
const handleContainerClick = (event) => {
  // 如果点击的是容器本身（而不是其中的元素），则关闭功能面板
  if (event.target === event.currentTarget) {
    status.setSiteStatus('normal');
  }
};

/* 获取模态框位置 */
const getModalPosition = () => {
  // 如果没有可见项目，返回默认位置
  if (!visibleItems.value || visibleItems.value.length === 0) {
    return {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    };
  }
  
  // 获取添加按钮的位置（最后一个项目）
  const addButton = visibleItems.value[visibleItems.value.length - 1];
  
  // 根据屏幕尺寸调整位置
  let modalOffset = Math.max(10, Math.min(20, containerWidth.value * 0.02)); // 动态偏移量
  
  // 返回相对于添加按钮的位置
  return {
    position: 'absolute',
    top: `${addButton.top}px`,
    left: `${addButton.left}px`,
    transform: `translateX(${modalOffset}px)` // 使用动态偏移量
  };
};
</script>

<style lang="postcss" scoped>
/* 盒子头部 */
.box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  
  .title {
    font-size: 18px;
    font-weight: bold;
    margin: 0;
  }
  
  .actions {
    display: flex;
    gap: 10px;
  }
}

/* 快捷方式容器 */
.shortcuts-container {
  position: relative;
  width: 100%;
  min-height: 200px; /* 减小最小高度 */
  margin-bottom: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  
  /* 响应式调整容器样式 */
  @media (max-width: 768px) {
    min-height: 180px;
    margin-bottom: 15px;
  }
  
  @media (max-width: 480px) {
    min-height: 150px;
    margin-bottom: 10px;
  }
}

/* 空状态 */
.empty-shortcuts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 200px; /* 减小高度 */
  
  .tip {
    margin-bottom: 20px;
    font-size: 16px;
    opacity: 0.8;
  }
  
  /* 响应式调整空状态样式 */
  @media (max-width: 768px) {
    height: 180px;
    
    .tip {
      margin-bottom: 15px;
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    height: 150px;
    
    .tip {
      margin-bottom: 10px;
      font-size: 12px;
    }
  }
}

/* 快捷方式项 */
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-in-out; /* 平滑过渡效果 */
  
  &:hover {
    transform: translateY(-5px) scale(1.05);
  }
  
  /* 图标容器 */
  .icon-wrapper {
    width: 100%;
    aspect-ratio: 1 / 1; /* 确保始终是正方形 */
    max-width: 100px;
    max-height: 100px;
    border-radius: 12px;
    background-color: var(--main-background-light-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    margin-bottom: 8px;  /* 增加底部间距 */
    box-shadow: var(--main-box-shadow);
    
    .i-icon {
      width: 30%;
      height: 30%;
      min-width: 22px;
      min-height: 22px;
      max-width: 30px;
      max-height: 30px;
      color: var(--main-text-color);
    }
    
    .favicon-img {
      width: 30%;
      height: 30%;
      min-width: 22px;
      min-height: 22px;
      max-width: 30px;
      max-height: 30px;
      object-fit: contain;
    }
  }
  
  /* 快捷方式名称 */
  .shortcut-name {
    font-size: clamp(10px, calc(8px + 0.5vw), 12px); /* 响应式字体大小，增大字体 */
    color: var(--main-text-color);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%; /* 使用100%宽度，适应父容器 */
    margin-top: 4px;
    line-height: 1.2;
  }
  
  /* 添加按钮样式 */
  &.add-item {
    .icon-wrapper {
      border: 2px dashed var(--main-border-color);
      background-color: transparent;
      
      .i-icon {
        color: var(--main-text-color);
        opacity: 0.7;
      }
    }
    
    &:hover .icon-wrapper {
      border-color: var(--main-text-color);
      background-color: var(--main-background-light-color);
      
      .i-icon {
        opacity: 1;
      }
    }
  }
}

/* 表单样式 */
.shortcut-form {
  .form-item {
    margin-bottom: 16px;
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    background-color: var(--main-background-light-color);
    border-radius: 8px;
    overflow: hidden;
    
    .input-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      color: var(--main-text-color);
      opacity: 0.7;
    }
    
    .custom-input {
      flex: 1;
      
      :deep(input) {
        background-color: transparent;
        border: none;
        height: 40px;
        padding: 0 12px 0 0;
      }
    }
  }
  
  .option-button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--main-background-light-color);
    border: none;
    height: 40px;
    
    .button-content {
      display: flex;
      align-items: center;
      
      .i-icon {
        margin-right: 8px;
      }
    }
    
    .button-value {
      display: flex;
      align-items: center;
      opacity: 0.7;
      
      .i-icon {
        margin-left: 4px;
        width: 12px;
        height: 12px;
      }
    }
  }
}

/* 模态框容器 */
.modal-container {
  position: absolute;
  z-index: 1000;
  pointer-events: none; /* 允许点击穿透 */
  
  /* 模态框本身会有pointer-events: auto */
  :deep(.shortcut-add-modal) {
    pointer-events: auto;
  }
}

/* 空状态下的模态框容器 */
.empty-shortcuts .modal-container {
  position: fixed; /* 在空状态下使用fixed定位 */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
