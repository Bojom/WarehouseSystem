// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'

// 1. 导入创建的页面组件
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PartsView from '../views/PartsView.vue'
import RecordsView from '../views/RecordsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 2. 定义路由规则
  routes: [
    {
      path: '/',
      name: 'login',
      component: LoginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/parts',
      name: 'parts',
      component: PartsView
    },
    {
      path: '/records',
      name: 'records',
      component: RecordsView
    }
  ]
})

export default router