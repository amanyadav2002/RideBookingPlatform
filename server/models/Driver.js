const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  vehicleModel: { type: String, required: true },
  travelName: { type: String, default: 'Independent' },
  password: { type: String, required: true },
  role: { type: String, default: 'driver' },
  isOnline: { type: Boolean, default: false },
  serviceType: { type: String, enum: ['Economy', 'Comfort', 'Elite', null], default: null },
  lastOnlineTime: { type: Date, default: null },
  totalOnlineTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', driverSchema);
