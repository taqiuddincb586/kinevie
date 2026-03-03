const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

const toClient = (r) => ({
  id: r.id,
  name: r.name,
  address: r.address,
  contact: r.contact,
  phone: r.phone,
  email: r.email,
  billingCycle: r.billing_cycle,
  status: r.status,
  rates: r.rates || [],
});

// GET all clinics for user
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM clinics WHERE user_id = $1 ORDER BY name',
      [req.userId]
    );
    res.json(rows.map(toClient));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch clinics' });
  }
});

// POST create clinic
router.post('/', async (req, res) => {
  const { name, address, contact, phone, email, billingCycle, status, rates } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO clinics (user_id, name, address, contact, phone, email, billing_cycle, status, rates)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, name, address, contact, phone, email, billingCycle || 'monthly', status || 'active', JSON.stringify(rates || [])]
    );
    res.status(201).json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create clinic' });
  }
});

// PUT update clinic
router.put('/:id', async (req, res) => {
  const { name, address, contact, phone, email, billingCycle, status, rates } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE clinics SET name=$1, address=$2, contact=$3, phone=$4, email=$5,
       billing_cycle=$6, status=$7, rates=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [name, address, contact, phone, email, billingCycle, status, JSON.stringify(rates || []), req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Clinic not found' });
    res.json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update clinic' });
  }
});

// DELETE clinic
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM clinics WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete clinic' });
  }
});

module.exports = router;
