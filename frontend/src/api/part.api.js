// frontend/src/api/part.api.js
import api from '@/utils/api';

/**
 * 获取配件列表（带分页和搜索）
 * @param {object} params - 查询参数，例如 { page, pageSize, search }
 * @returns {Promise}
 */
export const getParts = (params) => {
  return api.get('/parts', { params });
};

/**
 * 创建新配件
 * @param {object} partData - 配件数据
 * @returns {Promise}
 */
export const createPart = (partData) => {
  return api.post('/parts', partData);
};

/**
 * 更新配件信息
 * @param {number} id - 配件ID
 * @param {object} partData - 需要更新的配件数据
 * @returns {Promise}
 */
export const updatePart = (id, partData) => {
  return api.put(`/parts/${id}`, partData);
};

/**
 * 删除配件
 * @param {number} id - 配件ID
 * @returns {Promise}
 */
export const deletePart = (id) => {
  return api.delete(`/parts/${id}`);
};