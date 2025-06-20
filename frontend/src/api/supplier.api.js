// frontend/src/api/supplier.api.js
import api from '@/utils/api'; // 引入我们配置好的axios实例

/**
 * 获取所有供应商的列表
 * @param {object} params - 查询参数, 例如 { page: 1, pageSize: 10 }
 * @returns {Promise}
 */
export const getSuppliers = (params) => {
  return api.get('/supplier', { params });
};

/**
 * 创建一个新的供应商
 * @param {object} data - 供应商数据
 * @returns {Promise}
 */
export const createSupplier = (data) => {
  return api.post('/supplier', data);
};

/**
 * 更新一个已有的供应商
 * @param {number} id - 供应商ID
 * @param {object} data - 需要更新的供应商数据
 * @returns {Promise}
 */
export const updateSupplier = (id, data) => {
  return api.put(`/supplier/${id}`, data);
};

/**
 * 删除一个供应商
 * @param {number} id - 供应商ID
 * @returns {Promise}
 */
export const deleteSupplier = (id) => {
  return api.delete(`/supplier/${id}`);
};
