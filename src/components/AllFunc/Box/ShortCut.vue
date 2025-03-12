<template>
  <!-- 捷径 -->
  <Transition name="fade" mode="out-in">
    <div v-if="shortcutData[0]" class="shortcut">
      <n-scrollbar>
        <div class="all-shortcut">
          <n-grid
            x-gap="20"
            y-gap="20"
            cols="6"
            responsive="self"
          >
            <n-grid-item
              v-for="item in shortcutData"
              :key="item"
              class="shortcut-wrapper"
              @contextmenu="shortCutContextmenu($event, item)"
              @click="shortCutJump(item.url)"
            >
              <div class="shortcut-item">
                <SvgIcon :iconName="item.icon" />
              </div>
              <div class="name">{{ item.name }}</div>
            </n-grid-item>
            <n-grid-item
              class="shortcut-wrapper"
              @contextmenu="
                (e) => {
                  e.preventDefault();
                }
              "
              @click="addShortcutModalOpen"
            >
              <div class="shortcut-item">
                <SvgIcon iconName="icon-add" />
              </div>
              <div class="name">添加捷径</div>
            </n-grid-item>
          </n-grid>
        </div>
      </n-scrollbar>
    </div>
    <div v-else class="not-shortcut">
      <span class="tip">暂无捷径，去添加吧</span>
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
</template>

<script setup>
import { ref, nextTick, h } from "vue";
import {
  NButton,
  NScrollbar,
  NGrid,
  NGridItem,
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

// 图标渲染
const renderIcon = (icon) => {
  return () => {
    return h(SvgIcon, { iconName: `icon-${icon}` }, null);
  };
};

// 添加捷径数据
const addShortcutRef = ref(null);
const addShortcutModalShow = ref(false);
const addShortcutModalType = ref(false); // false 添加 / true 编辑
const addShortcutValue = ref({
  id: null,
  name: "",
  url: "",
  icon: "auto", // 自动图标
  folder: "none" // 收纳夹，默认为无
});
const addShortcutRules = {
  id: {
    required: true,
    type: "number",
    message: "请输入合法 ID",
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

// 右键菜单数据
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

// 关闭弹窗
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

// 选择图标
const selectIcon = () => {
  // 这里可以实现图标选择的逻辑
  // 可以使用下拉菜单或弹窗展示图标选项
  $message.info("图标选择功能即将完善");
};

// 选择收纳夹
const selectFolder = () => {
  // 这里可以实现收纳夹选择的逻辑
  // 可以使用下拉菜单或弹窗展示收纳夹选项
  $message.info("收纳夹功能即将完善");
};

// 开启添加捷径
const addShortcutModalOpen = () => {
  // 生成 ID
  const shortcutMaxID = shortcutData.value.reduce((max, item) => {
    return item.id > max ? item.id : max;
  }, -1);
  // 生成表单数据
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

// 添加或编辑捷径
const addOrEditShortcuts = () => {
  addShortcutRef.value?.validate((errors) => {
    if (errors) {
      $message.error("请检查您的输入");
      return false;
    }
    // 新增捷径
    if (!addShortcutModalType.value) {
      // 是否重复
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
        name: addShortcutValue.value.name || "未命名", // 如果名称为空，设置默认值
        url: addShortcutValue.value.url,
        icon: addShortcutValue.value.icon,
        folder: addShortcutValue.value.folder,
      });
      $message.success("捷径添加成功");
      addShortcutClose();
      return true;
    } else {
      // 编辑捷径
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

// 删除捷径
const delShortcuts = () => {
  const deleteId = addShortcutValue.value.id;
  if (typeof deleteId === "number") {
    const indexToRemove = shortcutData.value.findIndex((item) => item.id === deleteId);
    if (indexToRemove !== -1) {
      shortcutData.value.splice(indexToRemove, 1);
      // 将后续元素的 id 前移一位
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

// 开启右键菜单
const shortCutContextmenu = (e, data) => {
  e.preventDefault();
  shortCutDropdownShow.value = false;
  // 写入弹窗数据
  const { id, name, url } = data;
  addShortcutValue.value = { id, name, url };
  nextTick().then(() => {
    shortCutDropdownShow.value = true;
    shortCutDropdownX.value = e.clientX;
    shortCutDropdownY.value = e.clientY;
  });
};

// 右键菜单点击
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

// 捷径跳转
const shortCutJump = (url) => {
  const urlRegex = /^(https?:\/\/)/i;
  const urlFormat = urlRegex.test(url) ? url : `//${url}`;
  if (set.urlJumpType === "href") {
    window.location.href = urlFormat;
  } else if (set.urlJumpType === "open") {
    window.open(urlFormat, "_blank");
  }
};
</script>

<style lang="scss" scoped>
.shortcut {
  width: 100%;
  height: 100%;
  
  .all-shortcut {
    padding: 5px 20px 20px;
    
    .shortcut-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      
      .shortcut-item {
        aspect-ratio: 1;
        width: 70%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        border-radius: 16px;
        background: var(--main-background-light-color);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-5px);
          background: var(--main-background-hover-color);
        }
        
        :deep(.i-icon) {
          font-size: 24px;
          color: var(--main-text-color);
        }
      }
      
      .name {
        font-size: 11px;
        color: var(--main-text-color);
        text-align: center;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        opacity: 0.75;
      }
    }
  }
}

.not-shortcut {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  height: 100%;
  padding: 20px;
  
  .tip {
    font-size: 16px;
    color: var(--main-text-color);
    opacity: 0.8;
  }
}
</style>

<style lang="scss" scoped>
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
