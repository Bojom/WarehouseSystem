// frontend/src/stores/user.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

// 定义一个名为 'user' 的 store
export const useUserStore = defineStore('user', () => {
  // --- State ---
  const user = ref(null)
  const token = ref(localStorage.getItem('token'))

  // --- Getters ---
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  // --- Actions ---
  function setToken(newToken) {
    token.value = newToken
    if (newToken) {
      localStorage.setItem('token', newToken)
    } else {
      localStorage.removeItem('token')
    }
  }

  function setUser(newUser) {
    user.value = newUser
    // Also store the role in localStorage for the router guard
    if (newUser && newUser.role) {
      localStorage.setItem('userRole', newUser.role)
    } else {
      localStorage.removeItem('userRole')
    }
  }

  async function fetchUser() {
    if (token.value && !user.value) {
      try {
        const response = await api.get('/users/profile')
        if (response.data && response.data.userProfile) {
          setUser(response.data.userProfile)
        } else {
          // If the profile can't be fetched, the token is likely invalid.
          logout()
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
        logout() // Logout on error
      }
    }
  }

  function logout() {
    setUser(null)
    setToken(null)
  }

  return { user, token, isAuthenticated, isAdmin, setUser, setToken, fetchUser, logout }
})
