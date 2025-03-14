<template>
  <!-- 有捷径时显示捷径列表 -->
  <template v-if="shortcutData && shortcutData.length > 0">
    <div class="shortcuts-container">
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="shortcut-item"
        :style="{
          position: 'absolute',
          top: `${item.top}px`,
          left: `${item.left}px`,
          width: `${itemWidth}px`,
          height: `${itemHeight}px`
        }"
        @contextmenu.stop="shortCutContextmenu($event, item.data)"
        @click.stop="shortCutJump(item.data.url)"
      >
        <i class="icon-wrapper" :style="getIconStyle(item.data)">
          <SvgIcon v-if="getIconName(item.data)" :iconName="getIconName(item.data)" />
          <img v-else :src="getFaviconUrl(item.data.url)" class="favicon-img" alt="网站图标" />
        </i>
        <div class="shortcut-name">{{ item.data.name }}</div>
      </div>
      
      <!-- 添加按钮 -->
      <div
        class="shortcut-item add-item"
        :style="{
          position: 'absolute',
          top: `${addButtonTop}px`,
          left: `${addButtonLeft}px`,
          width: `${itemWidth}px`,
          height: `${itemHeight}px`
        }"
        @contextmenu.stop.prevent
        @click.stop="addShortcutModalOpen"
      >
        <i class="icon-wrapper">
          <SvgIcon iconName="icon-add" />
        </i>
        <div class="shortcut-name">添加网站捷径</div>
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
  </div>
  
  <!-- 添加捷径弹窗 -->
  <n-modal
    preset="card"
    v-model:show="addShortcutModalShow"
    :title="`${addShortcutModalType ? '编辑' : '添加'}捷径`"
    :bordered="false"
    @mask-click="addShortcutClose"
  >
    <n-form
      ref="addShortcutRef"
      :rules="addShortcutRules"
      :model="addShortcutValue"
      :label-width="0"
      class="shortcut-form"
    >
      <n-form-item path="id" style="display: none">
        <n-input-number
          disabled
          placeholder="请输入ID"
          v-model:value="addShortcutValue.id"
          style="width: 100%"
          :show-button="false"
        />
      </n-form-item>
      <n-form-item path="url" class="form-item">
        <div class="input-wrapper">
          <div class="input-icon">
            <SvgIcon iconName="icon-link" />
          </div>
          <n-input 
            clearable 
            v-model:value="addShortcutValue.url" 
            placeholder="网址" 
            class="custom-input"
            inputmode="url"
            required
          />
        </div>
      </n-form-item>
      <n-form-item path="name" class="form-item">
        <div class="input-wrapper">
          <div class="input-icon">
            <SvgIcon iconName="icon-heading" />
          </div>
          <n-input
            clearable
            v-model:value="addShortcutValue.name"
            placeholder="标题 - 留空即自动获取"
            class="custom-input"
          />
        </div>
      </n-form-item>
      <n-form-item class="form-item">
        <n-button class="option-button" @click="selectIcon">
          <div class="button-content">
            <SvgIcon iconName="icon-icons" />
            <span>图标</span>
          </div>
          <div class="button-value">
            <span>{{ addShortcutValue.icon === 'auto' ? '自动' : addShortcutValue.icon }}</span>
            <SvgIcon iconName="icon-angle-right" />
          </div>
        </n-button>
      </n-form-item>
      <n-form-item class="form-item">
        <n-button class="option-button" @click="selectFolder">
          <div class="button-content">
            <SvgIcon iconName="icon-folder-closed" />
            <span>收纳夹</span>  
          </div>
          <div class="button-value">
            <span>{{ addShortcutValue.folder === 'none' ? '无' : addShortcutValue.folder }}</span>
            <SvgIcon iconName="icon-angle-right" />
          </div>
        </n-button>
      </n-form-item>
    </n-form>
    <template #footer>
      <n-space justify="end">
        <n-button strong secondary @click="addShortcutClose"> 取消 </n-button>
        <n-button strong secondary @click="addOrEditShortcuts">
          {{ addShortcutModalType ? "编辑" : "添加" }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
  
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
import identifyInput from "@/utils/identifyInput";
import { useElementSize } from '@vueuse/core';
import { throttle } from "@/utils/eventUtils";

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

/* 添加或编辑捷径 */
const addOrEditShortcuts = () => {
  addShortcutRef.value?.validate((errors) => {
    if (errors) {
      $message.error("请检查您的输入");
      return false;
    }
    /* 新增捷径 */
    if (!addShortcutModalType.value) {
      /* 是否重复 */
      const isDuplicate = shortcutData.value?.some(
        (item) =>
          item.name === addShortcutValue.value.name || item.url === addShortcutValue.value.url,
      );
      if (isDuplicate) {
        $message.error("新增名称或链接与已有捷径重复");
        return false;
      }
      shortcutData.value.push({
        id: addShortcutValue.value.id,
        name: addShortcutValue.value.name || "未命名", /* 如果名称为空，设置默认名称 */
        url: addShortcutValue.value.url,
        icon: addShortcutValue.value.icon,
        folder: addShortcutValue.value.folder,
      });
      $message.success("捷径添加成功");
      addShortcutClose();
      return true;
    } else {
      /* 编辑捷径 */
      const index = shortcutData.value.findIndex((item) => item.id === addShortcutValue.value.id);
      if (index === -1) {
        $message.error("捷径中不存在该项，请重试");
        return false;
      }
      shortcutData.value[index].name = addShortcutValue.value.name || shortcutData.value[index].name;
      shortcutData.value[index].url = addShortcutValue.value.url;
      shortcutData.value[index].icon = addShortcutValue.value.icon;
      shortcutData.value[index].folder = addShortcutValue.value.folder;
      $message.success("捷径编辑成功");
      addShortcutClose();
      return true;
    }
  });
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
  // 如果item有icon属性且不是auto，使用对应的图标
  if (item.icon && item.icon !== 'auto') {
    return `icon-${item.icon}`;
  }
  
  // 如果是自动模式，返回null，让模板中使用favicon
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
  // 使用半透明白色背景，而不是彩色渐变
  return {
    backgroundColor: 'var(--main-background-light-color)'
  };
};

// 虚拟滚动相关
const parentRef = ref(null);
const { width: containerWidth } = useElementSize(() => document.querySelector('.shortcuts-container'));
const scrollY = ref(0);

// 监听父容器的滚动事件
onMounted(() => {
  const featurePanel = document.querySelector('.feature-panel');
  if (featurePanel) {
    featurePanel.addEventListener('scroll', () => {
      scrollY.value = featurePanel.scrollTop;
    });
  }
});

// 移除滚动事件监听
onUnmounted(() => {
  const featurePanel = document.querySelector('.feature-panel');
  if (featurePanel) {
    featurePanel.removeEventListener('scroll', () => {});
  }
});

// 计算每行显示的项目数
const itemsPerRow = computed(() => {
  // 默认保持一排5个
  if (containerWidth.value < 480) return 3;
  if (containerWidth.value < 768) return 4;
  return 5;
});

// 项目尺寸
const itemWidth = computed(() => Math.min(80, (containerWidth.value / itemsPerRow.value) - 20));
const itemHeight = ref(90); // 稍微减小高度

// 计算所有项目的位置
const allItemsWithPosition = computed(() => {
  const items = [];
  if (!shortcutData.value || shortcutData.value.length === 0) {
    return items;
  }
  
  const rows = Math.ceil((shortcutData.value.length + 1) / itemsPerRow.value); // +1 是为了添加按钮
  const totalWidth = itemsPerRow.value * (itemWidth.value + 14); // 总宽度
  const startX = Math.max(0, (containerWidth.value - totalWidth) / 2); // 计算起始X坐标，使内容居中
  
  shortcutData.value.forEach((item, index) => {
    const row = Math.floor(index / itemsPerRow.value);
    const col = index % itemsPerRow.value;
    
    items.push({
      id: item.id,
      data: item,
      top: row * (itemHeight.value + 14), // 垂直间距
      left: startX + col * (itemWidth.value + 14)  // 水平间距，加上起始偏移
    });
  });
  
  return items;
});

// 添加按钮位置
const addButtonTop = computed(() => {
  if (!shortcutData.value || shortcutData.value.length === 0) {
    return 0;
  }
  
  const row = Math.floor(shortcutData.value.length / itemsPerRow.value);
  return row * (itemHeight.value + 14); // 垂直间距
});

const addButtonLeft = computed(() => {
  if (!shortcutData.value || shortcutData.value.length === 0) {
    return 0;
  }
  
  const col = shortcutData.value.length % itemsPerRow.value;
  const totalWidth = itemsPerRow.value * (itemWidth.value + 14); // 总宽度
  const startX = Math.max(0, (containerWidth.value - totalWidth) / 2); // 计算起始X坐标，使内容居中
  
  return startX + col * (itemWidth.value + 14); // 水平间距，加上起始偏移
});

// 计算总高度
const totalHeight = computed(() => {
  if (!shortcutData.value) {
    return itemHeight.value;
  }
  
  const rows = Math.ceil((shortcutData.value.length + 1) / itemsPerRow.value);
  return rows * (itemHeight.value + 14); // 减小垂直间距
});

// 计算可见项目 - 简化为显示所有项目，不再使用虚拟滚动
const visibleItems = computed(() => {
  return allItemsWithPosition.value;
});
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
  min-height: 300px;
  margin-bottom: 20px;
}

/* 空状态 */
.empty-shortcuts {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 300px;
  
  .tip {
    margin-bottom: 20px;
    font-size: 16px;
    opacity: 0.8;
  }
}

/* 快捷方式项 */
.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.1s ease;
  
  &:hover {
    transform: translateY(-5px);
  }
  
  /* 图标容器 */
  .icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background-color: var(--main-background-light-color);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.1s ease;
    margin-bottom: 8px;
    box-shadow: var(--main-box-shadow);
    
    .i-icon {
      font-size: 24px;
      color: var(--main-text-color);
    }
    
    .favicon-img {
      width: 24px;
      height: 24px;
      object-fit: contain;
    }
  }
  
  /* 快捷方式名称 */
  .shortcut-name {
    font-size: 12px;
    color: var(--main-text-color);
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 80px;
  }
  
  /* 添加按钮样式 */
  &.add-item {
    .icon-wrapper {
      border: 2px dashed var(--main-border-color);
      background-color: transparent;
    }
    
    &:hover .icon-wrapper {
      border-color: var(--main-text-color);
      background-color: var(--main-background-light-color);
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
</style>
