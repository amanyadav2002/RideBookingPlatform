const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');

// Register User
router.post('/register-user', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ name, email, phone, password });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register Driver
router.post('/register-driver', async (req, res) => {
  try {
    const { name, email, phone, vehicleModel, password } = req.body;
    
    // Check if driver exists
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) return res.status(400).json({ message: 'Driver already exists' });

    const newDriver = new Driver({ name, email, phone, vehicleModel, password });
    await newDriver.save();
    
    res.status(201).json({ message: 'Driver registered successfully', driver: newDriver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Basic Login Routes
router.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || user.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login-driver', async (req, res) => {
  try {
    const { email, password } = req.body;
    const driver = await Driver.findOne({ email });
    
    if (!driver || driver.password !== password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    res.status(200).json({ message: 'Login successful', driver });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
