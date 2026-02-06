const express = require('express');
const bcrypt = require('bcryptjs');
const { runQuery, getOne } = require('../models/database');
const { generateToken, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const {
      email,
      password,
      full_name,
      address,
      phone_number,
      linkedin_profile,
      github_link,
      experience_years
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required' });
    }

    // Check if user already exists
    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await runQuery(
      `INSERT INTO users (email, password, full_name, address, phone_number, linkedin_profile, github_link, experience_years)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, full_name, address || '', phone_number || '', linkedin_profile || '', github_link || '', experience_years || 0]
    );

    const user = await getOne('SELECT id, email, full_name, role FROM users WHERE id = ?', [result.lastID]);
    const token = generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      user: { 
        id: user.id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role 
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await getOne(
      `SELECT id, email, full_name, address, phone_number, linkedin_profile, github_link, experience_years, role, created_at 
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await getOne('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await runQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashedPassword, req.user.id]);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

module.exports = router;
