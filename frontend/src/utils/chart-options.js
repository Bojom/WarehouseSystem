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
      { name: '入库次数', type: 'line', data: inData, smooth: true },
      { name: '出库次数', type: 'line', data: outData, smooth: true },
    ],
  };
}

// 库存占比饼图的option构建函数
export function createCompositionChartOption(data = []) {
  return {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', left: 'left' },
    series: [
      {
        name: '库存量',
        type: 'pie',
        radius: '70%',
        data: data,
        emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
      },
    ],
  };
}

// ... (未来可以添加更多图表的option构建函数)
