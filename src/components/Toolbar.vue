<template>
  <div class="toolbar" :class="{ 'theme-light': themeType === 'light', 'theme-dark': themeType === 'dark' }" @contextmenu.prevent.stop="showContextMenu($event)">
    <div v-for="item in toolbarItems" :key="item._id" class="toolbar-item" @click="handleClick(item)" @contextmenu.prevent.stop="showItemContextMenu($event, item)" @mouseenter="showItemName(item, $event)" @mouseleave="hideItemName">
      <div class="toolbar-icon" :style="{ backgroundImage: item.gradient }">
        <i></i>
      </div>
    </div>
  </div>
  
  <!-- 使用Teleport将名称提示移到body中 -->
  <teleport to="body">
    <div v-if="showNameTip" class="toolbar-name-teleport" :style="nameTipStyle">
      {{ currentItemName }}
    </div>
  </teleport>
  
  <!-- 右键菜单 -->
  <n-dropdown
    class="toolbar-dropdown"
    placement="top-start"
    trigger="manual"
    :show="showMenu"
    :options="dropdownOptions"
    :x="menuX"
    :y="menuY"
    :on-clickoutside="handleClickOutside"
    @select="handleSelect"
  />
  <!-- 消息提示 -->
  <n-message-provider>
    <message-api-ref />
  </n-message-provider>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { userStore, setStore } from '@/stores'
import { NDropdown, NMessageProvider, useMessage } from 'naive-ui'
import { h } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

const user = userStore()
const set = setStore()
const { isLoggedIn } = storeToRefs(user)
const { themeType } = storeToRefs(set)
const message = useMessage()

const showNameTip = ref(false)
const currentItemName = ref('')
const nameTipStyle = ref({})

const defaultToolbarItems = [
  {
    _id: '1',
    name: '所有捷径',
    gradient: 'linear-gradient(135deg, rgb(84, 174, 229), rgb(147, 106, 209))',
    url: '#'
  },
  {
    _id: '2',
    name: '翻译',
    gradient: 'linear-gradient(135deg, rgb(124, 214, 255), rgb(26, 135, 178))',
    url: 'https://translate.google.com'
  },
  {
    _id: '3',
    name: 'AI 工具',
    gradient: 'linear-gradient(135deg, rgb(220, 227, 91), rgb(68, 128, 0))',
    url: '#'
  },
  {
    _id: '4',
    name: '图片',
    gradient: 'linear-gradient(135deg, rgb(255, 173, 141), rgb(243, 82, 92))',
    url: '#'
  },
  {
    _id: '5',
    name: '便笺',
    gradient: 'linear-gradient(135deg, rgb(255, 217, 118), rgb(221, 137, 0))',
    url: '#'
  },
  {
    _id: '6',
    name: '空投快传',
    gradient: 'linear-gradient(135deg, rgb(174, 210, 255), rgb(0, 85, 192))',
    url: '#'
  },
  {
    _id: '7',
    name: 'QQ 邮箱',
    gradient: 'linear-gradient(135deg, rgb(255, 181, 151), rgb(215, 93, 43))',
    url: 'https://mail.qq.com'
  },
  {
    _id: '8',
    name: 'bilibili',
    gradient: 'linear-gradient(135deg, rgb(255, 162, 191), rgb(235, 71, 114))',
    url: 'https://www.bilibili.com'
  },
  {
    _id: '9',
    name: '壁纸',
    gradient: 'linear-gradient(135deg, rgb(84, 174, 229), rgb(147, 106, 209))',
    url: '#'
  },
  {
    _id: '10',
    name: '深色主题',
    gradient: 'linear-gradient(135deg, rgb(247, 206, 70), rgb(213, 104, 41))',
    url: '#'
  }
]

const toolbarItems = ref(defaultToolbarItems)
const showMenu = ref(false)
const showConfirmModal = ref(false)
const menuX = ref(0)
const menuY = ref(0)
const selectedItem = ref(null)

/* 右键菜单选项 */
const dropdownOptions = [
  {
    label: '从捷径坞移除',
    key: 'remove',
    icon: () => h(SvgIcon, { iconName: 'icon-delete-1' }),
    props: {
      style: 'font-size: 12px; padding: 4px 8px;'
    }
  }
]

const handleClick = (item) => {
  if (item.url === '#') return
  window.open(item.url, '_blank')
}

const showContextMenu = (event) => {
  event.preventDefault()
  event.stopPropagation()
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

const showItemContextMenu = (event, item) => {
  event.preventDefault()
  event.stopPropagation()
  selectedItem.value = item
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

const handleClickOutside = () => {
  showMenu.value = false
}

const handleSelect = (key) => {
  if (key === 'remove') {
    if (!isLoggedIn.value) {
      message.warning('请先登录后再操作')
    } else {
      toolbarItems.value = toolbarItems.value.filter(item => item._id !== selectedItem.value._id)
    }
  }
  showMenu.value = false
}

const showItemName = (item, event) => {
  const rect = event.target.getBoundingClientRect()
  currentItemName.value = item.name
  nameTipStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top - 30}px`,
    transform: 'translateX(-50%)'
  }
  showNameTip.value = true
}

const hideItemName = () => {
  showNameTip.value = false
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="postcss" scoped>
.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 8px;
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  z-index: 1000;
  max-width: calc(100vw - 40px);
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.1);
  
  &.theme-dark {
    background: rgba(0, 0, 0, 0.2);
  }
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media screen and (max-width: 768px) {
    gap: 8px;
    padding: 6px;
    bottom: 15px;
  }
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  flex-shrink: 0;
  
  &:hover {
    transform: translateY(-5px);
    
    .toolbar-icon {
      transform: scale(1.1);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
  }
  
  @media screen and (max-width: 768px) {
    transform: scale(0.9);
    transform-origin: center;
  }
}

.toolbar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  
  @media screen and (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
  
  i {
    width: 24px;
    height: 24px;
    display: block;
  }
}

.toolbar-name {
  font-size: 12px;
  color: #fff;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.3s;
  position: absolute;
  top: -25px;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  font-weight: 500;
  z-index: 1001;
  
  @media screen and (max-width: 768px) {
    font-size: 11px;
    top: -22px;
  }
}

.toolbar-item:hover .toolbar-name {
  opacity: 1;
  transform: translateY(0);
  z-index: 1001;
}

/* 捷径坞右键菜单样式 */
:deep(.toolbar-dropdown) {
  .n-dropdown-menu {
    min-width: 100px !important;
    background: var(--main-background-light-color) !important;
    border-radius: 16px !important;
    box-shadow: var(--main-box-shadow) !important;
    padding: 6px !important;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  .n-dropdown-option {
    --n-color: var(--main-background-light-color) !important;
    --n-color-hover: var(--main-background-hover-color) !important;
    --n-text-color: var(--main-text-color) !important;
    --n-text-color-hover: var(--main-text-color) !important;
    border-radius: 10px !important;
    margin: 2px 4px !important;
  }

  .n-dropdown-option-body {
    padding: 6px 8px !important;
    transition: all 0.2s !important;
    font-size: 12px !important;
  }

  .n-dropdown-option-body__label {
    color: var(--main-text-color) !important;
  }

  .n-dropdown-option:hover {
    background: var(--main-background-hover-color) !important;
  }

  .n-dropdown-option:hover .n-dropdown-option-body__label {
    color: var(--main-text-color) !important;
  }

  .n-dropdown-option .n-icon {
    font-size: 12px !important;
    margin-right: 4px !important;
    color: var(--main-text-color) !important;
  }

  :deep(.i-icon) {
    width: 12px !important;
    height: 12px !important;
  }
}

/* 自定义Tooltip样式 */
:deep(.n-tooltip) {
  z-index: 1100 !important; /* 确保Tooltip显示在最上层 */
}

:deep(.n-tooltip-content) {
  font-size: 12px !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  background-color: rgba(0, 0, 0, 0.75) !important;
  backdrop-filter: blur(5px) !important;
  -webkit-backdrop-filter: blur(5px) !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
  color: #fff !important;
  font-weight: 500 !important;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* 确保所有悬停提示显示在最上层 */
:root {
  --tooltip-z-index: 9999;
}

.toolbar-name, 
:deep(.n-tooltip), 
:deep(.n-dropdown) {
  z-index: var(--tooltip-z-index) !important;
}

/* Teleport 名称提示样式 */
.toolbar-name-teleport {
  position: fixed;
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  font-weight: 500;
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 6px;
  animation: fadeIn 0.2s ease-out;
  
  @media screen and (max-width: 768px) {
    font-size: 11px;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}
</style>
