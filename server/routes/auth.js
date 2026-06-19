const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Driver = require('../models/Driver');
const Ride = require('../models/Ride');
const DriverApplication = require('../models/DriverApplication');
const Admin = require('../models/Admin');

// Register User
router.post('/register-user', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'All fields (name, email, phone, password) are required.' });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const newUser = new User({ name, email, phone, password });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email/phone';
      return res.status(400).json({ message: `An account with this ${duplicateField} already exists.` });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Register Driver Application
router.post('/register-driver', async (req, res) => {
  try {
    const { name, email, phone, vehicleModel } = req.body;

    if (!name || !email || !phone || !vehicleModel) {
      return res.status(400).json({ message: 'All fields (name, email, phone, vehicleModel) are required.' });
    }
    
    // Check if active driver already exists
    const existingDriver = await Driver.findOne({ $or: [{ email }, { phone }] });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this email or phone number already exists' });
    }

    // Check if driver application already exists
    const existingApp = await DriverApplication.findOne({ $or: [{ email }, { phone }] });
    if (existingApp) {
      if (existingApp.status === 'pending') {
        return res.status(400).json({ message: 'A registration application is already pending for this email or phone' });
      } else if (existingApp.status === 'approved') {
        return res.status(400).json({ message: 'Your application is already approved. Please proceed to create your account.' });
      } else {
        // If rejected, let them re-apply by deleting the rejected application
        await DriverApplication.deleteOne({ _id: existingApp._id });
      }
    }

    const newApp = new DriverApplication({ name, email, phone, vehicleModel, status: 'pending' });
    await newApp.save();
    
    res.status(201).json({ message: 'Driver application submitted successfully', application: newApp });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email/phone';
      return res.status(400).json({ message: `A driver application or account with this ${duplicateField} already exists.` });
    }
    res.status(500).json({ message: 'Server error submitting application' });
  }
});

// Get all Driver Applications (Admin)
router.get('/admin/applications', async (req, res) => {
  try {
    const apps = await DriverApplication.find().sort({ createdAt: -1 });
    res.json(apps);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching applications' });
  }
});

// Approve Driver Application (Admin)
router.post('/admin/applications/:id/approve', async (req, res) => {
  try {
    const app = await DriverApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    
    app.status = 'approved';
    await app.save();
    res.json({ message: 'Application approved successfully', application: app });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error approving application' });
  }
});

// Reject Driver Application (Admin)
router.post('/admin/applications/:id/reject', async (req, res) => {
  try {
    const app = await DriverApplication.findById(req.params.id);
    if (!app) return res.status(404).json({ message: 'Application not found' });
    
    app.status = 'rejected';
    await app.save();
    res.json({ message: 'Application rejected successfully', application: app });
  } catch (error) {
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin || admin.password !== password) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    res.json({ message: 'Admin login successful', username: admin.username });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during admin login' });
  }
});

// Create Driver Account after Admin approval
router.post('/driver/create-account', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
      return res.status(400).json({ message: 'Phone number and password are required' });
    }

    // Find the approved application that hasn't created an account yet
    const app = await DriverApplication.findOne({ phone, status: 'approved', isAccountCreated: false });
    if (!app) {
      // Check if it was already created
      const alreadyCreated = await DriverApplication.findOne({ phone, status: 'approved', isAccountCreated: true });
      if (alreadyCreated) {
        return res.status(400).json({ message: 'Driver account has already been created for this phone number' });
      }
      return res.status(400).json({ message: 'No approved registration application found for this phone number' });
    }

    // Double check if driver already exists
    const existingDriver = await Driver.findOne({ $or: [{ email: app.email }, { phone: app.phone }] });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver account already exists' });
    }

    // Create the active driver account
    const newDriver = new Driver({
      name: app.name,
      email: app.email,
      phone: app.phone,
      vehicleModel: app.vehicleModel,
      password: password
    });
    
    await newDriver.save();
    
    // Mark the application as completed (account created) instead of deleting it
    app.isAccountCreated = true;
    await app.save();

    res.status(201).json({ message: 'Driver account created successfully', driver: newDriver });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || 'email/phone';
      return res.status(400).json({ message: `A driver account with this ${duplicateField} already exists.` });
    }
    res.status(500).json({ message: 'Server error creating driver account' });
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

// Update Driver Online Status and Selected Service Type in DB
router.put('/driver-status/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const { isOnline, serviceType } = req.body;
    
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    driver.isOnline = isOnline;
    driver.serviceType = isOnline ? serviceType : null;
    await driver.save();

    res.json({ message: 'Driver status updated successfully', driver });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating driver status' });
  }
});

module.exports = router;
