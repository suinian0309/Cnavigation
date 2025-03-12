import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    isLoggedIn: false,
    userInfo: null,
  }),
  actions: {
    async login(credentials) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
        const data = await response.json();
        if (data.success) {
          this.isLoggedIn = true;
          this.userInfo = data.user;
          return true;
        }
        return false;
      } catch (error) {
        console.error('登录失败:', error);
        return false;
      }
    },
    async logout() {
      try {
        await fetch('/api/auth/logout');
        this.isLoggedIn = false;
        this.userInfo = null;
      } catch (error) {
        console.error('登出失败:', error);
      }
    },
  },
});