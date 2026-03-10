const axios = require('axios');

// --- Configuration ---
const SERVER_URL = 'http://localhost:8080/api/users'; // Base URL for your user routes
const DEVICE_ID = 'YOUR_ESP32_MAC_ADDRESS'; // IMPORTANT: This MUST match the deviceId in your userRoutes.js
const SEND_INTERVAL = 2000; // Check status and send data every 2 seconds

const STATUS_CHECK_URL = `${SERVER_URL}/device/status`;

// --- NEW: Helper function to get a formatted IST timestamp ---
const getISTTimestamp = () => {
  // Create a date object for the current time
  const now = new Date();
  
  // Format it to the IST timezone (UTC+5:30)
  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false // Use 24-hour format
  };

  // The toLocaleString method formats the date correctly
  return new Intl.DateTimeFormat('en-CA', options).format(now).replace(',', '');
};

// Function to check if the device is currently claimed
const checkDeviceStatus = async () => {
  try {
    const response = await axios.get(STATUS_CHECK_URL);
    return response.data.isClaimed;
  } catch (error) {
    return false;
  }
};

// Function to generate and send sensor data
const sendSensorData = async () => {
  const isClaimed = await checkDeviceStatus();

  if (isClaimed) {
    const data = {
      deviceId: DEVICE_ID,
      heartrate: Math.floor(Math.random() * (85 - 65 + 1)) + 65,
      temperature: (36.5 + Math.random()).toFixed(1),
      spo2: Math.floor(Math.random() * (99 - 96 + 1)) + 96,
    };

    try {
      // --- UPDATED: Added timestamp to the log ---
      console.log(`[${getISTTimestamp()}] SIMULATOR: Device is claimed. Sending data...`);
      await axios.post(`${SERVER_URL}/sensor-data`, data);
    } catch (error) {
      // --- UPDATED: Added timestamp to the error log ---
      console.error(`[${getISTTimestamp()}] SIMULATOR: Error sending data:`, error.response ? error.response.data : 'Server not responding');
    }
  } else {
    // --- UPDATED: Added timestamp to the log ---
    console.log(`[${getISTTimestamp()}] SIMULATOR: Device is free. Standing by...`);
  }
};

// --- Main ---
console.log('--- Smart IoT Sensor Simulator Started ---');
console.log(`Targeting server: ${SERVER_URL}`);
console.log(`Polling for claimed device every ${SEND_INTERVAL / 1000} seconds.`);
console.log('------------------------------------');

setInterval(sendSensorData, SEND_INTERVAL);
