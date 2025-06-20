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
            <el-option label="故障 / Fault" value="FAULT" />
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
      <el-button type="danger" @click="openFaultDialog">报告故障 / Report Fault</el-button>
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
            <el-tag :type="getTagType(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
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

    <!-- 故障报告对话框 -->
    <el-dialog
      v-model="faultDialogVisible"
      title="报告故障配件 / Report Faulty Part"
      width="50%"
      @close="handleFaultDialogClose"
    >
      <FaultReportForm v-if="faultDialogVisible" ref="faultForm" @submit="handleFaultSubmit" />
      <template #footer>
        <el-button @click="faultDialogVisible = false">取消 / Cancel</el-button>
        <el-button type="primary" @click="submitFaultForm">提交 / Submit</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/utils/api';
import { getParts } from '@/api/part.api'; // 引入配件API
import { getTransactionsForExport } from '@/api/transaction.api'; // 引入导出API
import { reportFault } from '@/api/transaction.api'; // 引入故障报告API
import FaultReportForm from '@/components/FaultReportForm.vue'; // 引入故障报告表单

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

const getTagType = (type) => {
  if (type === 'IN') return 'success';
  if (type === 'OUT') return 'warning';
  if (type === 'FAULT') return 'danger';
  return '';
};

const getTypeText = (type) => {
  if (type === 'IN') return '入库';
  if (type === 'OUT') return '出库';
  if (type === 'FAULT') return '故障';
  return '未知';
};

// --- 状态管理 ---
const recordsList = ref([]);
const total = ref(0);
const loading = ref(false);
const partsForSelect = ref([]); // 用于配件下拉选择
const dateRange = ref([]); // 用于存储日期范围选择器的值
const faultDialogVisible = ref(false); // 控制故障对话框的显示
const faultForm = ref(null); // 引用故障报告表单组件

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

const handleExport = async () => {
  try {
    const response = await getTransactionsForExport(queryParams);
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const contentDisposition = response.headers['content-disposition'];
    let fileName = 'records.xlsx';
    if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch && fileNameMatch.length === 2)
            fileName = decodeURIComponent(fileNameMatch[1]);
    }
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch (error) {
    ElMessage.error('导出失败');
    console.error('导出Excel失败:', error);
  }
};

// --- 故障报告处理 ---
const openFaultDialog = () => {
  faultDialogVisible.value = true;
};

const handleFaultDialogClose = () => {
  if (faultForm.value) {
    faultForm.value.resetForm();
  }
};

const submitFaultForm = () => {
  if (faultForm.value) {
    faultForm.value.submitForm();
  }
};

const handleFaultSubmit = async (formData) => {
  try {
    await reportFault(formData);
    ElMessage.success('故障报告提交成功 / Fault reported successfully');
    faultDialogVisible.value = false;
    fetchRecords(); // 刷新记录列表
  } catch (error) {
    const errorMessage = error.response?.data?.message || '操作失败 / Operation failed';
    ElMessage.error(errorMessage);
    console.error('提交故障报告失败:', error);
  }
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
