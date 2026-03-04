const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');

const router = express.Router();

const signToken = (userId, email, role) =>
  jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Full name required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, fullName, rmtNumber, role } = req.body;
    const userRole = (role === 'administrator') ? 'administrator' : 'practitioner';

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      const hash = await bcrypt.hash(password, 12);
      const result = await pool.query(
        `INSERT INTO users (email, password, full_name, rmt_number, role)
         VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, rmt_number, role, created_at`,
        [email, hash, fullName, rmtNumber || null, userRole]
      );

      const user = result.rows[0];

      // Create default settings row
      await pool.query(
        `INSERT INTO settings (user_id, smtp, company) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING`,
        [user.id, JSON.stringify({}), JSON.stringify({})]
      );

      const token = signToken(user.id, user.email, user.role);
      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          rmtNumber: user.rmt_number,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error during registration' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        'SELECT id, email, password, full_name, rmt_number, role FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = signToken(user.id, user.email, user.role);
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          rmtNumber: user.rmt_number,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error during login' });
    }
  }
);

// GET /api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name, rmt_number, role, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ id: u.id, email: u.email, fullName: u.full_name, rmtNumber: u.rmt_number, role: u.role });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
