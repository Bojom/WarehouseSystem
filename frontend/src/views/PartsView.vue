<template>
  <div class="parts-view">
    <!-- 1. 顶部工具栏：搜索和操作按钮 -->
    <el-card class="toolbar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="搜索配件 (Search Parts)">
          <el-input
            v-model="queryParams.search"
            placeholder="按名称或编号搜索 (Search by name or number)"
            @keyup.enter="handleSearch"
            clearable
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索 (Search)</el-button>
          <el-button @click="resetQuery">重置 (Reset)</el-button>
        </el-form-item>
      </el-form>
      <div>
        <el-button type="primary" v-if="userStore.isAdmin" @click="handleOpenAddDialog">新增配件 (Add Part)</el-button>
      </div>
    </el-card>

    <!-- 2. 数据表格 -->
    <el-card>
      <el-table
        v-loading="loading"
        :data="partsList"
        style="width: 100%"
      >
        <el-table-column prop="part_number" label="配件编号 (Part Number)" width="180" />
        <el-table-column prop="part_name" label="配件名称 (Part Name)" width="180" />
        <el-table-column prop="spec" label="规格 (Specification)" />
        <el-table-column prop="stock" label="当前库存 (Stock)" />
        <el-table-column prop="Supplier.supplier_name" label="供应商 (Supplier)" />
        <el-table-column label="操作 (Actions)" width="180">
          <template #default="scope">
            <div v-if="userStore.isAdmin">
              <el-button size="small" @click="handleOpenEditDialog(scope.row)">编辑 (Edit)</el-button>
              <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除 (Delete)</el-button>
            </div>
            <div v-else-if="userStore.user?.role === 'operator'">
               <el-button size="small" @click="handleViewDetails(scope.row)">查看 (Check)</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. 分页组件 -->
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

     <!-- 新增/编辑配件的对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="50%"
      @close="handleCloseDialog"
    >
      <PartForm
        v-if="dialogVisible"
        ref="partFormRef"
        :initial-data="currentPart"
        :suppliers="suppliersList"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消 (Cancel)</el-button>
          <el-button
            type="primary"
            @click="handleSubmit"
            :loading="isSubmitting"
          >
            确定 (Confirm)
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useUserStore } from '@/stores/user';
import PartForm from '@/components/PartForm.vue';
import { getParts, createPart, updatePart, deletePart } from '@/api/part.api.js';
import { getSuppliers } from '@/api/supplier.api.js';

// --- 状态管理 ---
const partsList = ref([]); // 存储配件列表
const total = ref(0); // 总记录数
const loading = ref(false); // 控制表格加载状态
const queryParams = ref({
  page: 1,
  pageSize: 10,
  search: ''
});
const userStore = useUserStore();

// --- 对话框状态 ---
const dialogVisible = ref(false);
const isSubmitting = ref(false);
const currentPart = ref(null);
const partFormRef = ref(null);
const suppliersList = ref([]);

const dialogTitle = computed(() => (currentPart.value && currentPart.value.id) ? '编辑配件 (Edit Part)' : '新增配件 (Add Part)');

// --- 获取数据的核心函数 ---
const fetchParts = async () => {
  loading.value = true;
  try {
    const response = await getParts(queryParams.value);
    partsList.value = response.data.parts;
    total.value = response.data.totalItems;
  } catch (error) {
    console.error('获取配件列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const fetchSuppliers = async () => {
  try {
    const response = await getSuppliers();
    suppliersList.value = response.data.suppliers;
  } catch (error) {
    console.error('获取供应商列表失败:', error);
    ElMessage.error('无法加载供应商列表，请重试。(Failed to load suppliers list.)');
  }
};


// --- 事件处理 ---
const handleOpenAddDialog = () => {
  currentPart.value = {}; // 重置
  dialogVisible.value = true;
};

const handleOpenEditDialog = (part) => {
  currentPart.value = { ...part };
  dialogVisible.value = true;
};

const handleCloseDialog = () => {
  dialogVisible.value = false;
  currentPart.value = null;
};

const handleSubmit = async () => {
  try {
    const formData = await partFormRef.value.validate();
    isSubmitting.value = true; // 开始提交，显示加载状态

    if (currentPart.value.id) {
      // 编辑模式
      await updatePart(currentPart.value.id, formData);
      ElMessage.success('配件更新成功！ (Part updated successfully!)');
    } else {
      // 新增模式
      await createPart(formData);
      ElMessage.success('配件新增成功！ (Part added successfully!)');
    }

    handleCloseDialog();
    fetchParts(); // 刷新列表
  } catch (error) {
    console.error('表单提交失败:', error);
    if (error.response && error.response.status === 409) {
      // 后端返回了特定的冲突错误
      ElMessage.error(error.response.data.message);
    } else {
      // 其他错误
      ElMessage.error('操作失败，请检查表单数据。 (Operation failed, please check the form data.)');
    }
  } finally {
    isSubmitting.value = false; // 结束提交，隐藏加载状态
  }
};

const handleViewDetails = (part) => {
  ElMessage.info(`查看配件详情: ${part.part_name} (Details for ${part.part_name})`);
};

// ... (handleSearch, handleDelete, resetQuery, handlePageChange remain the same)
// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.value.page = 1; // 每次搜索都从第一页开始
  fetchParts();
};

const handleDelete = (part) => {
   // 使用 ElMessageBox.confirm 弹出一个确认框
   ElMessageBox.confirm(
    `您确定要删除配件 "${part.part_name}" 吗？此操作无法撤销。`, // 提示内容
    '警告', // 标题
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning', // 警告类型，图标会变
    }
  )
  .then(async () => {
    // 用户点击了"确定删除"
    try {
      await deletePart(part.id);
      ElMessage.success('删除成功！');
      fetchParts(); // 重新加载列表数据
    } catch (error) {
      console.error('删除配件失败:', error);
      ElMessage.error('删除失败，请稍后重试。');
    }
  })
  .catch(() => {
    // 用户点击了"取消"或关闭了对话框
    ElMessage.info('已取消删除');
  });
};

// 重置按钮点击事件
const resetQuery = () => {
  queryParams.value.page = 1;
  queryParams.value.search = '';
  fetchParts();
};

// 分页页码改变事件
const handlePageChange = (newPage) => {
  queryParams.value.page = newPage;
  fetchParts();
};


// --- 生命周期钩子 ---
onMounted(async () => {
  await userStore.fetchUser();
  fetchParts();
  fetchSuppliers(); // 获取供应商列表
});
</script>

<style scoped>
.parts-view {
  padding: 20px;
}
.toolbar {
  margin-bottom: 20px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
