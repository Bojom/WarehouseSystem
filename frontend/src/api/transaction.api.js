import api from '@/utils/api'

/**
 * 获取所有交易记录
 * @param {object} params - 查询参数
 * @returns {Promise}
 */
export const getTransactions = (params) => {
  return api.get('/transactions', { params })
}

/**
 * 创建一个新的交易记录
 * @param {object} data - 交易数据 { part_id, trans_type, quantity, remarks }
 * @returns {Promise}
 */
export const createTransaction = (data) => {
  return api.post('/transactions', data)
}

/**
 * 导出交易记录为 Excel
 * @returns {Promise}
 */
export const exportTransactions = (params) => {
  const requestParams = { ...params }
  if (requestParams.partIds && requestParams.partIds.length > 0) {
    requestParams.partId = requestParams.partIds.join(',')
  }
  delete requestParams.partIds

  return api.get('/transactions/export', {
    params: requestParams,
    responseType: 'blob', // Important for file downloads
  })
}

// 新增：报告故障配件
export function reportFault(faultData) {
  return api.post('/transactions/fault', faultData)
}
