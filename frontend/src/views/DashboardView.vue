<template>
  <div class="dashboard-view" v-loading="loading" ref="exportAreaRef">
    <!-- 1. 顶部标题与导出按钮 -->
    <el-card class="page-header-card">
      <div class="card-header">
        <span>仪表盘概览</span>
        <el-button type="primary" :loading="isExporting" @click="handleExportPDF">
          导出PDF
        </el-button>
      </div>
    </el-card>

    <!-- 2. 顶部KPI与状态图 -->
    <el-row :gutter="20">
      <!-- KPI 卡片区 -->
      <el-col :span="16">
        <el-row :gutter="20" class="kpi-cards">
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">配件种类总数</div>
                <div class="value">{{ dashboardData?.partVarietyCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">今日入库次数</div>
                <div class="value">{{ dashboardData?.todayInCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover">
              <div class="card-content">
                <div class="label">今日出库次数</div>
                <div class="value">{{ dashboardData?.todayOutCount ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card shadow="hover" body-style="background-color: #fef0f0;">
              <div class="card-content">
                <div class="label" style="color: #f56c6c;">库存预警数量</div>
                <div class="value" style="color: #f56c6c;">{{ dashboardData?.lowStockItems?.length ?? 'N/A' }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
      <!-- 库存状态柱状图 -->
      <el-col :span="8">
        <el-card class="chart-section" style="margin-top: 0;">
          <BaseChart :option="statusChartOption" :loading="statusChartLoading" height="120px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 趋势图 -->
      <el-col :span="12">
        <el-card class="chart-section">
           <template #header>
            <div class="card-header">
              <span>最近30天出入库趋势</span>
            </div>
          </template>
          <BaseChart :option="trendChartOption" :loading="trendChartLoading" height="350px" />
        </el-card>
      </el-col>

      <!-- 新增：库存占比饼图 (this section will be removed) -->

    </el-row>

    <!-- 新增：缺陷供应商排行 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-section">
           <template #header>
            <div class="card-header">
              <span>缺陷供应商排行 (Top Defective Suppliers)</span>
            </div>
          </template>
          <BaseChart :option="defectChartOption" :loading="defectChartLoading" height="350px" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 预警信息区 -->
    <el-card class="warning-section">
      <template #header>
        <div class="card-header">
          <span>库存不足预警</span>
          <router-link to="/inventory">
            <el-button text>查看全部</el-button>
          </router-link>
        </div>
      </template>
      <el-table :data="dashboardData?.lowStockItems" style="width: 100%" height="250">
        <el-table-column prop="part_number" label="配件编号" />
        <el-table-column prop="part_name" label="配件名称" />
        <el-table-column prop="stock" label="当前库存" />
        <el-table-column prop="stock_min" label="库存下限" />
      </el-table>
      <div v-if="!dashboardData?.lowStockItems?.length" class="empty-text">
        太棒了！当前没有库存不足的配件。
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import api from '@/utils/api';
import BaseChart from '@/components/charts/BaseChart.vue';
import { ElMessage } from 'element-plus';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  createTrendChartOption,
  createDefectChartOption
} from '@/utils/chart-options.js';

const exportAreaRef = ref(null);
const isExporting = ref(false);
const dashboardData = ref(null);
const loading = ref(true);
const trendChartLoading = ref(false);
const statusChartLoading = ref(false);
const defectChartLoading = ref(false);

const trendChartOption = reactive(createTrendChartOption());
const defectChartOption = reactive(createDefectChartOption());

const statusChartOption = reactive({
  tooltip: { trigger: 'axis' },
  grid: { left: 0, right: 0, top: 10, bottom: 0, containLabel: true },
  xAxis: {
    type: 'category',
    data: ['库存不足', '库存正常', '库存超额'],
    axisLabel: { interval: 0 } // 确保标签都显示
  },
  yAxis: { type: 'value', show: false }, // 隐藏y轴
  series: [
    {
      name: '配件种类',
      type: 'bar',
      data: [], // 将被API数据填充
      // 为不同的柱子设置不同颜色
      itemStyle: {
        color: (params) => {
          const colorList = ['#F56C6C', '#67C23A', '#E6A23C'];
          return colorList[params.dataIndex];
        }
      }
    },
  ],
});

const fetchDashboardData = async () => {
  loading.value = true;
  try {
    const response = await api.get('/dashboard');
    dashboardData.value = response.data;
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchTrendsData = async () => {
  trendChartLoading.value = true;
  try {
    const response = await api.get('/dashboard/trends', { params: { days: 30 } });
    const { dates, inboundData, outboundData } = response.data;

    const newOptions = createTrendChartOption(dates, inboundData, outboundData);

    trendChartOption.xAxis.data = newOptions.xAxis.data;
    trendChartOption.series[0].data = newOptions.series[0].data;
    trendChartOption.series[1].data = newOptions.series[1].data;

  } catch (error) {
    console.error('获取趋势图数据失败:', error);
  } finally {
    trendChartLoading.value = false;
  }
};

const fetchStockStatusData = async () => {
  statusChartLoading.value = true;
  try {
    const response = await api.get('/dashboard/stock-status');
    const { lowStock, normalStock, overStock } = response.data;
    statusChartOption.series[0].data = [lowStock, normalStock, overStock];
  } catch (error) {
    console.error('获取库存状态数据失败:', error);
  } finally {
    statusChartLoading.value = false;
  }
}

const fetchDefectData = async () => {
  defectChartLoading.value = true;
  try {
    const response = await api.get('/dashboard/top-defective-suppliers');
    const { supplierNames, defectCounts } = response.data;
    const newOptions = createDefectChartOption(supplierNames, defectCounts);
    defectChartOption.xAxis.data = newOptions.xAxis.data;
    defectChartOption.series[0].data = newOptions.series[0].data;
  } catch (error) {
    console.error('获取缺陷数据失败:', error);
  } finally {
    defectChartLoading.value = false;
  }
}

const handleExportPDF = async () => {
  if (!exportAreaRef.value) {
    console.error("导出区域的DOM元素未找到。");
    return;
  }

  isExporting.value = true;
  try {
    const canvas = await html2canvas(exportAreaRef.value, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    const contentWidth = canvas.width;
    const contentHeight = canvas.height;
    const pageData = canvas.toDataURL('image/jpeg', 1.0);

    const PDF_PAGE_WIDTH = 595.28;

    const margin = 20;
    const imgWidth = PDF_PAGE_WIDTH - margin * 2;
    const imgHeight = (imgWidth / contentWidth) * contentHeight;

    const pdf = new jsPDF('p', 'pt', 'a4');

    pdf.addImage(pageData, 'JPEG', margin, margin, imgWidth, imgHeight);

    pdf.save('仪表盘报表.pdf');

  } catch (error) {
    console.error('导出PDF失败:', error);
    ElMessage.error('导出PDF时发生错误。');
  } finally {
    isExporting.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    fetchDashboardData(),
    fetchTrendsData(),
    fetchStockStatusData(),
    fetchDefectData()
  ]);
  loading.value = false;
});
</script>

<style scoped>
.dashboard-view {
  padding: 20px;
}
.kpi-cards {
  margin-bottom: 20px;
}
.card-content {
  text-align: center;
}
.card-content .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}
.card-content .value {
  font-size: 24px;
  font-weight: bold;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.empty-text {
  text-align: center;
  color: #909399;
  padding: 20px;
}
.chart-section {
  margin-top: 20px;
  margin-bottom: 20px;
}
.page-header-card {
  margin-bottom: 20px;
}
</style>
