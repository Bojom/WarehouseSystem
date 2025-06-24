<template>
  <div class="user-management-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>User Management</span>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="user_name" label="Username"></el-table-column>
        <el-table-column label="Role">
          <template #default="scope">
            <el-select
              :model-value="scope.row.user_role"
              @change="(newRole) => handleRoleChange(scope.row.id, newRole)"
              :disabled="scope.row.id === userStore.user?.id"
            >
              <el-option label="Admin" value="admin"></el-option>
              <el-option label="Operator" value="operator"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Status">
          <template #default="scope">
            <el-select
              :model-value="scope.row.status"
              @change="(newStatus) => handleStatusChange(scope.row.id, newStatus)"
              :disabled="scope.row.id === userStore.user?.id"
            >
              <el-option label="Active" value="active"></el-option>
              <el-option label="Pending" value="pending"></el-option>
              <el-option label="Paused" value="paused"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="Creation Time" width="200">
          <template #default="scope">{{
            new Date(scope.row.creation_time).toLocaleString()
          }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { getAllUsers, updateUserRole, updateUserStatus } from '@/api/user.api'

const users = ref([])
const loading = ref(false)
const userStore = useUserStore()

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await getAllUsers()
    users.value = response.data
  } catch {
    ElMessage.error('Failed to fetch users.')
  } finally {
    loading.value = false
  }
}

const handleRoleChange = async (userId, newRole) => {
  try {
    await updateUserRole(userId, newRole)
    ElMessage.success('User role updated successfully.')
    // Find the user and update their role locally to reflect the change immediately
    const user = users.value.find((u) => u.id === userId)
    if (user) user.user_role = newRole
  } catch {
    ElMessage.error('Failed to update user role.')
    fetchUsers() // Refetch to revert optimistic update
  }
}

const handleStatusChange = async (userId, newStatus) => {
  try {
    await updateUserStatus(userId, newStatus)
    ElMessage.success('User status updated successfully.')
    // Find the user and update their status locally
    const user = users.value.find((u) => u.id === userId)
    if (user) user.status = newStatus
  } catch {
    ElMessage.error('Failed to update user status.')
    fetchUsers() // Refetch to revert optimistic update
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.user-management-view {
  padding: 20px;
}
</style>
