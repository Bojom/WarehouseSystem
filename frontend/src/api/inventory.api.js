import api from '@/utils/api';

/**
 * 获取库存统计数据
 * @returns {Promise}
 */
export const getInventoryStats = () => {
  return api.get('/inventory/status');
};

/**
 * 获取详细的库存列表及状态
 * @returns {Promise}
 */
export const getInventoryDetails = () => {
  return api.get('/inventory/details');
};
