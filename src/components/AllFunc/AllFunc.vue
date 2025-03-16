<template>
  <!-- 功能区 - 直接使用 feature-panel 作为唯一容器 -->
  <Transition name="fade" mode="out-in">
    <div v-if="status.siteStatus === 'box'" class="feature-panel" :class="status.featurePanelExpanded ? 'big' : ''" @click.stop>
      <AllBox />
    </div>
    <div v-else-if="status.siteStatus === 'set'" class="feature-panel" :class="status.featurePanelExpanded ? 'big' : ''" @click.stop>
      <AllSet />
    </div>
  </Transition>
</template>

<script setup>
import { statusStore } from "@/stores";
import AllBox from "@/components/AllFunc/AllBox.vue";
import AllSet from "@/components/AllFunc/AllSet.vue";

const status = statusStore();
</script>

<style lang="postcss" scoped>
/* 定义CSS变量 */
:root {
  --content-max-height: calc(64vh - 84px);
  --content-no-padding-height: calc(64vh - 44px);
}

/* 主功能面板 */
.feature-panel {
  position: absolute;
  width: 57.25%;
  max-width: 888px;
  height: 44.5vh;
  margin-top: -5px;
  color: var(--main-text-color);
  z-index: 10; /* 提高z-index，确保在透明层之上 */
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  background-color: transparent; /* 修改为透明背景 */
  border-radius: 12px;
  overflow: auto;
  padding: 20px;
  
  /* 移除模糊效果和阴影 */
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
  
  /* 滚动条样式 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--main-background-hover-color);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: transparent;
  }
  
  /* 过渡只应用于需要的属性 */
  transition: opacity 0.1s ease, transform 0.1s ease, height 0.1s ease;
  
  /* 大尺寸变体 */
  &.big {
    height: 54vh;
  }
  
  /* 响应式调整 */
  @media (max-width: 478px) {
    width: 60.4%;
    height: 41.3vh;
  }
}

/* 设置面板 */
:deep(.all-set) {
  overflow: hidden;
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background-color: var(--main-background-light-color);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--main-box-shadow);
  
  /* 滚动区域 */
  .scrollbar {
    max-height: var(--content-max-height);
    transition: max-height 0.1s;
    width: 100%;
  }
  
  /* 设置项 */
  .set-item {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 12px;
    border: none;
    box-shadow: var(--main-box-shadow);
    --n-color: var(--main-background-light-color);
    
    &:last-child {
      margin-bottom: 0;
    }
    
    /* 内容布局 */
    .n-card__content {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      
      /* 描述区域 */
      .desc {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        
        @media (max-width: 720px) {
          flex-direction: column;
          align-items: flex-start;
          
          .name {
            margin-bottom: 8px;
          }
        }
        
        /* 名称区域 */
        .name {
          display: flex;
          flex-direction: column;
          
          .title {
            font-size: 16px;
          }
          
          .tip {
            font-size: 13px;
            opacity: 0.8;
          }
        }
      }
      
      /* 控制区域 */
      .set {
        width: 200px;
        
        @media (max-width: 768px) {
          width: 140px;
          min-width: 140px;
        }
      }
    }
  }
}

/* 快捷方式面板 */
:deep(.all-box) {
  overflow: hidden;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  background-color: var(--main-background-light-color);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: var(--main-box-shadow);
  
  /* 标签页内容 */
  .n-tab-pane {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    box-sizing: border-box;
    
    /* 滚动区域 */
    .scrollbar {
      max-height: var(--content-max-height);
      width: 100%;
    }
    
    /* 无快捷方式提示 */
    .not-shortcut {
      min-height: var(--content-max-height);
      width: 100%;
    }
    
    /* 无内边距处理 */
    &.no-padding .scrollbar {
      max-height: var(--content-no-padding-height);
    }
  }
}
</style>
