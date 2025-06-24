<!-- frontend/src/components/PartForm.vue -->
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="200px">
    <el-form-item label="配件编号 (Part Number)" prop="part_number">
      <el-input
        v-model="form.part_number"
        placeholder="请输入配件编号 (Enter Part Number)"
        data-cy="part-form-number-input"
      ></el-input>
    </el-form-item>
    <el-form-item label="配件名称 (Part Name)" prop="part_name">
      <el-input
        v-model="form.part_name"
        placeholder="请输入配件名称 (Enter Part Name)"
        data-cy="part-form-name-input"
      ></el-input>
    </el-form-item>
    <el-form-item label="规格 (Specification)" prop="spec">
      <el-input
        v-model="form.spec"
        placeholder="请输入规格 (Enter Specification)"
        data-cy="part-form-spec-input"
      ></el-input>
    </el-form-item>
    <el-form-item label="库存数量 (Stock)" prop="stock">
      <el-input-number v-model="form.stock" :min="0" data-cy="part-form-stock-input" />
    </el-form-item>
    <el-form-item label="最小库存 (Min Stock)" prop="stock_min">
      <el-input-number v-model="form.stock_min" :min="0" />
    </el-form-item>
    <el-form-item label="最大库存 (Max Stock)" prop="stock_max">
      <el-input-number v-model="form.stock_max" :min="0" />
    </el-form-item>
    <el-form-item label="供应商 (Supplier)" prop="supplier_id">
      <el-select
        v-model="form.supplier_id"
        placeholder="请选择供应商 (Select Supplier)"
        style="width: 100%"
        data-cy="part-form-supplier-select"
      >
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
import { ref, watch } from 'vue'

// --- Props ---
// define the data that the parent component can pass to this component
const props = defineProps({
  // the initial data for the form, used to display the form when editing
  initialData: {
    type: Object,
    default: () => ({
      part_number: '',
      part_name: '',
      spec: '',
      stock: 0,
      stock_min: 0,
      stock_max: 0,
      supplier_id: null,
    }),
  },
  // supplier list, passed by the parent component
  suppliers: {
    type: Array,
    required: true,
  },
})

// --- form data and references ---
const formRef = ref(null)
const form = ref({ ...props.initialData })

// --- validation rules ---
const rules = {
  part_number: [
    { required: true, message: '配件编号不能为空 (Part number is required)', trigger: 'blur' },
  ],
  part_name: [
    { required: true, message: '配件名称不能为空 (Part name is required)', trigger: 'blur' },
  ],
  stock_max: [
    {
      validator: (rule, value, callback) => {
        if (value < form.value.stock_min) {
          callback(new Error('最大库存不能小于最小库存 (Max stock cannot be less than min stock)'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  supplier_id: [
    {
      required: true,
      message: '必须选择一个供应商 (A supplier must be selected)',
      trigger: 'change',
    },
  ],
}

// --- watch for changes in initialData ---
// when the parent component changes initialData (e.g. clicking edit different rows), update the form content
watch(
  () => props.initialData,
  (newData) => {
    form.value = { ...newData }
  },
  { deep: true },
) // deep watch for object changes

// --- expose methods to the parent component ---
// use defineExpose to allow the parent component to call these methods via ref
defineExpose({
  // validate the form
  validate: () => {
    return new Promise((resolve, reject) => {
      formRef.value.validate((valid) => {
        if (valid) {
          resolve(form.value) // validation successful, return form data
        } else {
          reject('表单验证失败 (Form validation failed)')
        }
      })
    })
  },
  // reset the form
  reset: () => {
    formRef.value.resetFields()
  },
})
</script>
