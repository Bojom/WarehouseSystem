<template>
  <div class="dashboard-view" v-loading="loading">
    <!-- 1. 顶部KPI卡片区 -->
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

    <!-- 2. 预警信息区 -->
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
import { ref, onMounted } from 'vue';
import api from '@/utils/api';

const dashboardData = ref(null);
const loading = ref(true);

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

onMounted(() => {
  fetchDashboardData();
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
</style>
