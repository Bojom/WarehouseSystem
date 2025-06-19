<!-- frontend/src/components/charts/BaseChart.vue -->
<template>
  <div ref="chartRef" :style="{ width: '100%', height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart, BarChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
} from 'echarts/components';

echarts.use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '400px' },
  loading: { type: Boolean, default: false },
});

const chartRef = ref(null);
let chartInstance = null;

watch(() => props.loading, (isLoading) => {
  if (chartInstance) {
    if (isLoading) {
      chartInstance.showLoading();
    } else {
      chartInstance.hideLoading();
    }
  }
});

watch(() => props.option, (newOption) => {
  if (chartInstance) {
    const hasData = newOption.series?.some(s => s.data && s.data.length > 0);
    if (!hasData) {
      chartInstance.setOption({
        title: {
          text: '暂无数据',
          left: 'center',
          top: 'center',
          textStyle: { color: '#909399' }
        },
        xAxis: { show: false },
        yAxis: { show: false },
        series: [],
        legend: { show: false },
        tooltip: { show: false }
      }, true);
    } else {
      chartInstance.setOption(newOption, true);
    }
  }
}, { deep: true });

const initChart = () => {
  if (chartRef.value) {
    chartInstance = echarts.init(chartRef.value);

    watch(() => props.option, (opt) => {
        if (opt && Object.keys(opt).length > 0) {
            chartInstance.setOption(opt, true);
        }
    }, { immediate: true, deep: true });

    if (props.loading) {
      chartInstance.showLoading();
    }
  }
};

const resizeChart = () => {
  if (chartInstance) {
    chartInstance.resize();
  }
};

onMounted(() => {
  nextTick(() => {
    initChart();
  });
  window.addEventListener('resize', resizeChart);
});

onBeforeUnmount(() => {
  if (chartInstance) {
    chartInstance.dispose();
  }
  window.removeEventListener('resize', resizeChart);
});
</script>
