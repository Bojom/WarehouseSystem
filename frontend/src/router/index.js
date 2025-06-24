// frontend/src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // pages that don't need layout
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    // pages that need layout
    {
      path: '/',
      component: () => import('../layouts/MainLayout.vue'), // use MainLayout as the root component
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/inventory',
          name: 'inventory',
          component: () => import('../views/InventoryView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: '/parts',
          name: 'parts',
          component: () => import('../views/PartsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'records',
          name: 'records',
          component: () => import('../views/RecordsView.vue'),
          meta: { requiresAuth: true },
        },
        {
          path: 'stock-movement',
          name: 'stock-movement',
          component: () => import('../views/StockMovementView.vue'),
          meta: { requiresAuth: true, roles: ['admin', 'operator'] },
        },
        {
          path: 'suppliers',
          name: 'suppliers',
          component: () => import('../views/SupplierView.vue'),
          meta: { requiresAuth: true, roles: ['admin'] }, // Only admins can see this
        },
        {
          path: '/user-management',
          name: 'user-management',
          component: () => import('../views/UserManagementView.vue'),
          meta: { requiresAuth: true, roles: ['admin'] },
        },
        {
          path: '/register',
          name: 'register',
          component: () => import('../views/RegisterView.vue'),
          meta: { requiresAuth: true, roles: ['admin'] }, // Only admins can access
        },
      ],
    },
  ],
})

// global before each navigation guard
router.beforeEach((to, from, next) => {
  const isAuthenticated = !!localStorage.getItem('token')
  const userRole = localStorage.getItem('userRole') // We'll need to store the role

  // if the target route is not 'login' and the user is not authenticated, redirect to login page
  if (to.name !== 'login' && !isAuthenticated) {
    next({ name: 'login' })
  }
  // if the user is authenticated but trying to access the login page, redirect to dashboard
  else if (to.name === 'login' && isAuthenticated) {
    next({ name: 'dashboard' })
  }
  // check if the route requires a specific role
  else if (to.meta.roles && !to.meta.roles.includes(userRole)) {
    // if the user role does not meet the requirements, redirect to the permission denied page or dashboard
    ElMessage.error('You do not have permission to access this page.')
    next({ name: 'dashboard' })
  }
  // other cases, allow access
  else {
    next()
  }
})

export default router
