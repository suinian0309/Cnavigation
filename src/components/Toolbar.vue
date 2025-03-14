<template>
  <!-- 捷径坞主容器，根据主题类型应用不同样式 -->
  <div class="toolbar" :class="{ 'theme-light': themeType === 'light', 'theme-dark': themeType === 'dark' }" @contextmenu.prevent.stop="showContextMenu($event)">
    <!-- 遍历捷径项并添加事件监听 -->
    <div v-for="item in toolbarItems" :key="item._id" class="toolbar-item" 
         @click="handleClick(item)" 
         @contextmenu.prevent.stop="showItemContextMenu($event, item)"
         @mouseenter="showItemName(item, $event)"
         @mouseleave="hideItemName">
      <!-- 捷径图标 -->
      <div class="toolbar-icon" :style="getIconStyle(item)">
        <i v-if="!item.faviconUrl"></i>
        <img v-else :src="item.faviconUrl" class="favicon-img" @error="handleFaviconError(item)" />
      </div>
    </div>
  </div>
  
  <!-- 使用Teleport将名称提示移到body中，解决z-index层叠上下文问题 -->
  <teleport to="body">
    <div v-if="showNameTip" class="toolbar-name-teleport" :class="{ 'theme-light': themeType === 'light', 'theme-dark': themeType === 'dark' }" :style="nameTipStyle">
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
  
  <!-- 确认对话框 -->
  <n-modal
    v-model:show="showConfirmModal"
    preset="dialog"
    title="提示"
    positive-text="好的"
    negative-text="取消"
    @positive-click="confirmRemove"
    @negative-click="cancelRemove"
  >
    <template #icon>
      <n-icon color="#2080f0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
        </svg>
      </n-icon>
    </template>
    <div>操作与账号云同步，请您先登录账号。</div>
  </n-modal>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { userStore, setStore } from '@/stores'
import { NDropdown, NMessageProvider, useMessage, NModal, NIcon } from 'naive-ui'
import { h } from 'vue'
import SvgIcon from '@/components/SvgIcon.vue'

// 获取用户和设置的store
const user = userStore()
const set = setStore()
const { isLoggedIn } = storeToRefs(user)
const { themeType } = storeToRefs(set) // 主题类型（light/dark）
const message = useMessage()

// 名称提示相关的响应式状态
const showNameTip = ref(false) // 控制名称提示的显示/隐藏
const currentItemName = ref('') // 当前显示的名称
const nameTipStyle = ref({}) // 名称提示的样式（位置等）

// 默认捷径项数据
const defaultToolbarItems = [
  {
    _id: '1',
    name: '所有捷径',
    gradient: 'linear-gradient(135deg, rgb(84, 174, 229), rgb(147, 106, 209))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '2',
    name: '翻译',
    gradient: 'linear-gradient(135deg, rgb(124, 214, 255), rgb(26, 135, 178))',
    url: 'https://translate.google.com',
    faviconUrl: null
  },
  {
    _id: '3',
    name: 'AI 工具',
    gradient: 'linear-gradient(135deg, rgb(220, 227, 91), rgb(68, 128, 0))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '4',
    name: '图片',
    gradient: 'linear-gradient(135deg, rgb(255, 173, 141), rgb(243, 82, 92))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '5',
    name: '便笺',
    gradient: 'linear-gradient(135deg, rgb(255, 217, 118), rgb(221, 137, 0))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '6',
    name: '空投快传',
    gradient: 'linear-gradient(135deg, rgb(174, 210, 255), rgb(0, 85, 192))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '7',
    name: 'QQ 邮箱',
    gradient: 'linear-gradient(135deg, rgb(255, 181, 151), rgb(215, 93, 43))',
    url: 'https://mail.qq.com',
    faviconUrl: null
  },
  {
    _id: '8',
    name: 'bilibili',
    gradient: 'linear-gradient(135deg, rgb(255, 162, 191), rgb(235, 71, 114))',
    url: 'https://www.bilibili.com',
    faviconUrl: null
  },
  {
    _id: '9',
    name: '壁纸',
    gradient: 'linear-gradient(135deg, rgb(84, 174, 229), rgb(147, 106, 209))',
    url: '#',
    faviconUrl: null
  },
  {
    _id: '10',
    name: '深色主题',
    gradient: 'linear-gradient(135deg, rgb(247, 206, 70), rgb(213, 104, 41))',
    url: '#',
    faviconUrl: null
  }
]

// 响应式捷径项列表
const toolbarItems = ref(defaultToolbarItems)
// 右键菜单相关的状态
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

/**
 * 处理捷径点击事件
 * 如果URL不是#，则在新标签页中打开
 */
const handleClick = (item) => {
  if (item.url === '#') return
  window.open(item.url, '_blank')
}

/**
 * 显示捷径坞的右键菜单
 */
const showContextMenu = (event) => {
  event.preventDefault()
  event.stopPropagation()
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

/**
 * 显示特定捷径项的右键菜单
 */
const showItemContextMenu = (event, item) => {
  event.preventDefault()
  event.stopPropagation()
  selectedItem.value = item
  menuX.value = event.clientX
  menuY.value = event.clientY
  showMenu.value = true
}

/**
 * 处理点击菜单外部事件，关闭菜单
 */
const handleClickOutside = () => {
  showMenu.value = false
}

/**
 * 处理菜单选项选择事件
 */
const handleSelect = (key) => {
  if (key === 'remove') {
    if (!isLoggedIn.value) {
      // 显示登录提示对话框
      showConfirmModal.value = true
    } else {
      // 已登录，直接移除
      removeToolbarItem()
    }
  }
  showMenu.value = false
}

/**
 * 移除工具栏项
 */
const removeToolbarItem = () => {
  if (selectedItem.value) {
    toolbarItems.value = toolbarItems.value.filter(item => item._id !== selectedItem.value._id)
    message.success('已从捷径坞移除')
  }
}

/**
 * 确认移除
 */
const confirmRemove = () => {
  // 这里可以添加跳转到登录页面的逻辑
  message.info('请先登录后再操作')
}

/**
 * 取消移除
 */
const cancelRemove = () => {
  showConfirmModal.value = false
}

/**
 * 显示捷径名称提示
 * 计算提示的位置并显示
 */
const showItemName = (item, event) => {
  const rect = event.target.getBoundingClientRect()
  currentItemName.value = item.name
  nameTipStyle.value = {
    left: `${rect.left + rect.width / 2}px`, // 水平居中
    top: `${rect.top - 45}px`, // 在图标上方45px处显示
    transform: 'translateX(-50%)' // 确保水平居中
  }
  showNameTip.value = true
}

/**
 * 隐藏捷径名称提示
 */
const hideItemName = () => {
  showNameTip.value = false
}

/**
 * 从URL中提取域名
 * @param {string} url - 网站URL
 * @returns {string|null} - 提取的域名或null
 */
const extractDomain = (url) => {
  if (!url || url === '#') return null
  
  try {
    // 使用正则表达式提取域名
    const domainRegex = /^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n?]+)/i
    const matches = url.match(domainRegex)
    return matches && matches[1] ? matches[1] : null
  } catch (error) {
    console.error('提取域名时出错:', error)
    return null
  }
}

/**
 * 获取网站的favicon URL
 * @param {string} url - 网站URL
 * @returns {string|null} - favicon URL或null
 */
const getFaviconUrl = (url) => {
  if (!url || url === '#') return null
  
  const domain = extractDomain(url)
  if (!domain) return null
  
  // 检查本地存储中是否有缓存
  const cachedFavicon = localStorage.getItem(`favicon_${domain}`)
  if (cachedFavicon) return cachedFavicon
  
  // 特定网站的自定义favicon URL
  const customFaviconMap = {
    'translate.google.com': 'https://ssl.gstatic.com/translate/favicon.ico',
    'mail.qq.com': 'https://mail.qq.com/zh_CN/htmledition/images/favicon/qqmail_favicon_96h.png',
    'www.bilibili.com': 'https://www.bilibili.com/favicon.ico',
    'bilibili.com': 'https://www.bilibili.com/favicon.ico',
    'github.com': 'https://github.githubassets.com/favicons/favicon.svg',
    'www.github.com': 'https://github.githubassets.com/favicons/favicon.svg',
    'baidu.com': 'https://www.baidu.com/favicon.ico',
    'www.baidu.com': 'https://www.baidu.com/favicon.ico'
  }
  
  if (customFaviconMap[domain]) {
    // 缓存到本地存储
    localStorage.setItem(`favicon_${domain}`, customFaviconMap[domain])
    return customFaviconMap[domain]
  }
  
  // 使用Google的favicon服务作为默认选项，提供更好的兼容性
  const googleFaviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`
  localStorage.setItem(`favicon_${domain}`, googleFaviconUrl)
  return googleFaviconUrl
}

/**
 * 处理favicon加载错误
 * @param {Object} item - 捷径项
 */
const handleFaviconError = (item) => {
  // 如果加载失败，回退到使用渐变背景
  item.faviconUrl = null
  item.faviconLoadFailed = true
  
  // 从缓存中移除错误的favicon
  const domain = extractDomain(item.url)
  if (domain) {
    localStorage.removeItem(`favicon_${domain}`)
    
    // 尝试使用Google的favicon服务作为备选
    if (!item.triedGoogleFavicon) {
      item.triedGoogleFavicon = true
      item.faviconLoadFailed = false
      item.faviconUrl = `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=64`
    }
  }
}

/**
 * 获取图标样式
 * @param {Object} item - 捷径项
 * @returns {Object} - 样式对象
 */
const getIconStyle = (item) => {
  // 如果有favicon且未加载失败，则不使用渐变背景
  if (item.faviconUrl && !item.faviconLoadFailed) {
    return { background: '#ffffff', display: 'flex', justifyContent: 'center', alignItems: 'center' }
  }
  // 否则使用渐变背景
  return { backgroundImage: item.gradient }
}

/**
 * 加载所有捷径项的favicon
 */
const loadAllFavicons = async () => {
  // 使用Promise.all并行加载所有favicon
  const loadPromises = toolbarItems.value
    .filter(item => item.url && item.url !== '#' && !item.faviconLoadFailed)
    .map(async (item) => {
      try {
        item.faviconUrl = getFaviconUrl(item.url)
      } catch (error) {
        console.error(`加载 ${item.name} 的favicon时出错:`, error)
        item.faviconLoadFailed = true
      }
    })
  
  // 等待所有favicon加载完成
  await Promise.all(loadPromises)
}

// 组件挂载时添加事件监听并加载favicon
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadAllFavicons()
})

// 组件卸载时移除事件监听，防止内存泄漏
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="postcss" scoped>
/* 捷径坞主容器样式 */
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
  backdrop-filter: blur(10px); /* 毛玻璃效果 */
  border-radius: 16px;
  z-index: 1000;
  max-width: calc(100vw - 40px);
  overflow-x: auto;
  scrollbar-width: none; /* 隐藏滚动条 */
  -ms-overflow-style: none;
  transition: all 0.1s ease;
  background: rgba(255, 255, 255, 0.1);
  
  /* 深色主题样式 */
  &.theme-dark {
    background: rgba(0, 0, 0, 0.2);
  }
  
  /* 隐藏WebKit浏览器的滚动条 */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* 移动设备适配 */
  @media screen and (max-width: 768px) {
    gap: 8px;
    padding: 6px;
    bottom: 15px;
  }
}

/* 捷径项样式 */
.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  flex-shrink: 0;
  
  /* 悬停效果 */
  &:hover {
    transform: translateY(-5px); /* 上浮效果 */
    
    .toolbar-icon {
      transform: scale(1.1); /* 放大效果 */
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    }
  }
  
  /* 移动设备适配 */
  @media screen and (max-width: 768px) {
    transform: scale(0.9);
    transform-origin: center;
  }
}

/* 捷径图标样式 */
.toolbar-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease;
  position: relative;
  overflow: hidden; /* 确保图标不会溢出容器 */
  
  /* 移动设备适配 */
  @media screen and (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
  
  i {
    width: 24px;
    height: 24px;
    display: block;
  }
  
  .favicon-img {
    width: 24px;
    height: 24px;
    object-fit: contain; /* 保持图标比例 */
    transition: all 0.2s ease;
  }
}

/* 原始名称提示样式（已不使用，由teleport替代） */
.toolbar-name {
  font-size: 12px;
  color: #fff;
  opacity: 0;
  transform: translateY(5px);
  transition: all 0.1s;
  position: absolute;
  top: -25px;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  font-weight: 400; /* 控制文字加粗 - 中等粗细 */
  z-index: 1001;
  
  /* 移动设备适配 */
  @media screen and (max-width: 768px) {
    font-size: 11px;
    top: -22px;
  }
}

/* 悬停时显示名称 */
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

  /* 下拉菜单选项样式 */
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
  font-weight: 500 !important; /* 控制文字加粗 - 中等粗细 */
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3) !important;
}

/* 确保所有悬停提示显示在最上层 */
:root {
  --tooltip-z-index: 9999; /* 定义全局z-index变量 */
}

/* 应用全局z-index变量 */
.toolbar-name, 
:deep(.n-tooltip), 
:deep(.n-dropdown) {
  z-index: var(--tooltip-z-index) !important;
}

/* Teleport 名称提示样式 - 使用teleport解决z-index层叠上下文问题 */
.toolbar-name-teleport {
  position: fixed;
  font-size: 11px;
  color: #fff;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  pointer-events: none;
  font-weight: 400; /* 控制文字加粗 - 较粗 */
  z-index: 9999;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 8px;
  animation: fadeIn 0.1s ease-out; /* 淡入动画 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  
  /* 移动设备适配 */
  @media screen and (max-width: 768px) {
    font-size: 12px;
    padding: 4px 8px;
  }
}

/* 深色模式名称提示样式 */
.toolbar-name-teleport.theme-dark {
  background-color: rgba(0, 0, 0, 0.7);
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 浅色模式名称提示样式 */
.toolbar-name-teleport.theme-light {
  background-color: rgba(255, 255, 255, 0.2); /* 降低不透明度，使背景更浅 */
  color: #ffffff;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(0, 0, 0, 0.03);
}

/* 淡入动画定义 */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(8px) translateX(-50%);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateX(-50%);
  }
}
</style>
