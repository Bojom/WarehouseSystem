// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'

// 1. 导入创建的页面组件
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PartsView from '../views/PartsView.vue'
import RecordsView from '../views/RecordsView.vue'
import MainLayout from '../layouts/MainLayout.vue' // 1. 导入 MainLayout

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // 不需要布局的页面
    {
      path: '/login',
      name: 'login',
      component: LoginView
    },
    // 需要统一布局的页面
    {
      path: '/',
      component: MainLayout, // 2. 使用 MainLayout 作为根组件
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: DashboardView,
          meta: { requiresAuth: true }
        },
        {
          path: 'parts',
          name: 'parts',
          component: PartsView,
          meta: { requiresAuth: true }
        },
        {
          path: 'records',
          name: 'records',
          component: RecordsView,
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 全局前置导航守卫
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token');

  // 如果目标路由不是 'login' 并且用户未认证，则重定向到登录页
  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' });
  }
  // 如果用户已认证，但试图访问登录页，则重定向到仪表盘
  else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' });
  }
  // 其他情况，正常放行
  else {
    next();
  }
});

export default router
