require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB (HumSafarDB)');
    // Seed Admin
    try {
      const Admin = require('./models/Admin');
      const adminExists = await Admin.findOne({ username: 'admin' });
      if (!adminExists) {
        const newAdmin = new Admin({
          username: 'admin',
          password: 'admin123'
        });
        await newAdmin.save();
        console.log('✅ Default Admin user seeded successfully');
      }
    } catch (err) {
      console.error('❌ Error seeding Admin user:', err);
    }
  })
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// Health Check
app.get('/', (req, res) => {
  res.send('HumSafar API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
