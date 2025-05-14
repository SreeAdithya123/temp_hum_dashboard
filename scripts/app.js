// Main application logic
document.addEventListener('DOMContentLoaded', function() {
  // Initialize Firebase connection
  window.firebaseModule.init();
  
  // Initialize the chart
  window.chartModule.initializeChart();
  
  // Set up theme toggle
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', toggleTheme);
  
  // Set initial theme based on user preference
  initializeTheme();
  
  // Set up time filter buttons
  setupTimeFilters();
  
  // For demonstration purposes, load dummy data if Firebase isn't connected
  setTimeout(() => {
    const statusIndicator = document.getElementById('status-indicator');
    
    // If not connected after 3 seconds, use dummy data
    if (!statusIndicator.classList.contains('connected')) {
      console.log('Using dummy data for demonstration');
      loadDummyData();
    }
  }, 3000);
});

// Initialize theme based on user preference
function initializeTheme() {
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  const storedTheme = localStorage.getItem('theme');
  
  if (storedTheme === 'dark' || (!storedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('dark-theme');
    // Update chart theme if chart is initialized
    if (window.chartModule) {
      window.chartModule.updateChartTheme();
    }
  }
}

// Toggle between light and dark themes
function toggleTheme() {
  const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', newTheme);
  
  // Update chart colors
  window.chartModule.updateChartTheme();
  
  // Animate the theme toggle button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.classList.add('animate-toggle');
  setTimeout(() => {
    themeToggleBtn.classList.remove('animate-toggle');
  }, 500);
}

// Set up time filter buttons
function setupTimeFilters() {
  const timeFilterButtons = document.querySelectorAll('.time-filter');
  timeFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      timeFilterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update chart with selected time range
      const timeRange = button.getAttribute('data-time');
      window.chartModule.updateChart(timeRange);
    });
  });
}

// For demonstration: Load dummy data if Firebase not connected
function loadDummyData() {
  const dummyData = window.chartModule.generateDummyData();
  
  // Copy to the dataHistory object
  window.firebaseModule.dataHistory.temperature = [...dummyData.temperature];
  window.firebaseModule.dataHistory.humidity = [...dummyData.humidity];
  window.firebaseModule.dataHistory.timestamps = [...dummyData.timestamps];
  
  // Update last value
  const lastIndex = dummyData.temperature.length - 1;
  updateDashboardWithDummyData({
    temperature: dummyData.temperature[lastIndex],
    humidity: dummyData.humidity[lastIndex],
    timestamp: dummyData.timestamps[lastIndex].toISOString()
  });
  
  // Update chart
  window.chartModule.updateChart('hour');
  
  // Set connection status to "demo mode"
  const connectionStatusIndicator = document.getElementById('status-indicator');
  const connectionText = document.getElementById('connection-text');
  connectionStatusIndicator.className = 'connected';
  connectionText.textContent = 'Demo Mode: Using simulated data';
  
  // Update data periodically to simulate real-time updates
  setInterval(() => {
    // Generate a new random data point
    const lastTimestamp = new Date(dummyData.timestamps[dummyData.timestamps.length - 1].getTime() + 60000);
    const hourOfDay = lastTimestamp.getHours();
    const dayFactor = Math.sin(((hourOfDay - 6) / 24) * Math.PI * 2);
    
    // Create variations from the last values
    const lastTemp = dummyData.temperature[dummyData.temperature.length - 1];
    const lastHumidity = dummyData.humidity[dummyData.humidity.length - 1];
    
    // Small random variations
    const newTemp = Math.max(10, Math.min(40, lastTemp + (Math.random() - 0.5) * 0.5));
    const newHumidity = Math.max(20, Math.min(95, lastHumidity + (Math.random() - 0.5) * 2));
    
    // Add new data point
    dummyData.temperature.push(newTemp);
    dummyData.humidity.push(newHumidity);
    dummyData.timestamps.push(lastTimestamp);
    
    // Remove oldest data point to keep array size consistent
    if (dummyData.timestamps.length > 7 * 24 * 4) { // Keep a week's worth of 15-minute data
      dummyData.temperature.shift();
      dummyData.humidity.shift();
      dummyData.timestamps.shift();
    }
    
    // Update the data history
    window.firebaseModule.dataHistory.temperature = [...dummyData.temperature];
    window.firebaseModule.dataHistory.humidity = [...dummyData.humidity];
    window.firebaseModule.dataHistory.timestamps = [...dummyData.timestamps];
    
    // Update dashboard with latest values
    updateDashboardWithDummyData({
      temperature: newTemp,
      humidity: newHumidity,
      timestamp: lastTimestamp.toISOString()
    });
    
    // Update chart
    const activeTimeFilter = document.querySelector('.time-filter.active');
    window.chartModule.updateChart(activeTimeFilter.getAttribute('data-time'));
    
  }, 10000); // Update every 10 seconds
}

// Similar to the updateDashboardData function in firebase.js but for dummy data
function updateDashboardWithDummyData(data) {
  const tempElement = document.getElementById('current-temperature');
  const humidityElement = document.getElementById('current-humidity');
  const tempTrendIcon = document.getElementById('temp-trend-icon');
  const tempTrendValue = document.getElementById('temp-trend-value');
  const humidityTrendIcon = document.getElementById('humidity-trend-icon');
  const humidityTrendValue = document.getElementById('humidity-trend-value');
  
  // Previous values
  const prevTemp = parseFloat(tempElement.textContent);
  const prevHumidity = parseFloat(humidityElement.textContent);
  
  // Add updating class for animation
  tempElement.classList.add('updating');
  humidityElement.classList.add('updating');
  
  // Update values
  tempElement.textContent = data.temperature.toFixed(1);
  humidityElement.textContent = data.humidity.toFixed(0);
  
  // Update last updated time
  document.getElementById('last-updated-time').textContent = 
    new Date(data.timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  
  // Calculate and display trends
  if (!isNaN(prevTemp) && !isNaN(prevHumidity)) {
    const tempDiff = data.temperature - prevTemp;
    updateTrendIndicator(tempTrendIcon, tempTrendValue, tempDiff, '°C');
    
    const humidityDiff = data.humidity - prevHumidity;
    updateTrendIndicator(humidityTrendIcon, humidityTrendValue, humidityDiff, '%');
  }
  
  // Remove animation class after animation completes
  setTimeout(() => {
    tempElement.classList.remove('updating');
    humidityElement.classList.remove('updating');
  }, 500);
}

// Copy of updateTrendIndicator from firebase.js
function updateTrendIndicator(iconElement, valueElement, difference, unit) {
  // Round to 1 decimal for temperature, 0 decimals for humidity
  const formattedDiff = unit === '°C' ? Math.abs(difference).toFixed(1) : Math.abs(difference).toFixed(0);
  
  // Don't show very small changes
  if (Math.abs(difference) < 0.1 && unit === '°C') {
    iconElement.innerHTML = '<span class="trend-neutral">⟷</span>';
    valueElement.innerHTML = `<span class="trend-neutral">No change</span>`;
    return;
  } else if (Math.abs(difference) < 1 && unit === '%') {
    iconElement.innerHTML = '<span class="trend-neutral">⟷</span>';
    valueElement.innerHTML = `<span class="trend-neutral">No change</span>`;
    return;
  }
  
  if (difference > 0) {
    iconElement.innerHTML = '<span class="trend-up">↑</span>';
    valueElement.innerHTML = `<span class="trend-up">+${formattedDiff}${unit}</span>`;
  } else if (difference < 0) {
    iconElement.innerHTML = '<span class="trend-down">↓</span>';
    valueElement.innerHTML = `<span class="trend-down">${formattedDiff}${unit}</span>`;
  } else {
    iconElement.innerHTML = '<span class="trend-neutral">⟷</span>';
    valueElement.innerHTML = `<span class="trend-neutral">No change</span>`;
  }
}