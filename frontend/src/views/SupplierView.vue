<!-- frontend/src/views/SupplierView.vue -->
<template>
  <div class="supplier-view">
    <!-- 1. Top Toolbar -->
    <el-card class="toolbar">
      <div>
        <el-button type="primary" @click="handleOpenAddDialog" data-cy="add-supplier-button">
          新增供应商 (Add Supplier)
        </el-button>
      </div>
    </el-card>

    <!-- 2. Data Table -->
    <el-card>
      <el-table :data="suppliersList" v-loading="loading" style="width: 100%" data-cy="suppliers-table">
        <el-table-column prop="supplier_name" label="供应商名称 (Supplier Name)" />
        <el-table-column prop="contact" label="联系方式 (Contact)" />
        <el-table-column label="操作 (Actions)" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleOpenEditDialog(scope.row)" data-cy="edit-supplier-button">
              编辑 (Edit)
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)" data-cy="delete-supplier-button">
              删除 (Delete)
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. Pagination -->
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

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @close="handleCloseDialog">
      <SupplierForm
        v-if="dialogVisible"
        ref="supplierFormRef"
        :initial-data="currentSupplier"
      />
      <template #footer>
        <el-button @click="handleCloseDialog">取消 (Cancel)</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">
          确定 (Confirm)
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier as apiDeleteSupplier } from '@/api/supplier.api.js';
import { ElMessage, ElMessageBox } from 'element-plus';
import SupplierForm from '@/components/SupplierForm.vue'; // Import the form component

const suppliersList = ref([]);
const loading = ref(false);
const total = ref(0);
const queryParams = ref({
  page: 1,
  pageSize: 10,
});

// --- Dialog State ---
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const currentSupplier = ref(null);
const supplierFormRef = ref(null);

const dialogTitle = computed(() => (currentSupplier.value && currentSupplier.value.id) ? '编辑供应商 (Edit Supplier)' : '新增供应商 (Add Supplier)');

const fetchSuppliers = async () => {
  loading.value = true;
  try {
    const response = await getSuppliers(queryParams.value);
    suppliersList.value = response.data.suppliers;
    total.value = response.data.totalItems;
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    ElMessage.error('无法加载供应商列表 (Could not load supplier list).');
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage) => {
  queryParams.value.page = newPage;
  fetchSuppliers();
};

const handleOpenAddDialog = () => {
  currentSupplier.value = {};
  dialogVisible.value = true;
};

const handleOpenEditDialog = (supplier) => {
  currentSupplier.value = { ...supplier };
  dialogVisible.value = true;
};

const handleCloseDialog = () => {
  dialogVisible.value = false;
  currentSupplier.value = null;
};

const handleSubmit = async () => {
  try {
    await supplierFormRef.value.validate();
    const formData = supplierFormRef.value.getFormData();
    isSubmitting.value = true;

    if (currentSupplier.value && currentSupplier.value.id) {
      await updateSupplier(currentSupplier.value.id, formData);
      ElMessage.success('更新成功 (Update successful)!');
    } else {
      await createSupplier(formData);
      ElMessage.success('新增成功 (Add successful)!');
    }

    handleCloseDialog();
    fetchSuppliers();
  } catch (error) {
    console.error('Submit failed:', error);

    // Display more specific error message from backend if available
    let errorMessage = '操作失败 (Operation failed).';
    if (error.response && error.response.data && error.response.data.message) {
      // Check for known Sequelize unique constraint error
      if (error.response.data.error && error.response.data.error.includes('UniqueConstraintError')) {
        errorMessage = '供应商名称已存在 (Supplier name already exists).';
      } else {
        // Use the general message from the backend
        errorMessage = `操作失败: ${error.response.data.message}`;
      }
    }
    ElMessage.error(errorMessage);
  } finally {
    isSubmitting.value = false;
  }
};

const handleDelete = (supplier) => {
  ElMessageBox.confirm(
    `确定要删除供应商 "${supplier.supplier_name}" 吗?`,
    'Warning',
    {
      confirmButtonText: '确定 (OK)',
      cancelButtonText: '取消 (Cancel)',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await apiDeleteSupplier(supplier.id);
      ElMessage.success('删除成功 (Delete successful)!');
      fetchSuppliers(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete supplier:', error);
      ElMessage.error('删除失败 (Delete failed).');
    }
  }).catch(() => {
    ElMessage.info('已取消删除 (Delete canceled)');
  });
};

onMounted(() => {
  fetchSuppliers();
});
</script>

<style scoped>
.toolbar {
  margin-bottom: 16px;
  display: flex;
  justify-content: flex-end;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
