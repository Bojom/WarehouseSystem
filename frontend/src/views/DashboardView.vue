<template>
  <div>
    <h1>仪表盘</h1>
    <h2>来自后端的消息:</h2>
    <p style="color: green; font-weight: bold;">{{ message }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'; // 引入Vue的核心功能
import axios from 'axios'; // 引入axios用于API请求

// 1. 创建一个响应式的变量来存储从后端获取的消息
//    ref('') 表示它的初始值是一个空字符串
const message = ref('');

// 2. onMounted 是一个生命周期钩子函数
//    它会在组件被加载到页面上之后自动执行
onMounted(async () => {
  try {
    // 3. 使用 axios 发送 GET 请求到我们的后端API
    //    'await' 会暂停这里的代码，直到请求完成并收到响应
    const response = await axios.get('http://localhost:3001/api/test');
    
    // 4. 请求成功后，将响应数据中的 message 字段赋值给我们的响应式变量
    //    必须使用 .value 来修改 ref 创建的变量
    message.value = response.data.message;

  } catch (error) {
    // 5. 如果请求失败（比如后端没开，或URL写错了），就在页面上显示错误信息
    message.value = '无法连接到后端服务器。';
    console.error('获取数据失败:', error); // 在浏览器控制台打印详细错误
  }
});
</script>

<style scoped>
/* 你可以添加一些样式 */
p {
  font-size: 1.2rem;
}
</style>