<template>
  <el-container class="main-layout">
    <!-- sidebar -->
    <el-aside
      :width="isCollapsed ? '64px' : '250px'"
      class="sidebar"
      @mouseenter="isCollapsed = false"
      @mouseleave="isCollapsed = true"
    >
      <div class="logo">
        <span v-if="!isCollapsed">EuroLink Technologie</span>
        <span v-else>EL</span>
      </div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        router
        :collapse="isCollapsed"
        :collapse-transition="false"
      >
        <el-menu-item index="/dashboard">
          <el-icon><i-ep-data-analysis /></el-icon>
          <template #title>
            <span>仪表盘 (Dashboard)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><i-ep-pie-chart /></el-icon>
          <template #title>
            <span>库存概览 (Inventory)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/parts">
          <el-icon><i-ep-setting /></el-icon>
          <template #title>
            <span>配件管理 (Parts)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/stock-movement">
          <el-icon><i-ep-sort /></el-icon>
          <template #title>
            <span>出入库登记 (Stock Movement)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><i-ep-document /></el-icon>
          <template #title>
            <span>出入库记录 (Records)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/suppliers" v-if="userStore.isAdmin">
          <el-icon><i-ep-van /></el-icon>
          <template #title>
            <span>供应商管理 (Suppliers)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/user-management" v-if="userStore.isAdmin">
          <el-icon><i-ep-setting /></el-icon>
          <template #title>
            <span>用户管理 (User Management)</span>
          </template>
        </el-menu-item>
        <el-menu-item index="/register" v-if="userStore.isAdmin">
          <el-icon><i-ep-user /></el-icon>
          <template #title>
            <span>创建用户 (Create User)</span>
          </template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- top bar -->
      <el-header class="header">
        <div>面包屑导航 (Breadcrumb)</div>
        <div class="user-info">
          <span>欢迎, {{ userStore.user?.user_name || '用户' }}</span>
          <el-button type="danger" plain @click="handleLogout">退出登录 (Logout)</el-button>
        </div>
      </el-header>

      <!-- main content area -->
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { onMounted, ref } from 'vue'

const router = useRouter()
const userStore = useUserStore()
const isCollapsed = ref(true)

onMounted(() => {
  // Fetch user info when the layout is mounted
  // This ensures we have the role information
  if (!userStore.user) {
    userStore.fetchUser()
  }
})

const handleLogout = () => {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.main-layout {
  height: 100vh;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  background-color: #001529;
  color: white;
  white-space: nowrap; /* prevent text from wrapping */
  overflow: hidden; /* hide the overflow */
}
.el-aside {
  background-color: #001529;
}
.el-menu-vertical {
  height: calc(100vh - 60px);
  border-right: none;
  background-color: #001529;
}
.el-menu-item {
  color: #fff;
}
.el-menu-item:hover,
.el-menu-item.is-active {
  background-color: #1890ff !important;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
}
.user-info {
  display: flex;
  align-items: center;
}
.user-info span {
  margin-right: 15px;
}
.sidebar {
  transition: width 0.3s;
  background-color: #001529;
}
</style>
