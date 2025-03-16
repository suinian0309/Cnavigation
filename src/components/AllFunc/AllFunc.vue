<template>
  <!-- 功能区  -->
  <Transition name="fade" mode="out-in">
    <div v-if="status.siteStatus === 'box'" class="feature-panel" :class="status.featurePanelExpanded ? 'big' : ''">
      <AllBox />
    </div>
    <div v-else-if="status.siteStatus === 'set'" class="feature-panel" :class="status.featurePanelExpanded ? 'big' : ''">
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
  width: clamp(28.625%, 57.25%, 57.25%); /* 最小宽度为最大宽度的50% */
  max-width: 888px;
  height: clamp(22.25vh, 44.5vh, 44.5vh); /* 最小高度为最大高度的50% */
  margin-top: -5px;
  color: var(--main-text-color);
  z-index: 10; /* 提高z-index，确保在透明层之上 */
  left: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
  background-color: transparent; /* 修改为透明背景 */
  border-radius: 12px;
  overflow: auto;
  padding: clamp(10px, 20px, 20px); /* 响应式内边距 */
  
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
  transition: opacity 0.1s ease, transform 0.1s ease, height 0.1s ease, width 0.1s ease;
  
  /* 大尺寸变体 */
  &.big {
    height: clamp(27vh, 54vh, 54vh); /* 最小高度为最大高度的50% */
  }
  
  /* 响应式调整 - 使用视口宽度进行更精细的控制 */
  @media (max-width: 1200px) {
    width: 50%;
    padding: 15px;
  }
  
  @media (max-width: 992px) {
    width: 60%;
    padding: 12px;
  }
  
  @media (max-width: 768px) {
    width: 70%;
    padding: 10px;
  }
  
  @media (max-width: 576px) {
    width: 80%;
    height: 35vh;
    padding: 8px;
    
    &.big {
      height: 45vh;
    }
  }
  
  @media (max-width: 478px) {
    width: 90%;
    height: 30vh;
    
    &.big {
      height: 40vh;
    }
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
            font-size: clamp(14px, 16px, 16px);
          }
          
          .tip {
            font-size: clamp(11px, 13px, 13px);
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
        
        @media (max-width: 576px) {
          width: 120px;
          min-width: 120px;
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
  
  /* 响应式调整 */
  @media (max-width: 576px) {
    .shortcut-item {
      transform: scale(0.9);
      
      .icon-wrapper {
        width: 70px;
        height: 70px;
      }
      
      .shortcut-name {
        font-size: 11px;
      }
    }
  }
  
  @media (max-width: 478px) {
    .shortcut-item {
      transform: scale(0.8);
      
      .icon-wrapper {
        width: 60px;
        height: 60px;
      }
    }
  }
}
</style>
