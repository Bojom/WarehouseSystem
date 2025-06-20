<template>
  <el-form ref="form" :model="formData" :rules="rules" label-width="120px">
    <el-form-item label="故障配件 / Part" prop="part_id">
      <el-select
        v-model="formData.part_id"
        placeholder="请选择配件 / Select Part"
        filterable
        style="width: 100%;"
      >
        <el-option
          v-for="part in parts"
          :key="part.id"
          :label="`${part.part_name} (${part.part_number}) - 当前库存 / Stock: ${part.stock}`"
          :value="part.id"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="故障数量 / Quantity" prop="quantity">
      <el-input-number v-model="formData.quantity" :min="1" placeholder="请输入数量 / Enter Quantity" />
    </el-form-item>
    <el-form-item label="备注 / Remarks" prop="remarks">
      <el-input v-model="formData.remarks" type="textarea" placeholder="请输入备注 / Enter Remarks" />
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, reactive, onMounted, defineExpose, defineEmits } from 'vue';
import { getParts } from '@/api/part.api';
import { ElMessage } from 'element-plus';

const emit = defineEmits(['submit']);

const form = ref(null);
const parts = ref([]);
const formData = reactive({
  part_id: null,
  quantity: 1,
  remarks: '',
});

const rules = reactive({
  part_id: [{ required: true, message: '请选择一个配件 / Please select a part', trigger: 'change' }],
  quantity: [{ required: true, message: '请输入数量 / Please enter a quantity', trigger: 'blur' }],
});

const fetchAllParts = async () => {
  try {
    const response = await getParts({ pageSize: 10000 }); // 获取所有配件
    parts.value = response.data.parts;
  } catch (error) {
    ElMessage.error('获取配件列表失败 / Failed to fetch parts');
    console.error(error);
  }
};

const submitForm = async () => {
  if (!form.value) return;
  const valid = await form.value.validate();
  if (valid) {
    emit('submit', { ...formData });
  } else {
    return false;
  }
};

const resetForm = () => {
  if (form.value) {
    form.value.resetFields();
  }
  formData.part_id = null;
  formData.quantity = 1;
  formData.remarks = '';
};

onMounted(() => {
  fetchAllParts();
});

defineExpose({
  submitForm,
  resetForm,
});
</script>
