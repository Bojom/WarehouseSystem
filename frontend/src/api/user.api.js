import api from '@/utils/api'

/**
 * Register a new user (admin only)
 * @param {object} userData - { user_name, password, user_role }
 * @returns {Promise}
 */
export const registerUser = (userData) => {
  return api.post('/users/register', userData)
}

/**
 * Get all users (admin only)
 * @returns {Promise}
 */
export const getAllUsers = () => {
  return api.get('/users')
}

/**
 * Update a user's role (admin only)
 * @param {number} userId
 * @param {string} role
 * @returns {Promise}
 */
export const updateUserRole = (userId, role) => {
  return api.put(`/users/${userId}/role`, { role })
}

/**
 * Update a user's status (admin only)
 * @param {number} userId
 * @param {string} status
 * @returns {Promise}
 */
export const updateUserStatus = (userId, status) => {
  return api.put(`/users/${userId}/status`, { status })
}
