const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');

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

// Get user profile details & ride stats
router.get('/user/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate total completed ride hours
    const completedRides = await Ride.find({ user: user._id, status: 'completed' });
    let totalHours = 0;
    completedRides.forEach(ride => {
      if (ride.pickup && ride.pickup.lat && ride.destination && ride.destination.lat) {
        // Haversine formula to get distance
        const getDistance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // km
          const dLat = ((lat2 - lat1) * Math.PI) / 180;
          const dLon = ((lon2 - lon1) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) *
              Math.cos((lat2 * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        const dist = getDistance(ride.pickup.lat, ride.pickup.lng, ride.destination.lat, ride.destination.lng);
        // 30 km/h average speed in Bengaluru traffic, plus 5 minutes buffer
        const rideHrs = (dist / 30) + (5 / 60);
        totalHours += rideHrs;
      } else {
        totalHours += 0.4; // fallback
      }
    });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance !== undefined ? user.walletBalance : 200,
        role: user.role,
        createdAt: user.createdAt
      },
      totalHours: parseFloat(totalHours.toFixed(1)),
      completedCount: completedRides.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
});

// Update user profile details
router.put('/user/:id', async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email already in use by another user
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'Email is already in use by another account' });
      }
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance !== undefined ? user.walletBalance : 200,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Recharge user's wallet
router.post('/user/:id/wallet/recharge', async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Invalid recharge amount' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.walletBalance = (user.walletBalance !== undefined ? user.walletBalance : 200) + Number(amount);
    await user.save();

    res.status(200).json({
      message: 'Wallet recharged successfully',
      walletBalance: user.walletBalance,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        walletBalance: user.walletBalance,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error recharging wallet' });
  }
});

module.exports = router;
