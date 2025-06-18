<template>
  <div class="dashboard-container">
    <el-card class="box-card">
      <template #header>
        <div class="card-header">
          <span>仪表盘 / Dashboard</span>
          <el-button type="danger" @click="handleLogout">登出 / Sign Out</el-button>
        </div>
      </template>

      <!-- 用户信息展示 -->
      <div v-if="user" class="user-profile">
        <p><strong>用户ID / User ID:</strong> {{ user.id }}</p>
        <p><strong>用户角色 / User Role:</strong> {{ user.role }}</p>
        <p><strong>用户名 / User Name:</strong> {{ user.username }}</p>
        <!-- 你可以根据需要，在这里展示更多的用户信息 -->
      </div>
      <div v-else>
        <p>正在加载用户信息... / loading user info...</p>
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useUserStore } from '@/stores/user';

const router = useRouter();
const userStore = useUserStore();

const user = computed(() => userStore.user);

// --- 登出功能 ---
const handleLogout = () => {
  userStore.logout();
  ElMessage.success('您已成功登出！/Sign out successfully');
  router.push('/login');
};

// 在组件挂载后，如果store中没有用户信息，则尝试获取
onMounted(() => {
  if (!user.value) {
    userStore.fetchUser().catch(() => {
      // fetchUser will handle logout on failure, but we can redirect here
      router.push('/login');
    });
  }
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.user-profile p {
  font-size: 16px;
  line-height: 1.8;
}
</style>
