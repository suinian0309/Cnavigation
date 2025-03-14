<template>
  <div class="setting" @click="handleSettingClick">
    <!-- 左侧菜单 -->
    <div class="left show">
      <div class="title">
        <span>设置</span>
        <span>个性化与全局设置</span>
      </div>
      <div class="menu">
        <div class="menu-item" :class="{ choose: activeMenu === 'search' }" @click="activeMenu = 'search'">
          <SvgIcon iconName="icon-search" />
          <span class="name">搜索引擎</span>
        </div>
        <div class="menu-item" :class="{ choose: activeMenu === 'basic' }" @click="activeMenu = 'basic'">
          <SvgIcon iconName="icon-setting" />
          <span class="name">基本设置</span>
        </div>
        <div class="menu-item" :class="{ choose: activeMenu === 'theme' }" @click="activeMenu = 'theme'">
          <SvgIcon iconName="icon-theme" />
          <span class="name">个性化偏好</span>
        </div>
        <div class="menu-item" :class="{ choose: activeMenu === 'weather' }" @click="activeMenu = 'weather'">
          <SvgIcon iconName="icon-time" />
          <span class="name">时间与天气</span>
        </div>
      </div>
    </div>
    
    <!-- 右侧内容区域 -->
    <div class="content custom-scrollbar">
      <div class="mask" :style="maskStyle"></div>
      <div class="breadcrumb">
        <span>
          <SvgIcon :iconName="`icon-${getBreadcrumbIcon()}`" /> 设置 
        </span>
        <span>{{ getBreadcrumbTitle() }}</span>
      </div>
      
      <!-- 搜索引擎设置 -->
      <div v-if="activeMenu === 'search'" class="setting-card">
        <h3 class="title">搜索引擎</h3>
        <div class="engine-list">
          <div v-for="(engine, index) in engines" :key="index" class="engine-item card" :class="{ 'draggable': isDragging }" draggable="true" @dragstart="dragStart(index)" @dragover.prevent @drop="drop(index)">
            <SvgIcon :iconName="engine.icon.startsWith('icon-') ? engine.icon : `icon-${engine.icon}`" />
            <span class="name">{{ engine.name }}</span>
            <div class="menu">
              <SvgIcon iconName="icon-menu" />
            </div>
          </div>
        </div>
        <div class="tip-text">
          <p>提示：拖动搜索引擎卡片可以调整顺序，顺序会自动保存</p>
        </div>
      </div>
      
      <!-- 基本设置 -->
      <div v-if="activeMenu === 'basic'" class="setting-card">
        <h3 class="title">基本设置</h3>
        <n-scrollbar class="scrollbar">
          <div class="scrollbar-content">
            <n-card class="set-item">
              <div class="name">
                <span class="title">搜索引擎</span>
                <span class="tip">切换或自定义搜索引擎</span>
              </div>
              <n-button
                strong
                secondary
                @click="activeMenu = 'search'"
              >
                前往调整
              </n-button>
            </n-card>
            <!-- 其他基本设置项 -->
          </div>
        </n-scrollbar>
      </div>
      
      <!-- 个性化偏好 -->
      <div v-if="activeMenu === 'theme'" class="setting-card">
        <h3 class="title">个性化偏好</h3>
        <n-scrollbar class="scrollbar">
          <div class="scrollbar-content">
            <n-h6 prefix="bar"> 主题与壁纸 </n-h6>
            <n-card class="set-item">
              <div class="name">
                <span class="title">壁纸偏好</span>
                <span class="tip"> 除默认以外的其他选项可能会导致页面载入缓慢 </span>
              </div>
              <n-space>
                <Transition name="fade" mode="out-in">
                  <n-button
                    v-if="backgroundType !== 0"
                    strong
                    secondary
                    @click="changeBackground(0, true)"
                  >
                    恢复默认
                  </n-button>
                </Transition>
                <n-button strong secondary @click="customCoverModal = true">
                  <template v-if="backgroundType === 4" #icon>
                    <SvgIcon iconName="icon-confirm" />
                  </template>
                  {{ backgroundType === 4 ? "已开启自定义" : "自定义" }}
                </n-button>
              </n-space>
            </n-card>
            <!-- 其他个性化设置项 -->
          </div>
        </n-scrollbar>
      </div>
      
      <!-- 时间与天气 -->
      <div v-if="activeMenu === 'weather'" class="setting-card">
        <h3 class="title">时间与天气</h3>
        <n-scrollbar class="scrollbar">
          <div class="scrollbar-content">
            <!-- 时间与天气设置项 -->
          </div>
        </n-scrollbar>
      </div>
    </div>
  </div>
  
  <!-- 自定义壁纸模态框 -->
  <n-modal v-model:show="customCoverModal" preset="card" :style="{ width: '600px' }">
    <!-- 自定义壁纸内容 -->
  </n-modal>
  
  <!-- 其他模态框 -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { statusStore, setStore, userStore } from '@/stores';
import { NButton, NCard, NSpace, NH6, NGrid, NGridItem, NModal, NScrollbar } from 'naive-ui';
import SvgIcon from '@/components/SvgIcon.vue';
import defaultEngine from "@/assets/defaultEngine.json";

const status = statusStore();
const set = setStore();
const user = userStore();

// 当前激活的菜单项
const activeMenu = ref('search');

// 搜索引擎列表
const engines = ref([]);

// 初始化搜索引擎列表
onMounted(() => {
  initEnginesList();
});

// 初始化搜索引擎列表
const initEnginesList = () => {
  // 如果store中没有searchEngineOrder，则创建一个默认的
  if (!set.searchEngineOrder || set.searchEngineOrder.length === 0) {
    set.searchEngineOrder = Object.keys(defaultEngine);
  }
  
  // 根据searchEngineOrder的顺序创建engines列表
  engines.value = set.searchEngineOrder.map(key => ({
    key,
    name: defaultEngine[key]?.name || key,
    icon: defaultEngine[key]?.icon || key
  }));
};

// 拖拽相关
const isDragging = ref(false);
const draggedIndex = ref(null);

const dragStart = (index) => {
  isDragging.value = true;
  draggedIndex.value = index;
};

const drop = (index) => {
  isDragging.value = false;
  if (draggedIndex.value !== null) {
    const item = engines.value[draggedIndex.value];
    engines.value.splice(draggedIndex.value, 1);
    engines.value.splice(index, 0, item);
    draggedIndex.value = null;
    
    // 保存新的搜索引擎顺序
    saveEngineOrder();
  }
};

// 保存搜索引擎顺序
const saveEngineOrder = () => {
  // 提取搜索引擎的key列表
  const newOrder = engines.value.map(engine => engine.key);
  
  // 更新到store中
  set.updateSearchEngineOrder(newOrder);
};

// 面包屑图标
const getBreadcrumbIcon = () => {
  switch (activeMenu.value) {
    case 'search': return 'search';
    case 'basic': return 'setting';
    case 'theme': return 'theme';
    case 'weather': return 'time';
    default: return 'setting';
  }
};

// 面包屑标题
const getBreadcrumbTitle = () => {
  switch (activeMenu.value) {
    case 'search': return '搜索引擎';
    case 'basic': return '基本设置';
    case 'theme': return '个性化偏好';
    case 'weather': return '时间与天气';
    default: return '';
  }
};

// 遮罩样式
const maskStyle = computed(() => {
  return {
    opacity: activeMenu.value ? '0' : '1'
  };
});

// 壁纸相关
const { backgroundType } = storeToRefs(set);
const customCoverModal = ref(false);
const backgroundTypeArr = [
  { name: '默认' },
  { name: 'Bing 每日壁纸' },
  { name: '随机风景' },
  { name: '随机动漫' },
  { name: '自定义' }
];

const changeBackground = (index, force = false) => {
  if (index === backgroundType.value && !force) return;
  set.setBackgroundType(index);
};

/* 处理setting的点击事件 */
const handleSettingClick = (event) => {
  // 如果点击的是setting本身（而不是其子元素），则重置站点状态
  if (event.target.classList.contains('setting')) {
    status.setSiteStatus('normal');
  }
};

// 其他原有的方法和变量...
</script>

<style lang="postcss" scoped>
.setting {
  display: flex;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background-color: var(--main-background-light-color);
  backdrop-filter: blur(20px);
  
  /* 自定义滚动条样式 */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(144, 147, 153, 0.3);
    border-radius: 4px;
    transition: all 0.3s;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(144, 147, 153, 0.5);
  }
  
  ::-webkit-scrollbar-corner {
    background: transparent;
  }
  
  .left {
    width: 220px;
    height: 100%;
    border-right: 1px solid var(--main-border-color);
    display: flex;
    flex-direction: column;
    
    .title {
      padding: 20px;
      display: flex;
      flex-direction: column;
      
      span:first-child {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 4px;
        color: var(--main-text-color);
      }
      
      span:last-child {
        font-size: 14px;
        opacity: 0.7;
        color: var(--main-text-color);
      }
    }
    
    .menu {
      flex: 1;
      padding: 0 10px;
      
      .menu-item {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        border-radius: 8px;
        margin-bottom: 8px;
        cursor: pointer;
        transition: all 0.3s;
        color: var(--main-text-color);
        
        .i-icon {
          width: 20px;
          height: 20px;
          margin-right: 12px;
        }
        
        .name {
          font-size: 14px;
        }
        
        &:hover {
          background-color: var(--main-background-hover-color);
        }
        
        &.choose {
          background-color: var(--main-background-hover-color);
          font-weight: bold;
        }
      }
    }
  }
  
  .content {
    flex: 1;
    position: relative;
    padding: 20px;
    overflow-y: auto;
    
    .mask {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: var(--main-background-light-color);
      z-index: 1;
      transition: opacity 0.3s;
    }
    
    .breadcrumb {
      display: flex;
      align-items: center;
      margin-bottom: 20px;
      font-size: 14px;
      color: var(--main-text-color);
      
      span {
        display: flex;
        align-items: center;
        
        .i-icon {
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }
        
        &:first-child {
          margin-right: 8px;
          
          &::after {
            content: '>';
            margin-left: 8px;
          }
        }
      }
    }
    
    .setting-card {
      position: relative;
      z-index: 2;
      
      .title {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 20px;
        color: var(--main-text-color);
      }
      
      .engine-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
        gap: 16px;
        
        .engine-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-radius: 8px;
          background-color: var(--main-background-light-color);
          border: 1px solid var(--main-border-color);
          cursor: pointer;
          transition: all 0.3s;
          
          .i-icon {
            width: 20px;
            height: 20px;
            margin-right: 12px;
          }
          
          .name {
            flex: 1;
            font-size: 14px;
            color: var(--main-text-color);
          }
          
          .menu {
            display: flex;
            
            .i-icon {
              width: 18px;
              height: 18px;
              margin-right: 0;
              opacity: 0.7;
              
              &:hover {
                opacity: 1;
              }
            }
          }
          
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          &.draggable {
            opacity: 0.6;
            transform: scale(0.98);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            border: 1px dashed var(--main-border-color);
          }
        }
      }
      
      .tip-text {
        margin-top: 30px;
        padding-bottom: 20px;
        font-size: 14px;
        color: var(--main-text-color);
        opacity: 0.7;
        text-align: center;
      }
    }
  }
}

/* 适配深色模式 */
:deep([theme="dark"]) {
  .setting {
    /* 深色模式滚动条 */
    ::-webkit-scrollbar-thumb {
      background: rgba(144, 147, 153, 0.2);
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(144, 147, 153, 0.4);
    }
    
    .left {
      border-right-color: var(--main-border-color);
    }
    
    .content {
      .setting-card {
        .engine-item {
          background-color: var(--main-background-light-color);
          border-color: var(--main-border-color);
          
          &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          }
        }
      }
    }
  }
}

/* 原有的样式保留... */
</style>
