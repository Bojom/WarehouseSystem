<template>
  <div class="register-view">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span>创建新用户 Create New User</span>
        </div>
      </template>
      <el-form :model="form" :rules="rules" ref="registerFormRef" label-width="150px">
        <el-form-item label="Username" prop="username">
          <el-input v-model="form.username" placeholder="Enter username"></el-input>
        </el-form-item>
        <el-form-item label="Password" prop="password">
          <el-input
            type="password"
            v-model="form.password"
            placeholder="Enter password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="Confirm Password" prop="confirmPassword">
          <el-input
            type="password"
            v-model="form.confirmPassword"
            placeholder="Confirm password"
            show-password
          ></el-input>
        </el-form-item>
        <el-form-item label="Role" prop="role">
          <el-select v-model="form.role" placeholder="Select role">
            <el-option label="Admin" value="admin"></el-option>
            <el-option label="Operator" value="operator"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">Create User</el-button>
          <el-button @click="handleReset">Reset</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { registerUser } from '@/api/user.api'

const registerFormRef = ref(null)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  role: 'operator',
})

const validatePass = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('Please input the password again'))
  } else if (value !== form.password) {
    callback(new Error("Passwords don't match!"))
  } else {
    callback()
  }
}

const rules = reactive({
  username: [{ required: true, message: 'Please input username', trigger: 'blur' }],
  password: [
    { required: true, message: 'Please input password', trigger: 'blur' },
    { min: 6, message: 'Password must be at least 6 characters long', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: 'Please confirm your password', trigger: 'blur' },
    { validator: validatePass, trigger: 'blur' },
  ],
  role: [{ required: true, message: 'Please select a role', trigger: 'change' }],
})

const handleSubmit = async () => {
  if (!registerFormRef.value) return
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const userData = {
          user_name: form.username,
          password: form.password,
          user_role: form.role,
        }
        await registerUser(userData)
        ElMessage.success('User created successfully!')
        handleReset() // Clear form for next entry
      } catch (error) {
        ElMessage.error(error.response?.data?.message || 'Failed to create user')
      } finally {
        loading.value = false
      }
    }
  })
}

const handleReset = () => {
  if (!registerFormRef.value) return
  registerFormRef.value.resetFields()
}
</script>

<style scoped>
.register-view {
  padding: 20px;
}
.form-card {
  max-width: 600px;
  margin: 0 auto;
}
</style>
