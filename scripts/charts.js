// Chart configuration
let historicalChart = null;

// Initialize the chart
function initializeChart() {
  const ctx = document.getElementById('historical-chart').getContext('2d');
  
  // Define gradient for temperature line
  const tempGradient = ctx.createLinearGradient(0, 0, 0, 400);
  tempGradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
  tempGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
  
  // Define gradient for humidity line
  const humidityGradient = ctx.createLinearGradient(0, 0, 0, 400);
  humidityGradient.addColorStop(0, 'rgba(20, 184, 166, 0.5)');
  humidityGradient.addColorStop(1, 'rgba(20, 184, 166, 0)');
  
  const isDarkTheme = document.body.classList.contains('dark-theme');
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkTheme ? '#D1D5DB' : '#4B5563';
  
  historicalChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'Temperature (°C)',
          data: [],
          borderColor: '#3B82F6',
          backgroundColor: tempGradient,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#3B82F6',
          fill: true,
          tension: 0.4,
          yAxisID: 'y'
        },
        {
          label: 'Humidity (%)',
          data: [],
          borderColor: '#14B8A6',
          backgroundColor: humidityGradient,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#14B8A6',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      animation: {
        duration: 1000
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'minute',
            displayFormats: {
              minute: 'HH:mm',
              hour: 'HH:mm',
              day: 'MMM d'
            }
          },
          grid: {
            display: true,
            color: gridColor
          },
          ticks: {
            color: textColor,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'Temperature (°C)',
            color: '#3B82F6'
          },
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Humidity (%)',
            color: '#14B8A6'
          },
          grid: {
            drawOnChartArea: false,
            color: gridColor
          },
          ticks: {
            color: textColor
          },
          min: 0,
          max: 100
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            boxWidth: 6,
            color: textColor
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: isDarkTheme ? '#1F2937' : 'rgba(255, 255, 255, 0.9)',
          titleColor: isDarkTheme ? '#F9FAFB' : '#1F2937',
          bodyColor: isDarkTheme ? '#D1D5DB' : '#4B5563',
          borderColor: isDarkTheme ? '#374151' : '#E5E7EB',
          borderWidth: 1,
          callbacks: {
            title: function(tooltipItems) {
              const date = new Date(tooltipItems[0].parsed.x);
              return date.toLocaleString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });
            }
          }
        }
      }
    }
  });
  
  return historicalChart;
}

// Update chart with new data
function updateChart(timeRange = 'hour') {
  if (!historicalChart) {
    historicalChart = initializeChart();
  }
  
  // Get filtered data based on selected time range
  const filteredData = window.firebaseModule.fetchHistoricalData(timeRange);
  
  // Update chart data
  historicalChart.data.labels = filteredData.timestamps;
  historicalChart.data.datasets[0].data = filteredData.temperature.map((temp, index) => {
    return {
      x: filteredData.timestamps[index],
      y: temp
    };
  });
  
  historicalChart.data.datasets[1].data = filteredData.humidity.map((humidity, index) => {
    return {
      x: filteredData.timestamps[index],
      y: humidity
    };
  });
  
  // Update time unit based on selected range
  if (timeRange === 'hour') {
    historicalChart.options.scales.x.time.unit = 'minute';
  } else if (timeRange === 'day') {
    historicalChart.options.scales.x.time.unit = 'hour';
  } else if (timeRange === 'week') {
    historicalChart.options.scales.x.time.unit = 'day';
  }
  
  // Update chart
  historicalChart.update();
}

// Update chart colors based on theme
function updateChartTheme() {
  if (!historicalChart) return;
  
  const isDarkTheme = document.body.classList.contains('dark-theme');
  const gridColor = isDarkTheme ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const textColor = isDarkTheme ? '#D1D5DB' : '#4B5563';
  
  // Update grid colors
  historicalChart.options.scales.x.grid.color = gridColor;
  historicalChart.options.scales.y.grid.color = gridColor;
  historicalChart.options.scales.y1.grid.color = gridColor;
  
  // Update text colors
  historicalChart.options.scales.x.ticks.color = textColor;
  historicalChart.options.scales.y.ticks.color = textColor;
  historicalChart.options.scales.y1.ticks.color = textColor;
  
  // Update legend colors
  historicalChart.options.plugins.legend.labels.color = textColor;
  
  // Update tooltip style
  historicalChart.options.plugins.tooltip.backgroundColor = isDarkTheme ? '#1F2937' : 'rgba(255, 255, 255, 0.9)';
  historicalChart.options.plugins.tooltip.titleColor = isDarkTheme ? '#F9FAFB' : '#1F2937';
  historicalChart.options.plugins.tooltip.bodyColor = isDarkTheme ? '#D1D5DB' : '#4B5563';
  historicalChart.options.plugins.tooltip.borderColor = isDarkTheme ? '#374151' : '#E5E7EB';
  
  historicalChart.update();
}

// Create dummy data for demonstration purposes
function generateDummyData() {
  const dummyData = {
    temperature: [],
    humidity: [],
    timestamps: []
  };
  
  const now = new Date();
  // Generate data for the past week
  for (let i = 7 * 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 15 * 60 * 1000)); // 15-minute intervals
    
    // Generate somewhat realistic temperature and humidity data with some sine wave patterns
    const hourOfDay = timestamp.getHours();
    const dayFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2); // Peak at 6 PM, lowest at 6 AM
    
    // Temperature: Base of 23°C with ±5°C daily variation
    const temperatureBase = 23;
    const dailyVariation = 5;
    const randomNoise = (Math.random() - 0.5) * 2; // ±1°C random noise
    
    const temperature = temperatureBase + (dayFactor * dailyVariation) + randomNoise;
    
    // Humidity: Base of 50% with ±20% daily variation, inverse to temperature
    const humidityBase = 50;
    const humidityVariation = 20;
    const humidityRandomNoise = (Math.random() - 0.5) * 10; // ±5% random noise
    
    // Humidity is generally higher at night, so inverse of temperature pattern
    const humidity = Math.min(Math.max(humidityBase - (dayFactor * humidityVariation) + humidityRandomNoise, 20), 95);
    
    dummyData.temperature.push(temperature);
    dummyData.humidity.push(humidity);
    dummyData.timestamps.push(timestamp);
  }
  
  return dummyData;
}

// Export functions for use in other modules
window.chartModule = {
  initializeChart: initializeChart,
  updateChart: updateChart,
  updateChartTheme: updateChartTheme,
  generateDummyData: generateDummyData
};