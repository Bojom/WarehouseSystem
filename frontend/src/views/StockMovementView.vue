<template>
  <div class="stock-movement-view">
    <el-card>
      <template #header>
        <span>出入库登记 / IN-OUT REGISTRATION</span>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="180px" class="form-container">
        <!-- 操作类型 -->
        <el-form-item label="操作类型 / Action Type" prop="trans_type">
          <el-radio-group v-model="form.trans_type">
            <el-radio-button label="OUT">出库 / OUT</el-radio-button>
            <el-radio-button label="IN">入库 / IN</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <!-- 配件信息 -->
        <el-divider content-position="left">配件信息 / PART INFO</el-divider>
        <el-form-item label="配件编号 / Part Number" prop="part_id" class="left-align-label">
          <el-input
            ref="partNumberInputRef"
            v-model="partNumberSearch"
            placeholder="请用扫码枪扫描或手动输入后按回车"
            @keydown.enter.prevent="handlePartNumberInput"
            :loading="isSearching"
            clearable
          >
            <template #append>
              <el-button @click="handlePartNumberInput" :loading="isSearching">
                <el-icon><Search /></el-icon>
              </el-button>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="配件名称 / Part Name">
          <el-input :value="foundPart?.part_name" disabled />
        </el-form-item>
        <el-form-item label="当前库存 / Current Stock">
          <el-input :value="foundPart?.stock" disabled />
        </el-form-item>

        <!-- 操作信息 -->
        <el-divider content-position="left">操作信息 / OPERATION INFO</el-divider>
        <el-form-item label="数量 / Quantity" prop="quantity">
          <el-input-number
            ref="quantityInputRef"
            v-model="form.quantity"
            :min="1"
            @keydown.enter.prevent="handleSubmit"
          />
        </el-form-item>
        <el-form-item label="经手人 / Handler">
          <el-input :value="userStore.user?.username" disabled />
        </el-form-item>
        <el-form-item label="备注 / Remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" />
        </el-form-item>

        <!-- 操作区 -->
        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="isSubmitting">提交 / SUBMIT</el-button>
          <el-button @click="handleReset">重置 / RESET</el-button>
        </el-form-item>
      </el-form>

    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import { Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getPartByNumber } from '@/api/part.api.js';
import { createTransaction } from '@/api/transaction.api.js';

const formRef = ref(null);
const partNumberInputRef = ref(null);
const quantityInputRef = ref(null);
const userStore = useUserStore();

// --- 状态 ---
const form = reactive({
  trans_type: 'OUT',
  part_id: null,
  quantity: 1,
  remarks: ''
});
const partNumberSearch = ref('');
const foundPart = ref(null);
const isSearching = ref(false);
const isSubmitting = ref(false);

// --- 验证规则 ---
const rules = reactive({
  trans_type: [{ required: true, message: '请选择操作类型' }],
  part_id: [{ required: true, message: '请搜索并确认一个配件' }],
  quantity: [{ required: true, message: '请输入数量' }],
});

// --- 方法 ---
const handlePartNumberInput = async () => {
  if (!partNumberSearch.value) {
    // No need to show a warning on blur if the field is empty
    return;
  }
  isSearching.value = true;
  foundPart.value = null; // Reset previous search
  form.part_id = null;
  try {
    const response = await getPartByNumber(partNumberSearch.value);
    foundPart.value = response.data;
    form.part_id = response.data.id; // Link the part
    ElMessage.success(`找到配件: ${response.data.part_name}`);
    quantityInputRef.value.focus();
  } catch {
    ElMessage.error('找不到配件或发生错误 (Part not found or an error occurred)');
  } finally {
    isSearching.value = false;
  }
};

const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      // Client-side stock check (from your suggestion)
      if (form.trans_type === 'OUT' && form.quantity > foundPart.value.stock) {
        ElMessage.warning('出库数量不能大于当前库存！ (Quantity cannot be greater than current stock!)');
        return;
      }

      isSubmitting.value = true;
      try {
        await createTransaction(form);
        ElMessage.success('操作成功！ (Operation successful!)');
        handleReset(); // Reset form after success
      } catch (error) {
        const errorMsg = error.response?.data?.error || '操作失败 (Operation failed)';
        ElMessage.error(errorMsg);
      } finally {
        isSubmitting.value = false;
      }
    } else {
      ElMessage.error('请检查表单输入 (Please check the form input)');
    }
  });
};

const handleReset = () => {
  formRef.value.resetFields();
  partNumberSearch.value = '';
  foundPart.value = null;
  form.remarks = ''; // resetFields might not clear this
  partNumberInputRef.value.focus();
};

onMounted(() => {
  // Ensure user info is available if needed, e.g., for permissions
  userStore.fetchUser();
  partNumberInputRef.value.focus();
});
</script>

<style scoped>
.stock-movement-view {
  padding: 20px;
}
.form-container {
  max-width: 700px;
  margin: 0 auto;
}

/* General layout fix for the form to ensure items are in a row */
.form-container :deep(.el-form-item) {
    display: flex;
    align-items: center;
}

.form-container :deep(.el-form-item__content) {
    flex-grow: 1;
}

/* Specific request to left-align one label */
.form-container :deep(.left-align-label .el-form-item__label) {
    text-align: left;
}

.form-container :deep(.el-input-number) {
    width: 100%;
}
</style>
