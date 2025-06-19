<template>
  <div class="records-view">
    <!-- 1. 顶部筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="时间范围 / Time Range">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至 / To"
            start-placeholder="开始日期 / Start Date"
            end-placeholder="结束日期 / End Date"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="配件 / Part">
          <el-select
            v-model="queryParams.partIds"
            placeholder="请选择配件 / Please select a part"
            clearable
            filterable
            multiple
            collapse-tags
          >
            <el-option
              v-for="part in partsForSelect"
              :key="part.id"
              :label="`${part.part_name} (${part.part_number})`"
              :value="part.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型 / Operation Type">
          <el-select v-model="queryParams.type" placeholder="请选择类型 / Please select a type" clearable>
            <el-option label="入库 / In" value="IN" />
            <el-option label="出库 / Out" value="OUT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询 / Search</el-button>
          <el-button @click="resetQuery">重置 / Reset</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 操作区域 -->
    <el-card class="action-card">
      <el-button type="success" @click="handleExport">导出Excel / Export Excel</el-button>
    </el-card>

    <!-- 3. 数据表格和分页 -->
    <el-card>
      <el-table v-loading="loading" :data="recordsList" border>
        <el-table-column label="操作时间 / Operation Time" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.transaction_time) }}
          </template>
        </el-table-column>
        <el-table-column prop="Part.part_number" label="配件编号 / Part Number" width="200" />
        <el-table-column prop="Part.part_name" label="配件名称 / Part Name" />
        <el-table-column label="类型 / Type" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.type === 'IN' ? 'success' : 'warning'">
              {{ scope.row.type === 'IN' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量 / Quantity" align="center" width="100" />
        <el-table-column prop="User.username" label="经手人 / Operator" width="120" />
        <el-table-column prop="remarks" label="备注 / Remarks" />
      </el-table>

      <el-pagination
        class="pagination"
        background
        layout="prev, pager, next, total"
        :total="total"
        :page-size="queryParams.pageSize"
        :current-page="queryParams.page"
        @current-change="handlePageChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';
import { getParts } from '@/api/part.api'; // 引入配件API

// --- 工具函数 ---
const formatDateTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);

  // 1. 使用本地时间获取器格式化日期和时间组件
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 2. 计算UTC偏移量
  // getTimezoneOffset() 返回本地时间与UTC时间之间的分钟差
  // 符号与常规约定相反（例如，UTC+2 返回 -120）
  const offsetMinutes = date.getTimezoneOffset();
  const offsetHours = -offsetMinutes / 60;

  // 3. 创建偏移字符串（例如 "UTC+2" 或 "UTC-5"）
  const offsetSign = offsetHours >= 0 ? '+' : '-';
  // 对于整数小时，我们不需要小数部分
  const offsetValue = Number.isInteger(offsetHours)
    ? Math.abs(offsetHours)
    : Math.abs(offsetHours).toFixed(2);
  const offsetString = `UTC${offsetSign}${offsetValue}`;

  // 4. 组合并返回最终字符串
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${offsetString}`;
};

// --- 状态管理 ---
const recordsList = ref([]);
const total = ref(0);
const loading = ref(false);
const partsForSelect = ref([]); // 用于配件下拉选择
const dateRange = ref([]); // 用于存储日期范围选择器的值

// 查询参数
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  partIds: [],
  type: '',
  startDate: '',
  endDate: '',
});

// --- 数据获取 ---
const fetchRecords = async () => {
  loading.value = true;
  // 从 dateRange 更新 queryParams
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startDate = dateRange.value[0];
    queryParams.endDate = dateRange.value[1];
  } else {
    queryParams.startDate = '';
    queryParams.endDate = '';
  }

  // 准备要发送的参数，partIds 需要特殊处理
  const paramsToSend = { ...queryParams };
  if (paramsToSend.partIds && paramsToSend.partIds.length > 0) {
    // 后端需要的是 partId, 值为逗号分隔的字符串
    paramsToSend.partId = paramsToSend.partIds.join(',');
  }
  delete paramsToSend.partIds; // 删除旧的 partIds 属性

  try {
    const response = await api.get('/transactions', { params: paramsToSend });
    recordsList.value = response.data.transactions;
    total.value = response.data.totalItems;
  } catch (error) {
    console.error('获取记录失败:', error);
  } finally {
    loading.value = false;
  }
};

// 获取用于筛选的配件列表（不需要分页）
const fetchAllPartsForSelect = async () => {
  try {
    // 假设 getParts 支持传入一个很大的 pageSize 来获取所有
    const response = await getParts({ pageSize: 10000 });
    partsForSelect.value = response.data.parts;
  } catch (error) {
    console.error('获取配件下拉列表失败:', error);
  }
};

// --- 事件处理 ---
const handleSearch = () => {
  queryParams.page = 1;
  fetchRecords();
};

const resetQuery = () => {
  queryParams.page = 1;
  queryParams.partIds = [];
  queryParams.type = '';
  dateRange.value = [];
  fetchRecords();
};

const handlePageChange = (newPage) => {
  queryParams.page = newPage;
  fetchRecords();
};

const handleExport = () => {
  // 1. 获取 token
  const token = localStorage.getItem('token');
  if (!token) {
    ElMessage.error('请先登录！');
    return;
  }

  // 2. 准备筛选参数
  const exportParams = { ...queryParams };
  delete exportParams.page;
  delete exportParams.pageSize;

  // 将 partIds 数组转换为逗号分隔的字符串, 并使用 partId 作为键
  if (exportParams.partIds && exportParams.partIds.length > 0) {
    exportParams.partId = exportParams.partIds.join(',');
  }
  delete exportParams.partIds;

  // 更新日期参数
  if (dateRange.value && dateRange.value.length === 2) {
    exportParams.startDate = dateRange.value[0];
    exportParams.endDate = dateRange.value[1];
  } else {
    exportParams.startDate = '';
    exportParams.endDate = '';
  }

  // 过滤掉值为空的参数
  const filteredParams = Object.fromEntries(
    // eslint-disable-next-line no-unused-vars
    Object.entries(exportParams).filter(([_, v]) => v !== null && v !== '')
  );

  // 3. 使用 URLSearchParams 将参数对象转换为查询字符串
  const queryString = new URLSearchParams(filteredParams).toString();

  // 4. 拼接最终的URL，附上 token
  const exportUrl = `${api.defaults.baseURL}/transactions/export?${queryString}&token=${token}`;

  console.log('正在导出, URL:', exportUrl);

  // 5. 使用 window.open 触发下载
  window.open(exportUrl, '_blank');
};

// --- 生命周期钩子 ---
onMounted(() => {
  fetchRecords();
  fetchAllPartsForSelect();
});
</script>

<style scoped>
.records-view {
  padding: 20px;
}
.filter-card, .action-card {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
