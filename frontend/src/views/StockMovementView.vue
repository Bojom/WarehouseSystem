<template>
  <div class="stock-movement-view">
    <el-card>
      <el-tabs v-model="activeTab">
        <!-- Tab 1: IN/OUT Registration -->
        <el-tab-pane label="出入库登记 / IN-OUT Registration" name="in-out">
          <el-form
            ref="formInOutRef"
            :model="formInOut"
            :rules="rulesInOut"
            label-width="180px"
            class="form-container"
          >
            <!-- 操作类型 -->
            <el-form-item label="操作类型 / Action Type" prop="trans_type">
              <el-radio-group v-model="formInOut.trans_type">
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
              <el-input :value="foundPartInOut?.part_name" disabled />
            </el-form-item>
            <el-form-item label="当前库存 / Current Stock">
              <el-input :value="foundPartInOut?.stock" disabled />
            </el-form-item>

            <!-- 操作信息 -->
            <el-divider content-position="left">操作信息 / OPERATION INFO</el-divider>
            <el-form-item label="数量 / Quantity" prop="quantity">
              <el-input-number
                ref="quantityInputRef"
                v-model="formInOut.quantity"
                :min="1"
                @keydown.enter.prevent="handleSubmitInOut"
              />
            </el-form-item>
            <el-form-item label="经手人 / Handler">
              <el-input :value="userStore.user?.username" disabled />
            </el-form-item>
            <el-form-item label="备注 / Remarks">
              <el-input v-model="formInOut.remarks" type="textarea" :rows="3" />
            </el-form-item>

            <!-- 操作区 -->
            <el-form-item>
              <el-button type="primary" @click="handleSubmitInOut" :loading="isSubmitting"
                >提交 / SUBMIT</el-button
              >
              <el-button @click="handleResetInOut">重置 / RESET</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Tab 2: Anomaly Report -->
        <el-tab-pane label="异常上报 / Report Anomaly" name="anomaly">
          <el-form
            ref="formAnomalyRef"
            :model="formAnomaly"
            :rules="rulesAnomaly"
            label-width="180px"
            class="form-container"
          >
            <!-- Part Info -->
            <el-divider content-position="left">配件信息 / PART INFO</el-divider>
            <el-form-item label="配件编号 / Part Number" prop="part_id">
              <el-select
                v-model="formAnomaly.part_id"
                placeholder="搜索并选择一个配件 (Search and select a part)"
                filterable
                remote
                :remote-method="searchParts"
                :loading="isSearching"
                @change="handleAnomalyPartSelect"
                style="width: 100%"
              >
                <el-option
                  v-for="part in foundParts"
                  :key="part.id"
                  :label="`${part.part_name} (${part.part_number})`"
                  :value="part.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="当前库存 / Current Stock">
              <el-input :value="selectedAnomalyPart?.stock" disabled />
            </el-form-item>

            <!-- Operation Info -->
            <el-divider content-position="left">操作信息 / OPERATION INFO</el-divider>
            <el-form-item label="异常数量 / Anomaly Quantity" prop="quantity">
              <el-input-number
                v-model="formAnomaly.quantity"
                :min="1"
                :max="selectedAnomalyPart?.stock"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="备注 / Remarks" prop="remarks">
              <el-input v-model="formAnomaly.remarks" type="textarea" :rows="3" />
            </el-form-item>

            <!-- Actions -->
            <el-form-item>
              <el-button type="primary" @click="handleAnomalySubmit" :loading="isSubmitting"
                >提交 / SUBMIT</el-button
              >
              <el-button @click="handleAnomalyReset">重置 / RESET</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getParts, getPartByNumber } from '@/api/part.api.js'
import { createTransaction } from '@/api/transaction.api.js'

const userStore = useUserStore()
const activeTab = ref('in-out')
const isSubmitting = ref(false)
const isSearching = ref(false)

const formInOutRef = ref(null)
const partNumberInputRef = ref(null)
const quantityInputRef = ref(null)
const formInOut = reactive({
  trans_type: 'OUT',
  part_id: null,
  quantity: 1,
  remarks: '',
})
const rulesInOut = reactive({
  trans_type: [{ required: true, message: '请选择操作类型' }],
  part_id: [{ required: true, message: '请搜索并确认一个配件' }],
  quantity: [{ required: true, message: '请输入数量' }],
})
const partNumberSearch = ref('')
const foundPartInOut = ref(null)

const formAnomalyRef = ref(null)
const formAnomaly = reactive({
  part_id: null,
  quantity: 1,
  remarks: '',
})
const rulesAnomaly = reactive({
  part_id: [{ required: true, message: '请选择一个配件' }],
  quantity: [{ required: true, message: '请输入异常数量' }],
  remarks: [{ required: true, message: '请输入备注' }],
})
const foundParts = ref([])
const selectedAnomalyPart = ref(null)

const handlePartNumberInput = async () => {
  if (!partNumberSearch.value) {
    return
  }
  isSearching.value = true
  foundPartInOut.value = null
  formInOut.part_id = null
  try {
    const response = await getPartByNumber(partNumberSearch.value)
    foundPartInOut.value = response.data
    formInOut.part_id = response.data.id
    ElMessage.success(`找到配件: ${response.data.part_name}`)
    quantityInputRef.value.focus()
  } catch {
    ElMessage.error('找不到配件或发生错误 (Part not found or an error occurred)')
  } finally {
    isSearching.value = false
  }
}

const handleSubmitInOut = async () => {
  if (!formInOutRef.value) return
  await formInOutRef.value.validate(async (valid) => {
    if (valid) {
      if (formInOut.trans_type === 'OUT' && formInOut.quantity > foundPartInOut.value.stock) {
        ElMessage.warning(
          '出库数量不能大于当前库存！ (Quantity cannot be greater than current stock!)',
        )
        return
      }

      isSubmitting.value = true
      try {
        await createTransaction(formInOut)
        ElMessage.success('操作成功！ (Operation successful!)')
        handleResetInOut()
      } catch (error) {
        const errorMsg = error.response?.data?.error || '操作失败 (Operation failed)'
        ElMessage.error(errorMsg)
      } finally {
        isSubmitting.value = false
      }
    } else {
      ElMessage.error('请检查表单输入 (Please check the form input)')
    }
  })
}

const handleResetInOut = () => {
  formInOutRef.value.resetFields()
  partNumberSearch.value = ''
  foundPartInOut.value = null
  formInOut.remarks = ''
  partNumberInputRef.value.focus()
}

const searchParts = async (query) => {
  if (!query) {
    foundParts.value = []
    return
  }
  isSearching.value = true
  try {
    const response = await getParts({ search: query, pageSize: 20 })
    foundParts.value = response.data.parts
  } catch (error) {
    ElMessage.error('搜索配件失败')
  } finally {
    isSearching.value = false
  }
}

const handleAnomalyPartSelect = (partId) => {
  selectedAnomalyPart.value = foundParts.value.find((p) => p.id === partId) || null
}

const handleAnomalySubmit = async () => {
  if (!formAnomalyRef.value) return
  await formAnomalyRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        await createTransaction({ ...formAnomaly, trans_type: 'ANOMALY' })
        ElMessage.success('异常上报成功！')
        handleAnomalyReset()
      } catch (error) {
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

const handleAnomalyReset = () => {
  formAnomalyRef.value.resetFields()
  selectedAnomalyPart.value = null
  foundParts.value = []
}

onMounted(() => {
  userStore.fetchUser()
  partNumberInputRef.value?.focus()
})
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
