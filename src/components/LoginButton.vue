<template>
  <div>
    <!-- 登录按钮 -->
    <div
      class="change-status"
      :title="isLoggedIn ? '个人中心' : '登录'"
      @click.stop="handleLoginClick"
    >
      <SvgIcon :iconName="`icon-${isLoggedIn ? 'yidenglu-zaixian' : 'denglu'}`" />
    </div>
    
    <!-- 登录对话框 -->
    <n-modal
      v-model:show="showLoginModal"
      preset="dialog"
      title="提示"
      positive-text="好的"
      negative-text="取消"
      @positive-click="goToLogin"
      @negative-click="cancelLogin"
    >
      <template #icon>
        <n-icon color="#2080f0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM11 7h2v2h-2V7zm0 4h2v6h-2v-6z"/>
          </svg>
        </n-icon>
      </template>
      <div>请您先登录账号，以便同步您的个人设置。</div>
    </n-modal>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { userStore } from '@/stores';
import { NModal, NIcon, useMessage } from 'naive-ui';
import SvgIcon from '@/components/SvgIcon.vue';

const user = userStore();
const { isLoggedIn } = storeToRefs(user);
const showLoginModal = ref(false);
const message = useMessage();

/* 处理登录按钮点击 */
const handleLoginClick = () => {
  if (!isLoggedIn.value) {
    showLoginModal.value = true;
  } else {
    // 已登录，跳转到个人中心
    message.info('跳转到个人中心');
  }
};

/* 前往登录页面 */
const goToLogin = () => {
  message.info('跳转到登录页面');
  // 这里可以添加跳转到登录页面的逻辑
};

/* 取消登录 */
const cancelLogin = () => {
  showLoginModal.value = false;
};
</script>

<style lang="postcss" scoped>
.change-status {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  border-radius: 8px;
  color: var(--main-text-color);
  background-color: var(--main-background-light-color);
  backdrop-filter: blur(10px);
  transition: all 0.1s ease;

  &:hover {
    background-color: var(--main-background-hover-color);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  .i-icon {
    font-size: 18px;
    fill: currentColor;
    color: inherit;
  }
}
</style> 