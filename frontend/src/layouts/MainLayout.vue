<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside width="250px">
      <div class="logo">EuroLink Technologie</div>
      <el-menu
        :default-active="$route.path"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><i-ep-data-analysis /></el-icon>
          <span>仪表盘 (Dashboard)</span>
        </el-menu-item>
        <el-menu-item index="/inventory">
          <el-icon><i-ep-pie-chart /></el-icon>
          <span>库存概览 (Inventory)</span>
        </el-menu-item>
        <el-menu-item index="/parts">
          <el-icon><i-ep-setting /></el-icon>
          <span>配件管理 (Parts)</span>
        </el-menu-item>
        <el-menu-item index="/stock-movement">
          <el-icon><i-ep-sort /></el-icon>
          <span>出入库登记 (Stock Movement)</span>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><i-ep-document /></el-icon>
          <span>出入库记录 (Records)</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <div>面包屑导航 (Breadcrumb)</div>
        <div class="user-info">
          <span>欢迎, admin</span>
          <el-button type="danger" plain>退出登录 (Logout)</el-button>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-main>
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
// 如果需要，可以在这里添加逻辑，例如处理退出登录
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
.el-menu-item:hover, .el-menu-item.is-active {
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
</style>
