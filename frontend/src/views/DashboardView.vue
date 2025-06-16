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
      <div v-if="userProfile" class="user-profile">
        <p><strong>用户ID / User ID:</strong> {{ userProfile.id }}</p>
        <p><strong>用户角色 / User Role:</strong> {{ userProfile.role }}</p>
        <p><strong>用户名 / User Name:</strong> {{ userProfile.username }}</p>
        <!-- 你可以根据需要，在这里展示更多的用户信息 -->
      </div>
      <div v-else>
        <p>正在加载用户信息... / loading user info...</p>
      </div>

    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import api from '@/utils/api'; // 使用我们配置好的axios实例

const router = useRouter();
const userProfile = ref(null);

// --- 任务1: 登出功能 ---
const handleLogout = () => {
  // 1. 从 localStorage 中移除 token
  localStorage.removeItem('token');

  // 2. 给出成功提示
  ElMessage.success('您已成功登出！/Sign out successfully');

  // 3. 跳转回登录页面
  router.push('/login');
};


// --- 任务3: 测试受保护的API ---
const fetchUserProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    userProfile.value = response.data.userProfile;
  } catch (error) {
    console.error('获取用户信息失败:', error);
    ElMessage.error('无法获取用户信息，请重新登录。/Cannot gather userinfo, please login again.');
    // 如果获取失败（比如token过期），也可以强制登出
    handleLogout();
  }
};

// 在组件挂载后，自动调用函数获取用户信息
onMounted(() => {
  fetchUserProfile();
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