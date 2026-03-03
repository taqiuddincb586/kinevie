const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
const expensesRouter = express.Router();
expensesRouter.use(auth);

const toExpense = (r) => ({
  id: r.id,
  date: r.date?.toISOString?.().split('T')[0] ?? r.date,
  category: r.category,
  amount: parseFloat(r.amount),
  notes: r.notes,
});

expensesRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM expenses WHERE user_id=$1 ORDER BY date DESC',
      [req.userId]
    );
    res.json(rows.map(toExpense));
  } catch { res.status(500).json({ error: 'Failed to fetch expenses' }); }
});

expensesRouter.post('/', async (req, res) => {
  const { date, category, amount, notes } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO expenses (user_id,date,category,amount,notes) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.userId, date, category, amount, notes || '']
    );
    res.status(201).json(toExpense(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to create expense' }); }
});

expensesRouter.put('/:id', async (req, res) => {
  const { date, category, amount, notes } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE expenses SET date=$1,category=$2,amount=$3,notes=$4,updated_at=NOW() WHERE id=$5 AND user_id=$6 RETURNING *',
      [date, category, amount, notes || '', req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expense not found' });
    res.json(toExpense(rows[0]));
  } catch { res.status(500).json({ error: 'Failed to update expense' }); }
});

expensesRouter.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch { res.status(500).json({ error: 'Failed to delete expense' }); }
});

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const settingsRouter = express.Router();
settingsRouter.use(auth);

settingsRouter.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM settings WHERE user_id=$1', [req.userId]);
    if (!rows.length) return res.json({ smtp: {}, company: {} });
    res.json({ smtp: rows[0].smtp || {}, company: rows[0].company || {} });
  } catch { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

settingsRouter.put('/', async (req, res) => {
  const { smtp, company } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO settings (user_id, smtp, company) VALUES ($1,$2,$3)
       ON CONFLICT (user_id) DO UPDATE SET smtp=$2, company=$3, updated_at=NOW() RETURNING *`,
      [req.userId, JSON.stringify(smtp || {}), JSON.stringify(company || {})]
    );
    res.json({ smtp: rows[0].smtp, company: rows[0].company });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

module.exports = { expensesRouter, settingsRouter };
