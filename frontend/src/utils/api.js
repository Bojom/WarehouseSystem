// frontend/src/utils/api.js

import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. create a new Axios instance
const api = axios.create({
  // configure the base URL, all requests will automatically add this prefix
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // set the request timeout
  timeout: 10000,
})

// 2. add request interceptor (Request Interceptor)
api.interceptors.request.use(
  (config) => {
    // execute before each request
    const token = localStorage.getItem('token')
    if (token) {
      // if token exists, add the Authorization field to the request header
      // 'Bearer ' is a standard prefix, followed by your token
      config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    // do something with the request error
    return Promise.reject(error)
  },
)

// 3. (optional but recommended) add response interceptor (Response Interceptor)
api.interceptors.response.use(
  (response) => {
    // do something with the response data
    // any 2xx status code will trigger this function
    return response
  },
  (error) => {
    // any status code outside the 2xx range will trigger this function
    // here you can do global error handling
    if (error.response) {
      // server returned an error status code
      switch (error.response.status) {
        case 401:
          // e.g. unauthorized, maybe the token expired or invalid
          ElMessage.error('登录已过期，请重新登录')
          // can redirect to login page
          // window.location.href = '/login';
          break
        // other error handling...
      }
    }
    return Promise.reject(error)
  },
)

// 4. export this configured instance
export default api
