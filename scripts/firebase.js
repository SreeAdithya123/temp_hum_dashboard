// Firebase Configuration
// These values should be replaced with your Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Data storage for historical values
const dataHistory = {
  temperature: [],
  humidity: [],
  timestamps: []
};

// Maximum number of data points to keep in memory
const MAX_HISTORY_POINTS = 100;

// Reference to the sensor data in Firebase
const sensorDataRef = database.ref('sensor_data');

// Listen for data changes
function initializeFirebaseListeners() {
  // Set connection status
  const connectionStatusIndicator = document.getElementById('status-indicator');
  const connectionText = document.getElementById('connection-text');
  
  database.ref('.info/connected').on('value', (snap) => {
    if (snap.val() === true) {
      connectionStatusIndicator.className = 'connected';
      connectionText.textContent = 'Connected to sensors';
    } else {
      connectionStatusIndicator.className = 'disconnected';
      connectionText.textContent = 'Disconnected from sensors';
    }
  });

  // Listen for real-time updates
  sensorDataRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    updateDashboardData(data);
    
    // Add to history (only if timestamp is different)
    const timestamp = new Date(data.timestamp);
    
    // Check if this is a new timestamp to avoid duplicates
    if (dataHistory.timestamps.length === 0 || 
        timestamp.getTime() !== dataHistory.timestamps[dataHistory.timestamps.length - 1].getTime()) {
      
      dataHistory.temperature.push(data.temperature);
      dataHistory.humidity.push(data.humidity);
      dataHistory.timestamps.push(timestamp);
      
      // Limit the size of the arrays to prevent memory issues
      if (dataHistory.timestamps.length > MAX_HISTORY_POINTS) {
        dataHistory.temperature.shift();
        dataHistory.humidity.shift();
        dataHistory.timestamps.shift();
      }
      
      // Update the chart with new data
      updateChart();
    }
    
    // Update last updated time
    document.getElementById('last-updated-time').textContent = formatTime(timestamp);
  }, (error) => {
    console.error("Error fetching sensor data:", error);
    connectionStatusIndicator.className = 'disconnected';
    connectionText.textContent = 'Error: ' + error.message;
  });
}

// Function to fetch historical data
function fetchHistoricalData(timeRange) {
  // In a real application, you would query Firebase for historical data based on timeRange
  // For demo purposes, we're using the data we've collected so far
  
  // You could implement this with Firebase queries like:
  // const startTime = new Date();
  // startTime.setHours(startTime.getHours() - hoursToGoBack);
  
  // database.ref('sensor_data_history')
  //   .orderByChild('timestamp')
  //   .startAt(startTime.toISOString())
  //   .once('value', (snapshot) => {
  //     // Process the historical data
  //   });
  
  // For now, we'll just filter our existing data
  const now = new Date();
  let filterTime;
  
  switch (timeRange) {
    case 'hour':
      filterTime = new Date(now.getTime() - (60 * 60 * 1000)); // 1 hour ago
      break;
    case 'day':
      filterTime = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
      break;
    case 'week':
      filterTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
      break;
    default:
      filterTime = new Date(now.getTime() - (60 * 60 * 1000)); // Default to 1 hour
  }
  
  // Filter the data we have based on the selected time range
  const filteredData = {
    temperature: [],
    humidity: [],
    timestamps: []
  };
  
  for (let i = 0; i < dataHistory.timestamps.length; i++) {
    if (dataHistory.timestamps[i] >= filterTime) {
      filteredData.temperature.push(dataHistory.temperature[i]);
      filteredData.humidity.push(dataHistory.humidity[i]);
      filteredData.timestamps.push(dataHistory.timestamps[i]);
    }
  }
  
  return filteredData;
}

// Previous values to calculate trends
let previousValues = {
  temperature: null,
  humidity: null
};

// Update dashboard with new data
function updateDashboardData(data) {
  const tempElement = document.getElementById('current-temperature');
  const humidityElement = document.getElementById('current-humidity');
  const tempTrendIcon = document.getElementById('temp-trend-icon');
  const tempTrendValue = document.getElementById('temp-trend-value');
  const humidityTrendIcon = document.getElementById('humidity-trend-icon');
  const humidityTrendValue = document.getElementById('humidity-trend-value');
  
  // Add updating class for animation
  tempElement.classList.add('updating');
  humidityElement.classList.add('updating');
  
  // Update values
  tempElement.textContent = data.temperature.toFixed(1);
  humidityElement.textContent = data.humidity.toFixed(0);
  
  // Calculate and display trends if we have previous values
  if (previousValues.temperature !== null) {
    const tempDiff = data.temperature - previousValues.temperature;
    updateTrendIndicator(tempTrendIcon, tempTrendValue, tempDiff, '°C');
    
    const humidityDiff = data.humidity - previousValues.humidity;
    updateTrendIndicator(humidityTrendIcon, humidityTrendValue, humidityDiff, '%');
  }
  
  // Store current values for next comparison
  previousValues.temperature = data.temperature;
  previousValues.humidity = data.humidity;
  
  // Remove animation class after animation completes
  setTimeout(() => {
    tempElement.classList.remove('updating');
    humidityElement.classList.remove('updating');
  }, 500);
}

// Update trend indicators
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

// Format time for display
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Export functions and data for use in other modules
window.firebaseModule = {
  init: initializeFirebaseListeners,
  fetchHistoricalData: fetchHistoricalData,
  dataHistory: dataHistory
};