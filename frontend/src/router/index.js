// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'

// 1. 导入创建的页面组件
import LoginView from '../views/LoginView.vue'
import DashboardView from '../views/DashboardView.vue'
import PartsView from '../views/PartsView.vue'
import RecordsView from '../views/RecordsView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // 定义路由规则
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
// 全局前置导航守卫
router.beforeEach((to, from, next) => {
  // to: 即将要进入的目标路由对象
  // from: 当前导航正要离开的路由对象
  // next: 一个必须执行的函数，决定导航的行为

  const isAuthenticated = !!localStorage.getItem('token'); // 检查是否存在token

  // 检查目标路径是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth && !isAuthenticated) {
    // 如果此路由需要认证，但用户未认证
    next({ name: 'login' }); // 重定向到登录页
  } else if (to.name === 'login' && isAuthenticated) {
    // 如果用户已认证，但试图访问登录页，则重定向到仪表盘
    next({ name: 'dashboard' });
  } else {
    // 其他情况，正常放行
    next();
  }
});

const routes = [
  {
    path: '/login', // 登录页不需要认证
    name: 'login',
    component: LoginView
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true } // <-- 添加这个 meta 字段
  },
  {
    path: '/parts',
    name: 'parts',
    component: PartsView,
    meta: { requiresAuth: true } // <-- 添加这个 meta 字段
  },
  {
    path: '/records',
    name: 'records',
    component: RecordsView,
    meta: { requiresAuth: true } // <-- 添加这个 meta 字段
  },
  // 添加一个根路径重定向，如果用户已登录则去dashboard，否则去login
  {
    path: '/',
    redirect: () => {
      return localStorage.getItem('token') ? '/dashboard' : '/login';
    }
  }
];
export default router