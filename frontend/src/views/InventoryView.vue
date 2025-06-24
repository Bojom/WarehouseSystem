<template>
  <div class="inventory-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>库存状态 / Inventory Status</span>
        </div>
      </template>

      <!-- quick filter -->
      <div class="filter-controls">
        <el-radio-group v-model="filterStatus">
          <el-radio-button label="all">全部 / ALL</el-radio-button>
          <el-radio-button label="out_of_stock">缺货 / OUT OF STOCK</el-radio-button>
          <el-radio-button label="low_stock">库存不足 / LOW STOCK</el-radio-button>
          <el-radio-button label="over_stock">库存超额 / OVER STOCK</el-radio-button>
          <el-radio-button label="normal">正常 / NORMAL</el-radio-button>
        </el-radio-group>
      </div>

      <!-- data table and visualization warning -->
      <el-table
        v-loading="loading"
        :data="filteredInventory"
        style="width: 100%; margin-top: 20px"
        border
      >
        <el-table-column prop="part_number" label="配件编号 / PART NUMBER" width="180" />
        <el-table-column prop="part_name" label="配件名称 / PART NAME" width="200" />
        <el-table-column prop="spec" label="规格 / SPEC" />
        <el-table-column prop="stock" label="当前库存 / CURRENT STOCK" align="center" />
        <el-table-column prop="stock_min" label="库存下限 / MIN STOCK" align="center" />
        <el-table-column prop="stock_max" label="库存上限 / MAX STOCK" align="center" />
        <el-table-column prop="Supplier.supplier_name" label="供应商 / SUPPLIER" />
        <el-table-column label="状态 / STATUS" align="center">
          <template #default="scope">
            <!-- use el-tag for visualization warning -->
            <el-tag v-if="scope.row.status === 'out_of_stock'" type="info"
              >缺货 / OUT OF STOCK</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'low_stock'" type="danger"
              >库存不足 / LOW STOCK</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'over_stock'" type="warning"
              >库存超额 / OVER STOCK</el-tag
            >
            <el-tag v-else-if="scope.row.status === 'normal'" type="success">正常 / NORMAL</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { getInventoryDetails } from '@/api/inventory.api'
import { ElMessage } from 'element-plus'

const inventoryList = ref([])
const loading = ref(false)
const filterStatus = ref('all')

const fetchInventoryDetails = async () => {
  loading.value = true
  try {
    const response = await getInventoryDetails()
    inventoryList.value = response.data
  } catch (error) {
    console.error('获取库存状态失败:', error)
    ElMessage.error('无法加载库存数据。')
  } finally {
    loading.value = false
  }
}

const filteredInventory = computed(() => {
  if (filterStatus.value === 'all') {
    return inventoryList.value
  }
  return inventoryList.value.filter((item) => item.status === filterStatus.value)
})

onMounted(() => {
  fetchInventoryDetails()
})
</script>

<style scoped>
.inventory-view {
  padding: 20px;
}
.card-header {
  font-size: 18px;
  font-weight: bold;
}
.filter-controls {
  margin-bottom: 20px;
}
</style>
