// frontend/src/__tests__/LoginView.spec.js
import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import LoginView from '../views/LoginView.vue';
import ElementPlus from 'element-plus';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';

// 模拟一个空的路由
const router = createRouter({
  history: createWebHistory(),
  routes: [],
});

// describe 用于组织测试
describe('LoginView.vue', () => {
  // it (或 test) 是一个具体的测试用例
  it('should update form data when user types in input fields', async () => {
    // 1. 挂载组件
    const wrapper = mount(LoginView, {
      global: {
        plugins: [ElementPlus, createPinia(), router] // 必须提供组件依赖的插件
      }
    });

    // 2. 查找输入框
    // 我们需要给输入框一个明确的标识，比如 data-testid
    // 假设你在 LoginView.vue 的 <el-input> 上添加了 data-testid="username-input"
    const usernameInput = wrapper.find('[data-testid="username-input"] input');
    const passwordInput = wrapper.find('[data-testid="password-input"] input');

    // 3. 模拟用户输入
    await usernameInput.setValue('testuser');
    await passwordInput.setValue('password123');

    // 4. 断言
    // 访问组件实例的数据
    expect(wrapper.vm.loginForm.user_name).toBe('testuser');
    expect(wrapper.vm.loginForm.password).toBe('password123');
  });
});