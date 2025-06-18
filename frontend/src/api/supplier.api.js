// frontend/src/api/supplier.api.js
import api from '@/utils/api'; // 引入我们配置好的axios实例

/**
 * 获取所有供应商的列表
 * @returns {Promise}
 */
export const getSuppliers = () => {
  return api.get('/suppliers');
};
