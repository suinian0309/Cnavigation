<template>
  <div class="all-box">
    <!-- 捷径 -->
    <Transition name="fade" mode="out-in">
      <div v-if="shortcutData[0]" class="shortcut">
        <div class="all-shortcut">
          <div class="shortcut-grid" :class="{ 'dark': isDarkTheme }">
            <div
              v-for="item in shortcutData"
              :key="item.id"
              class="shortcut-wrapper"
              @contextmenu="shortCutContextmenu($event, item)"
              @click="shortCutJump(item.url)"
            >
              <div class="shortcut-item">
                <SvgIcon v-if="getIconName(item)" :iconName="getIconName(item)" />
                <img v-else :src="getFaviconUrl(item.url)" class="favicon-img" alt="网站图标" />
              </div>
              <div class="shortcut-name">{{ item.name }}</div>
            </div>
            <div
              class="shortcut-wrapper add-wrapper"
              @contextmenu="
                (e) => {
                  e.preventDefault();
                }
              "
              @click="addShortcutModalOpen"
            >
              <div class="shortcut-item add-item">
                <SvgIcon iconName="icon-add" />
              </div>
              <div class="shortcut-name">添加网站捷径</div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="not-shortcut">
        <span class="tip">暂无捷径，去添加</span>
        <n-button strong secondary @click="addShortcutModalOpen">
          <template #icon>
            <SvgIcon iconName="icon-add" />
          </template>
          添加捷径
        </n-button>
      </div>
    </Transition>
    
    <!-- 添加捷径 -->
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
  </div>
</template>

<script setup>
import { ref, nextTick, h, onMounted } from "vue";
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
import { siteStore, setStore } from "@/stores";
import SvgIcon from "@/components/SvgIcon.vue";
import identifyInput from "@/utils/identifyInput";

const set = setStore();
const site = siteStore();
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

/* 获取渐变背景样式 */
const getGradientStyle = (item) => {
  // 预设的渐变样式
  const gradients = [
    'linear-gradient(135deg, rgb(124, 214, 255), rgb(26, 135, 178))',
    'linear-gradient(135deg, rgb(220, 227, 91), rgb(68, 128, 0))',
    'linear-gradient(135deg, rgb(255, 173, 141), rgb(243, 82, 92))',
    'linear-gradient(135deg, rgb(255, 217, 118), rgb(221, 137, 0))',
    'linear-gradient(135deg, rgb(174, 210, 255), rgb(0, 85, 192))',
    'linear-gradient(135deg, rgb(255, 181, 151), rgb(215, 93, 43))',
    'linear-gradient(135deg, rgb(255, 162, 191), rgb(235, 71, 114))',
    'linear-gradient(135deg, rgb(84, 174, 229), rgb(147, 106, 209))',
    'linear-gradient(135deg, rgb(247, 206, 70), rgb(213, 104, 41))'
  ];
  
  // 如果item有icon属性，使用对应的图标
  if (item.icon && item.icon !== 'auto') {
    // 如果是自定义图标，返回对应的渐变
    const iconIndex = parseInt(item.icon.replace(/\D/g, '')) || 0;
    return gradients[iconIndex % gradients.length];
  }
  
  // 根据item的id或其他属性选择渐变
  const index = (item.id || 0) % gradients.length;
  return gradients[index];
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

/* 开启右键菜单 */
const shortCutContextmenu = (e, data) => {
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
};

/* 右键菜单点击 */
const shortCutDropdownSelect = (key) => {
  shortCutDropdownShow.value = false;
  console.log(key);
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

/* 捷径跳转 */
const shortCutJump = (url) => {
  const urlRegex = /^(https?:\/\/)/i;
  const urlFormat = urlRegex.test(url) ? url : `http://${url}`;
  if (set.urlJumpType === "href") {
    window.location.href = urlFormat;
  } else if (set.urlJumpType === "open") {
    window.open(urlFormat, "_blank");
  }
};

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
</script>

<style lang="postcss" scoped>
.all-box {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.shortcut {
  width: 100%;
  height: 100%;
  
  .all-shortcut {
    padding: 50px;
    
    .shortcut-grid {
      display: grid;
      grid-gap: 50px;
      grid-template-columns: repeat(5, 80px);
      left: 50%;
      max-height: calc(100vh - 330px);
      overflow-x: hidden;
      overflow-y: auto;
      padding: 10px 30px 30px;
      position: fixed;
      scrollbar-width: none;
      top: 10px;
      transform: translate(-50%);
      transition: border-color .25s;
      border-bottom: 1px solid transparent;
      border-top: 1px solid transparent;
      max-width: calc(5 * 100px + 4 * 50px); /* 5个元素宽度 + 4个间隔 */
      
      @media screen and (max-width: 768px) {
        grid-template-columns: repeat(4, 85px);
        grid-gap: 30px;
        top: 180px;
        max-width: calc(4 * 85px + 3 * 30px); /* 4个元素宽度 + 3个间隔 */
      }
      
      @media screen and (max-width: 480px) {
        grid-template-columns: repeat(3, 80px);
        grid-gap: 20px;
        top: 160px;
        max-width: calc(3 * 80px + 2 * 20px); /* 3个元素宽度 + 2个间隔 */
      }
      
      &::-webkit-scrollbar {
        width: 0;
      }
      
      &.dark {
        border-color: rgba(255, 255, 255, .1);
      }
      
      &.no-border-bottom {
        border-bottom-color: transparent;
      }
    }
  }
}

/* 组件级别的shortcut-wrapper样式 */
.shortcut-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  margin-bottom: 0;
  
  &:hover {
    transform: translateY(-5px);
    
    .shortcut-item {
      transform: scale(1.05);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
    
    .shortcut-name {
      opacity: 1;
    }
  }
  
  &.add-wrapper {
    .shortcut-item {
      background-color: transparent;
      border: 2px dashed var(--main-border-color);
      box-shadow: none;
      
      &:hover {
        border-color: var(--main-text-color);
      }
    }
  }
}

/* 组件级别的shortcut-item样式 */
.shortcut-item {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  position: relative;
  overflow: hidden;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: rgba(255, 255, 255, 0.5); /* 浅白色背景 */
  
  @media screen and (max-width: 768px) {
    width: 60px;
    height: 60px;
  }
  
  :deep(.i-icon) {
    width: 26px;
    height: 26px;
    font-size: 26px;
    color: var(--main-text-color);
    display: block;
    transition: all 0.1s;
  }
  
  .favicon-img {
    width: 26px;
    height: 26px;
    object-fit: contain;
    border-radius: 4px;
    transition: all 0.1s;
  }
  
  &.add-item {
    background-color: transparent;
    color: var(--main-text-color);
    border: 2px dashed var(--main-border-color);
    
    :deep(.i-icon) {
      font-size: 26px;
      color: var(--main-text-color);
      opacity: 0.6;
      transition: opacity 0.1s;
    }
    
    &:hover {
      :deep(.i-icon) {
        opacity: 1;
      }
    }
  }
}

/* 组件级别的shortcut-name样式 */
.shortcut-name {
  font-size: 14px;
  color: var(--main-text-color);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 5px;
  box-sizing: border-box;
  opacity: 0.8;
  transition: opacity 0.1s;
  margin-top: 8px;
  
  @media screen and (max-width: 768px) {
    font-size: 13px;
  }
}

.not-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 20px;
  
  .tip {
    font-size: 14px;
    color: var(--main-text-color);
    opacity: 0.7;
  }
}

.shortcut-form {
  .form-item {
    margin-bottom: 16px;
  }
  
  .input-wrapper {
    display: flex;
    align-items: center;
    border: 1px solid var(--border-color, #e0e0e0);
    border-radius: 4px;
    overflow: hidden;
    transition: border-color 0.3s;
    
    &:focus-within {
      border-color: var(--primary-color, #18a058);
    }
    
    .input-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      color: var(--text-color-3, #909399);
      
      .i-icon {
        width: 16px;
        height: 16px;
      }
    }
    
    .custom-input {
      flex: 1;
      
      :deep(.n-input__border),
      :deep(.n-input__state-border) {
        display: none;
      }
      
      :deep(.n-input-wrapper) {
        padding: 0;
        background: transparent;
      }
    }
  }
  
  .option-button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    text-align: left;
    background-color: var(--main-background-light-color);
    
    .button-content {
      display: flex;
      align-items: center;
      
      .i-icon {
        margin-right: 8px;
        width: 16px;
        height: 16px;
      }
    }
    
    .button-value {
      display: flex;
      align-items: center;
      color: var(--text-color-3, #909399);
      
      .i-icon {
        margin-left: 4px;
        width: 12px;
        height: 12px;
      }
    }
  }
}
</style>
