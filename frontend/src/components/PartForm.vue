<!-- frontend/src/components/PartForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="200px">
    <el-form-item label="配件编号 (Part Number)" prop="part_number">
      <el-input v-model="form.part_number" placeholder="请输入配件编号 (Enter Part Number)" data-cy="part-form-number-input"></el-input>
    </el-form-item>
    <el-form-item label="配件名称 (Part Name)" prop="part_name">
      <el-input v-model="form.part_name" placeholder="请输入配件名称 (Enter Part Name)" data-cy="part-form-name-input"></el-input>
    </el-form-item>
    <el-form-item label="规格 (Specification)" prop="spec">
      <el-input v-model="form.spec" placeholder="请输入规格 (Enter Specification)" data-cy="part-form-spec-input"></el-input>
    </el-form-item>
    <el-form-item label="库存数量 (Stock)" prop="stock">
      <el-input-number v-model="form.stock" :min="0" data-cy="part-form-stock-input"/>
    </el-form-item>
    <el-form-item label="供应商 (Supplier)" prop="supplier_id">
      <el-select v-model="form.supplier_id" placeholder="请选择供应商 (Select Supplier)" style="width: 100%;" data-cy="part-form-supplier-select">
        <!-- 这里的选项将由父组件传入 -->
        <el-option
          v-for="item in suppliers"
          :key="item.id"
          :label="item.supplier_name"
          :value="item.id"
        />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup>
import { ref, watch } from 'vue';

// --- Props ---
// 定义父组件可以传递给本组件的数据
const props = defineProps({
  // 表单的初始数据，用于编辑时回显
  initialData: {
    type: Object,
    default: () => ({
      part_number: '',
      part_name: '',
      spec: '',
      stock: 0,
      supplier_id: null,
    }),
  },
  // 供应商列表，由父组件获取并传入
  suppliers: {
    type: Array,
    required: true,
  }
});

// --- 表单数据和引用 ---
const formRef = ref(null);
const form = ref({ ...props.initialData });

// --- 验证规则 ---
const rules = {
  part_number: [{ required: true, message: '配件编号不能为空 (Part number is required)', trigger: 'blur' }],
  part_name: [{ required: true, message: '配件名称不能为空 (Part name is required)', trigger: 'blur' }],
  supplier_id: [{ required: true, message: '必须选择一个供应商 (A supplier must be selected)', trigger: 'change' }],
};

// --- 监听 initialData 的变化 ---
// 当父组件改变 initialData 时（比如点击编辑不同行），更新表单内容
watch(() => props.initialData, (newData) => {
  form.value = { ...newData };
}, { deep: true }); // deep watch for object changes

// --- 暴露给父组件的方法 ---
// 使用 defineExpose 让父组件可以通过 ref 调用这些方法
defineExpose({
  // 验证表单的方法
  validate: () => {
    return new Promise((resolve, reject) => {
      formRef.value.validate((valid) => {
        if (valid) {
          resolve(form.value); // 验证成功，返回表单数据
        } else {
          reject('表单验证失败 (Form validation failed)');
        }
      });
    });
  },
  // 重置表单的方法
  reset: () => {
    formRef.value.resetFields();
  }
});
</script>
