<template>
  <div class="hitokoto-container" @mouseenter="showMenu = true" @mouseleave="showMenu = false">
    <div class="hitokoto" @click="handleClick">
      <span class="content">{{ hitokotoData.content }}</span>
      <span class="source" v-if="hitokotoData.source">—— {{ hitokotoData.source }}</span>
    </div>
    
    <!-- 悬停菜单 -->
    <Transition name="fade">
      <div v-show="showMenu" class="menu-dots">
        <n-dropdown
          trigger="click"
          :options="menuOptions"
          @select="handleSelect"
          :render-label="renderLabel"
          class="hitokoto-dropdown"
        >
          <div class="dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </n-dropdown>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue';
import { getHitokoto } from '@/api';
import { useMessage, NDropdown } from 'naive-ui';
import SvgIcon from '@/components/SvgIcon.vue';

const message = useMessage();
const hitokotoData = ref({ content: '', source: '' });
const showMenu = ref(false);

// 菜单选项
const menuOptions = [
  {
    label: '复制',
    key: 'copy',
    icon: () => h(SvgIcon, { iconName: 'icon-edit' })
  },
  {
    label: '搜索',
    key: 'search',
    icon: () => h(SvgIcon, { iconName: 'icon-search' })
  },
  {
    label: '收藏到便笺',
    key: 'note',
    icon: () => h(SvgIcon, { iconName: 'icon-add' })
  }
];

// 渲染菜单项
const renderLabel = (option) => {
  return h('div', { class: 'menu-item' }, [
    option.label
  ]);
};

// 点击效果
const handleClick = () => {
  const hitokoto = document.querySelector('.hitokoto');
  hitokoto.classList.add('click-effect');
  setTimeout(() => {
    hitokoto.classList.remove('click-effect');
  }, 300);
};

// 处理菜单选择
const handleSelect = (key) => {
  const text = `${hitokotoData.value.content} —— ${hitokotoData.value.source}`;
  
  switch (key) {
    case 'copy':
      navigator.clipboard.writeText(text).then(() => {
        message.success('已复制到剪贴板');
      }).catch(() => {
        message.error('复制失败');
      });
      break;
    case 'search':
      window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(hitokotoData.value.content)}`);
      break;
    case 'note':
      // TODO: 实现收藏到便笺的功能
      message.info('便笺功能开发中');
      break;
  }
};

// 获取一言
const fetchHitokoto = async () => {
  const data = await getHitokoto();
  if (data) {
    hitokotoData.value = data;
  }
};

onMounted(() => {
  fetchHitokoto();
});
</script>

<style lang="scss" scoped>
.hitokoto-container {
  position: fixed;
  bottom: 140px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-block;
  padding: 0 30px;
  width: 100%;
  max-width: 600px;
  z-index: 1;
  
  .hitokoto {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 10px 20px;
    border-radius: 12px;
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 12px;
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    
    &:hover::before {
      opacity: 1;
    }
    
    .content {
      font-size: 14px;
      color: var(--main-text-color);
      text-align: center;
      line-height: 1.5;
      opacity: 0.8;
      text-shadow: var(--main-text-shadow);
      position: relative;
      z-index: 1;
    }
    
    .source {
      font-size: 12px;
      color: var(--main-text-grey-color);
      opacity: 0.8;
      text-shadow: var(--main-text-shadow);
      position: relative;
      z-index: 1;
    }
    
    &.click-effect {
      transform: scale(0.95);
    }
  }
  
  .menu-dots {
    position: absolute;
    top: 5px;
    right: 35px;
    padding: 5px;
    cursor: pointer;
    z-index: 2;
    
    .dots {
      display: flex;
      gap: 3px;
      padding: 5px;
      
      span {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background-color: var(--main-text-color);
        opacity: 0.6;
        transition: opacity 0.3s;
      }
      
      &:hover span {
        opacity: 1;
      }
    }
  }
}

:deep(.hitokoto-dropdown) {
  .n-dropdown-menu {
    background: var(--menu-background) !important;
    backdrop-filter: blur(var(--menu-blur)) !important;
    -webkit-backdrop-filter: blur(var(--menu-blur)) !important;
    border: 1px solid var(--menu-border) !important;
    border-radius: var(--menu-radius) !important;
    box-shadow: var(--menu-shadow) !important;
    padding: 6px !important;
    min-width: 120px !important;
  }

  .n-dropdown-option {
    padding: 8px 12px !important;
    margin: 2px 4px !important;
    border-radius: var(--menu-item-radius) !important;
    transition: all 0.2s ease-in-out !important;
    color: var(--menu-text) !important;
    
    .n-dropdown-option-body {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      
      &__prefix {
        margin-right: 0 !important;
        opacity: 0.8;
        font-size: 16px !important;
      }
      
      &__label {
        font-size: 14px;
      }
    }
    
    &:hover {
      background-color: var(--menu-hover) !important;
      transform: scale(1.02) !important;
    }
  }
}

// 淡入淡出动画
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>