<!-- frontend/src/components/SupplierForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="150px">
    <el-form-item label="供应商名称 (Name)" prop="supplier_name">
      <el-input v-model="form.supplier_name" placeholder="Enter supplier name" data-cy="supplier-form-name-input"></el-input>
    </el-form-item>
    <el-form-item label="联系方式 (Contact)" prop="contact">
      <el-input v-model="form.contact" placeholder="Enter contact info" data-cy="supplier-form-contact-input"></el-input>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: () => ({
      supplier_name: '',
      contact: '', // Simplified to one field
    }),
  },
});

const formRef = ref(null);
const form = ref({ ...props.initialData });

const rules = {
  supplier_name: [{ required: true, message: 'Supplier name is required', trigger: 'blur' }],
};

watch(() => props.initialData, (newData) => {
  form.value = { ...newData };
}, { deep: true, immediate: true });

defineExpose({
  validate: () => {
    return formRef.value.validate();
  },
  getFormData: () => {
    return form.value;
  },
});
</script>
