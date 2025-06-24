<template>
  <div class="records-view">
    <!-- 1. top filter section -->
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
          <el-select
            v-model="queryParams.type"
            placeholder="请选择类型 / Please select a type"
            clearable
          >
            <el-option label="入库 / In" value="IN" />
            <el-option label="出库 / Out" value="OUT" />
            <el-option label="异常 / Anomaly" value="ANOMALY" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询 / Search</el-button>
          <el-button @click="resetQuery">重置 / Reset</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. action section -->
    <el-card class="action-card">
      <el-button type="success" @click="handleExport">导出Excel / Export Excel</el-button>
    </el-card>

    <!-- NEW: Chart Card -->
    <el-card class="chart-card">
      <template #header>
        <span>每日操作量趋势 / Daily Operation Volume</span>
      </template>
      <BaseChart v-if="chartOption" :option="chartOption" height="400px" />
      <div v-else class="chart-placeholder">正在加载图表数据...</div>
    </el-card>

    <!-- 3. data table and pagination -->
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'
import { getParts } from '@/api/part.api' // 引入配件API
import { exportTransactions } from '@/api/transaction.api' // 引入导出API
import BaseChart from '@/components/charts/BaseChart.vue'

// --- utility functions ---
const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)

  // 1. use local time formatter to format date and time components
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  // 2. calculate UTC offset
  // getTimezoneOffset() returns the difference in minutes between local time and UTC time
  // the sign is opposite to the conventional agreement (e.g. UTC+2 returns -120)
  const offsetMinutes = date.getTimezoneOffset()
  const offsetHours = -offsetMinutes / 60

  // 3. create offset string (e.g. "UTC+2" or "UTC-5")
  const offsetSign = offsetHours >= 0 ? '+' : '-'
  // for integer hours, we don't need the decimal part
  const offsetValue = Number.isInteger(offsetHours)
    ? Math.abs(offsetHours)
    : Math.abs(offsetHours).toFixed(2)
  const offsetString = `UTC${offsetSign}${offsetValue}`

  // 4. combine and return the final string
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${offsetString}`
}

const getTagType = (type) => {
  if (type === 'IN') return 'success'
  if (type === 'OUT') return 'warning'
  if (type === 'ANOMALY') return 'danger'
  return ''
}

const getTypeText = (type) => {
  if (type === 'IN') return '入库'
  if (type === 'OUT') return '出库'
  if (type === 'ANOMALY') return '异常'
  return '未知'
}

// --- state management ---
const recordsList = ref([])
const total = ref(0)
const loading = ref(false)
const partsForSelect = ref([]) // used for part dropdown selection
const dateRange = ref([]) // used for storing the value of the date range selector
const chartOption = ref(null)

// query parameters
const queryParams = reactive({
  page: 1,
  pageSize: 10,
  partIds: [],
  type: '',
  startDate: '',
  endDate: '',
})

// --- data fetching ---
const fetchRecords = async () => {
  loading.value = true
  // update queryParams from dateRange
  if (dateRange.value && dateRange.value.length === 2) {
    queryParams.startDate = dateRange.value[0]
    queryParams.endDate = dateRange.value[1]
  } else {
    queryParams.startDate = ''
    queryParams.endDate = ''
  }

  // prepare parameters to send, partIds needs special handling
  const paramsToSend = { ...queryParams }
  if (paramsToSend.partIds && paramsToSend.partIds.length > 0) {
    // backend needs partId, value is a comma-separated string
    paramsToSend.partId = paramsToSend.partIds.join(',')
  }
  delete paramsToSend.partIds // delete old partIds property

  try {
    const response = await api.get('/transactions', { params: paramsToSend })
    recordsList.value = response.data.transactions
    total.value = response.data.totalItems
  } catch (error) {
    console.error('获取记录失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchChartData = async () => {
  try {
    const response = await api.get('/transactions/summary')
    processChartData(response.data)
  } catch (error) {
    console.error('获取图表数据失败:', error)
  }
}

const processChartData = (data) => {
  const dates = [...new Set(data.map((item) => new Date(item.date).toLocaleDateString()))]
  const series = {
    IN: { name: '入库', type: 'line', data: new Array(dates.length).fill(0) },
    OUT: { name: '出库', type: 'line', data: new Array(dates.length).fill(0) },
    ANOMALY: { name: '异常', type: 'line', data: new Array(dates.length).fill(0) },
  }

  data.forEach((item) => {
    const dateIndex = dates.indexOf(new Date(item.date).toLocaleDateString())
    if (series[item.trans_type]) {
      series[item.trans_type].data[dateIndex] = parseInt(item.total_quantity, 10)
    }
  })

  chartOption.value = {
    tooltip: { trigger: 'axis' },
    legend: { data: Object.values(series).map((s) => s.name) },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: dates },
    yAxis: { type: 'value' },
    series: Object.values(series),
  }
}

// get parts list for filtering (no pagination)
const fetchAllPartsForSelect = async () => {
  try {
    // assume getParts supports a large pageSize to get all
    const response = await getParts({ pageSize: 10000 })
    partsForSelect.value = response.data.parts
  } catch (error) {
    console.error('获取配件下拉列表失败:', error)
  }
}

// --- event handling ---
const handleSearch = () => {
  queryParams.page = 1
  fetchRecords()
}

const handleExport = async () => {
  try {
    // dynamically build file name
    let fileName = '出入库记录'

    // 1. add selected part names
    if (queryParams.partIds && queryParams.partIds.length > 0) {
      const selectedParts = partsForSelect.value.filter((p) => queryParams.partIds.includes(p.id))
      const partNames = selectedParts.map((p) => p.part_name).join('-')
      if (partNames) {
        fileName += `_${partNames}`
      }
    }

    // 2. add date range
    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = dateRange.value[0].split(' ')[0] // YYYY-MM-DD
      const endDate = dateRange.value[1].split(' ')[0] // YYYY-MM-DD
      fileName += `_${startDate}_to_${endDate}`
    }

    fileName += '.xlsx'

    // call API
    const response = await exportTransactions(queryParams)

    // create download link and trigger
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    link.remove()
  } catch (error) {
    console.error('导出Excel失败:', error)
    ElMessage.error('导出失败，请重试。')
  }
}

const resetQuery = () => {
  queryParams.page = 1
  queryParams.partIds = []
  queryParams.type = ''
  dateRange.value = []
  fetchRecords()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchRecords()
}

// --- lifecycle hooks ---
onMounted(() => {
  fetchRecords()
  fetchAllPartsForSelect()
  fetchChartData()
})
</script>

<style scoped>
.records-view {
  padding: 20px;
}
.filter-card,
.action-card,
.chart-card {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
