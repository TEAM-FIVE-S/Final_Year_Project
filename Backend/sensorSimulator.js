import axios from 'axios';

// --- Configuration ---
const SERVER_URL = 'http://localhost:8080/api/users'; // Base URL for your user routes
const DEVICE_ID = 'YOUR_ESP32_MAC_ADDRESS'; // IMPORTANT: This MUST match the deviceId in your userRoutes.js
const SEND_INTERVAL = 2000; // Check status and send data every 2 seconds

const STATUS_CHECK_URL = `${SERVER_URL}/device/status`;

// --- Helper function to get a formatted IST timestamp ---
const getISTTimestamp = () => {
  const now = new Date();

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };

  return new Intl.DateTimeFormat('en-CA', options)
    .format(now)
    .replace(',', '');
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
      console.log(`[${getISTTimestamp()}] SIMULATOR: Device is claimed. Sending data...`);

      await axios.post(`${SERVER_URL}/sensor-data`, data);

    } catch (error) {
      console.error(
        `[${getISTTimestamp()}] SIMULATOR: Error sending data:`,
        error.response ? error.response.data : 'Server not responding'
      );
    }
  } else {
    console.log(`[${getISTTimestamp()}] SIMULATOR: Device is free. Standing by...`);
  }
};

// --- Main ---
console.log('--- Smart IoT Sensor Simulator Started ---');
console.log(`Targeting server: ${SERVER_URL}`);
console.log(`Polling for claimed device every ${SEND_INTERVAL / 1000} seconds.`);
console.log('------------------------------------');

setInterval(sendSensorData, SEND_INTERVAL);