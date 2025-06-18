import api from '@/utils/api';

/**
 * 创建一个新的出入库事务
 * @param {object} transactionData - 事务数据
 * @returns {Promise}
 */
export const createTransaction = (transactionData) => {
  return api.post('/transactions', transactionData);
};
