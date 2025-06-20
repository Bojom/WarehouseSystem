// frontend/src/utils/chart-options.js

// 出入库趋势图的option构建函数
export function createTrendChartOption(dates = [], inData = [], outData = []) {
  return {
    tooltip: { trigger: 'axis' },
    legend: { data: ['入库次数', '出库次数'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '入库',
        type: 'line',
        data: inData,
        smooth: true,
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '出库',
        type: 'line',
        data: outData,
        smooth: true,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  };
}

// 库存占比饼图的option构建函数
export function createCompositionChartOption(data = []) {
  return {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 10,
      data: data.map(item => item.name)
    },
    series: [
      {
        name: '库存数量',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };
}

export function createDefectChartOption(supplierNames = [], defectCounts = []) {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      boundaryGap: [0, 0.01]
    },
    yAxis: {
      type: 'category',
      data: supplierNames,
    },
    series: [
      {
        name: '缺陷数量',
        type: 'bar',
        data: defectCounts,
        itemStyle: {
          color: '#F56C6C'
        }
      }
    ]
  };
}

// ... (未来可以添加更多图表的option构建函数)
