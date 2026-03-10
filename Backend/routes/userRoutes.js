const express = require('express');
const User = require('../models/User.js');
const SensorData = require('../models/SensorData.js');
const { protect } = require('../middleware/authMiddleware.js');
const generateToken = require('../utils/generateToken.js');

const router = express.Router();

let activeDevice = {
  deviceId: "YOUR_ESP32_MAC_ADDRESS",
  userId: null,
  timeoutId: null
};

// Signup
router.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });
  
  const user = await User.create({ name, email, password });
  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && (await user.matchPassword(password))) {
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Get all sensor data for the admin panel
// @route   GET /api/users/admin/data
// @access  Private/Admin
router.get('/admin/data', protect, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: User is not an admin' });
  }

  try {
    // Fetch the 50 most recent documents, sorted newest-first.
    const latestData = await SensorData.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('userId', 'name');

    // We no longer need to reverse the array.
    // The data is now correctly sorted from newest to oldest.
    res.json(latestData);
  } catch (error) {
    console.error('Error fetching admin data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get User's Data
router.get('/:id/data', protect, async (req, res) => {
  try {
    const sensorData = await SensorData.find({ userId: req.params.id }).sort({ createdAt: -1 });
    res.json(sensorData);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Device Claim
router.post('/device/claim', protect, (req, res) => {
  const userId = req.user._id;
  if (activeDevice.userId === null) {
    activeDevice.userId = userId;
    activeDevice.timeoutId = setTimeout(() => {
      activeDevice.userId = null;
      activeDevice.timeoutId = null;
    }, 10000);
    res.status(200).json({ message: 'Device claimed successfully.' });
  } else {
    res.status(409).json({ message: 'Device is currently in use.' });
  }
});

// Device Release
router.post('/device/release', protect, (req, res) => {
  const userId = req.user._id;
  if (activeDevice.userId && activeDevice.userId.equals(userId)) {
    clearTimeout(activeDevice.timeoutId);
    activeDevice.userId = null;
    activeDevice.timeoutId = null;
    res.status(200).json({ message: 'Device released successfully.' });
  } else {
    res.status(400).json({ message: 'You do not have a claim on this device.' });
  }
});

// Device Status
router.get('/device/status', (req, res) => {
  res.status(200).json({ isClaimed: activeDevice.userId !== null });
});

// Receive Sensor Data
router.post('/sensor-data', async (req, res) => {
  const { deviceId, heartrate, temperature, spo2 } = req.body;
  if (activeDevice.userId && deviceId === activeDevice.deviceId) {
    await SensorData.create({ userId: activeDevice.userId, heartrate, temperature, spo2 });
    res.status(201).send('Data received.');
  } else {
    res.status(202).send('Data ignored.');
  }
});

module.exports = router;
