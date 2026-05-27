const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', default: null },
  pickup: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  destination: {
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  driverLocation: {
    lat: { type: Number },
    lng: { type: Number }
  },
  status: { 
    type: String, 
    enum: ['requested', 'accepted', 'completed', 'cancelled'], 
    default: 'requested' 
  },
  fare: { type: Number, required: true },
  vehicleType: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ride', rideSchema);
