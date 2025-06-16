// frontend/src/utils/api.js

import axios from 'axios';
import { ElMessage } from 'element-plus';

// 1. 创建一个新的 Axios 实例
const api = axios.create({
  // 配置基础URL，所有请求都会自动添加这个前缀
  baseURL: 'http://localhost:3001/api', 
  // 设置请求超时时间
  timeout: 10000, 
});

// 2. 添加请求拦截器 (Request Interceptor)
api.interceptors.request.use(
  (config) => {
    // 在每个请求发送之前执行
    const token = localStorage.getItem('token');
    if (token) {
      // 如果存在 token，则在请求头中添加 Authorization 字段
      // 'Bearer ' 是一个标准的前缀，后面跟上你的 token
      config.headers['Authorization'] = 'Bearer ' + token;
    }
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    return Promise.reject(error);
  }
);

// 3. (可选但推荐) 添加响应拦截器 (Response Interceptor)
api.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    // 任何2xx范围内的状态码都会触发该函数
    return response;
  },
  (error) => {
    // 任何超出2xx范围的状态码都会触发该函数
    // 在这里可以做全局的错误处理
    if (error.response) {
      // 服务器返回了错误状态码
      switch (error.response.status) {
        case 401:
          // 例如：未授权，可能是token过期或无效
          ElMessage.error('登录已过期，请重新登录');
          // 可以跳转到登录页
          // window.location.href = '/login'; 
          break;
        // 其他错误处理...
      }
    }
    return Promise.reject(error);
  }
);

// 4. 导出这个配置好的实例
export default api;