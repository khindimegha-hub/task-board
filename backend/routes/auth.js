const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// SIGNUP
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        message: 'username, email and password are all required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'password must be at least 6 characters'
      });
    }

    const existing = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username }
      ]
    });

    if (existing) {
      return res.status(409).json({
        message: 'username or email already in use'
      });
    }

    const user = await User.create({
      username,
      email,
      password
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user
    });

  } catch (err) {
    console.error('Signup error:', err);

    res.status(500).json({
      message: 'server error during signup'
    });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      return res.status(401).json({
        message: 'invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        message: 'invalid credentials'
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user
    });

  } catch (err) {
    console.error('Login error:', err);

    res.status(500).json({
      message: 'server error during login'
    });
  }
});

module.exports = router;