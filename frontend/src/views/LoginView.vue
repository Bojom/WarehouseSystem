<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>EuroLink Technologie 仓库管理系统</span>
        </div>
      </template>

      <!--
        1. 绑定 ref: ref="loginFormRef"
        2. 绑定数据对象: :model="loginForm"
        3. 绑定验证规则: :rules="loginRules"
      -->

      <!-- 登录表单 -->
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
        <!-- 用户名输入框 -->
        <el-form-item label="用户名/Username" prop="user_name">
          <el-input
            v-model="loginForm.user_name"
            placeholder="请输入用户名/Enter username"
          ></el-input>
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码/Password" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码/Enter password"
            show-password
          ></el-input>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button type="primary" style="width: 100%;" @click="handleLogin">登录/Login</el-button>
        </el-form-item>
      </el-form>

    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import api from '@/utils/api.js';
import { useRouter } from 'vue-router'; // 引入 Vue Router 的 useRouter
import { ElMessage } from 'element-plus'; // 引入 Element Plus 的消息提示组件
import { useUserStore } from '@/stores/user';

// --- 数据和引用 ---
const loginForm = ref({
  user_name: '', // 注意：这里的字段名要和后端API接收的body字段名一致
  password: ''
});
const loginFormRef = ref(null);
const router = useRouter(); // 获取 router 实例，用于页面跳转

const userStore = useUserStore();

// --- 验证规则 ---
const loginRules = {
  user_name: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
};

// --- 核心：登录事件处理函数 ---
const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      // --- 任务1: 实现API请求 ---
      try {
        const response = await api.post('/users/login', loginForm.value);
        const token = response.data.token;

        // 1. Set the token in the store
        userStore.setToken(token);

        // 2. Fetch user profile
        await userStore.fetchUser();

        // --- 任务2: 处理成功的响应 ---
        // 1. 显示成功消息
        ElMessage.success('登录成功！');

        // 2. 跳转到仪表盘页面
        router.push('/dashboard');

      } catch (error) {
        // --- 任务3: 处理失败的响应 ---
        console.error('登录失败:', error);

        // 显示一个清晰的错误提示
        ElMessage.error('用户名或密码错误，请重试！');
      }
    } else {
      console.log('表单验证失败');
      return false;
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}
</style>
