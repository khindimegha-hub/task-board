require('dotenv').config({ path: '../.env' });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const User = require('./models/User');

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1
  });
});

// Authentication routes
app.use('/api/auth', authRoutes);

// Get currently logged-in user
app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: 'user not found'
      });
    }

    res.json({
      user
    });

  } catch (err) {
    console.error('Me route error:', err);

    res.status(500).json({
      message: 'server error'
    });
  }
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start server
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('MongoDB connected successfully!');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  });