const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const User = require('../models/User');
const isWithinBengaluru = (lat, lng) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= 12.75 &&
    latitude <= 13.22 &&
    longitude >= 77.35 &&
    longitude <= 77.85
  );
};

// Request a ride
router.post('/request', async (req, res) => {
  try {
    const { userId, pickup, destination, fare, vehicleType } = req.body;

    // Validate coordinates are within Bengaluru boundaries
    if (
      !pickup || !pickup.lat || !pickup.lng ||
      !destination || !destination.lat || !destination.lng ||
      !isWithinBengaluru(pickup.lat, pickup.lng) ||
      !isWithinBengaluru(destination.lat, destination.lng)
    ) {
      return res.status(400).json({ message: 'Booking is only allowed within the Bengaluru service region.' });
    }
    
    // Check if user already has an active ride
    const activeRide = await Ride.findOne({
      user: userId,
      status: { $in: ['requested', 'accepted'] }
    });

    if (activeRide) {
      return res.status(400).json({ message: 'You already have an active ride request or trip.' });
    }

    // Check user's wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentBalance = user.walletBalance !== undefined ? user.walletBalance : 200;
    if (currentBalance < fare) {
      return res.status(400).json({ 
        message: `Insufficient wallet balance ($${currentBalance.toFixed(2)}). Please top up your wallet to book this ride (Fare: $${fare.toFixed(2)}).` 
      });
    }

    const newRide = new Ride({
      user: userId,
      pickup,
      destination,
      fare,
      vehicleType,
      status: 'requested'
    });

    await newRide.save();
    res.status(201).json({ message: 'Ride requested successfully', ride: newRide });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error requesting ride' });
  }
});

// Get active ride for user
router.get('/active-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const ride = await Ride.findOne({
      user: userId,
      status: { $in: ['requested', 'accepted'] }
    }).populate('driver', 'name phone vehicleModel');

    res.json({ ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching active user ride' });
  }
});

// Get active ride for driver
router.get('/active-driver/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    const ride = await Ride.findOne({
      driver: driverId,
      status: 'accepted'
    }).populate('user', 'name phone');

    res.json({ ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching active driver ride' });
  }
});

// Get all pending ride requests for drivers
router.get('/pending', async (req, res) => {
  try {
    const { serviceType } = req.query;
    const filter = { status: 'requested' };
    if (serviceType && serviceType !== 'undefined' && serviceType !== 'null') {
      filter.vehicleType = serviceType;
    }
    const rides = await Ride.find(filter).populate('user', 'name phone');
    res.json({ rides });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching pending rides' });
  }
});

// Accept a ride request
router.post('/accept', async (req, res) => {
  try {
    const { rideId, driverId, lat, lng } = req.body;
    
    // Check if driver has an active ride already
    const activeDriverRide = await Ride.findOne({
      driver: driverId,
      status: 'accepted'
    });

    if (activeDriverRide) {
      return res.status(400).json({ message: 'You already have an active ride you are completing.' });
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }
    if (ride.status !== 'requested') {
      return res.status(400).json({ message: 'Ride is no longer available' });
    }

    ride.status = 'accepted';
    ride.driver = driverId;
    ride.driverLocation = { lat, lng };
    await ride.save();

    res.json({ message: 'Ride accepted successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error accepting ride' });
  }
});

// Update driver location during ride
router.post('/update-location', async (req, res) => {
  try {
    const { rideId, lat, lng } = req.body;
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    ride.driverLocation = { lat, lng };
    await ride.save();

    res.json({ message: 'Location updated successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating location' });
  }
});

// Complete a ride
router.post('/complete', async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    ride.status = 'completed';
    await ride.save();

    // Deduct fare from user's wallet
    const user = await User.findById(ride.user);
    if (user) {
      const currentBalance = user.walletBalance !== undefined ? user.walletBalance : 200;
      user.walletBalance = Math.max(0, currentBalance - ride.fare);
      await user.save();
    }

    res.json({ message: 'Ride completed successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error completing ride' });
  }
});

// Cancel a ride
router.post('/cancel', async (req, res) => {
  try {
    const { rideId } = req.body;
    const ride = await Ride.findById(rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    ride.status = 'cancelled';
    await ride.save();

    res.json({ message: 'Ride cancelled successfully', ride });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error cancelling ride' });
  }
});

// Get driver earnings and ride stats from DB
router.get('/driver-stats/:driverId', async (req, res) => {
  try {
    const { driverId } = req.params;
    
    const completedRides = await Ride.find({
      driver: driverId,
      status: 'completed'
    });

    const driver = await Driver.findById(driverId);
    let activeSessionHours = 0;
    if (driver && driver.isOnline && driver.lastOnlineTime) {
      activeSessionHours = (Date.now() - new Date(driver.lastOnlineTime)) / (1000 * 60 * 60);
    }
    const dbTotalHours = driver ? (driver.totalOnlineTime || 0) : 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    let earningsTotal = 0;
    let earningsToday = 0;
    let earningsMonth = 0;
    
    let countTotal = completedRides.length;
    let countToday = 0;
    let countMonth = 0;

    completedRides.forEach(ride => {
      const rideDate = new Date(ride.createdAt);
      earningsTotal += ride.fare;
      
      if (rideDate >= todayStart) {
        earningsToday += ride.fare;
        countToday++;
      }
      if (rideDate >= monthStart) {
        earningsMonth += ride.fare;
        countMonth++;
      }
    });

    const hoursToday = parseFloat((countToday * 0.4 + (driver && driver.isOnline ? activeSessionHours : 0)).toFixed(1));
    const hoursMonth = parseFloat((countMonth * 0.4 + (driver && driver.isOnline ? activeSessionHours : 0)).toFixed(1));
    const hoursTotal = parseFloat(Math.max(dbTotalHours + activeSessionHours, countTotal * 0.4 + activeSessionHours).toFixed(1));

    res.json({
      earnings: earningsTotal,
      earningsToday: earningsToday,
      earningsMonth: earningsMonth,
      completedCount: countTotal,
      completedCountToday: countToday,
      completedCountMonth: countMonth,
      hoursOnline: hoursTotal.toFixed(1),
      hoursOnlineToday: hoursToday.toFixed(1),
      hoursOnlineMonth: hoursMonth.toFixed(1)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching driver stats' });
  }
});

module.exports = router;
