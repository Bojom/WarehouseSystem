<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>EuroLink Technologie 仓库管理系统</span>
        </div>
      </template>

      <!--
        1. bind ref: ref="loginFormRef"
        2. bind data object: :model="loginForm"
        3. bind validation rules: :rules="loginRules"
      -->

      <!-- login form -->
      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules">
        <!-- username input -->
        <el-form-item label="用户名/Username" prop="user_name">
          <el-input
            v-model="loginForm.user_name"
            placeholder="请输入用户名/Enter username"
            data-cy="login-username-input"
          ></el-input>
        </el-form-item>

        <!-- password input -->
        <el-form-item label="密码/Password" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码/Enter password"
            show-password
            data-cy="login-password-input"
          ></el-input>
        </el-form-item>

        <!-- login button -->
        <el-form-item>
          <el-button
            type="primary"
            style="width: 100%"
            @click="handleLogin"
            data-cy="login-submit-button"
            >登录/Login</el-button
          >
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/utils/api.js'
import { useRouter } from 'vue-router' // import Vue Router's useRouter
import { ElMessage } from 'element-plus' // import Element Plus's message component
import { useUserStore } from '@/stores/user'

// --- data and references ---
const loginForm = ref({
  user_name: '', // note: the field name must match the body field name in the backend API
  password: '',
})
const loginFormRef = ref(null)
const router = useRouter() // get router instance, used for page navigation

const userStore = useUserStore()

// --- validation rules ---
const loginRules = {
  user_name: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

// --- core: login event handler ---
const handleLogin = async () => {
  if (!loginFormRef.value) return

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      // --- task 1: implement API request ---
      try {
        const response = await api.post('/users/login', loginForm.value)
        const token = response.data.token

        // 1. Set the token in the store
        userStore.setToken(token)

        // 2. Fetch user profile
        await userStore.fetchUser()

        // --- task 2: handle successful response ---
        // 1. display success message
        ElMessage.success('登录成功！')

        // 2. redirect to dashboard page
        router.push('/dashboard')
      } catch (error) {
        // --- task 3: handle failed response ---
        console.error('登录失败:', error)

        // display a clear error message
        ElMessage.error('用户名或密码错误，请重试！')
      }
    } else {
      console.log('表单验证失败')
      return false
    }
  })
}
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
