const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

const toClient = (r) => ({
  id: r.id,
  clinicId: r.clinic_id,
  clinicName: r.clinic_name,
  invoiceNumber: r.invoice_number,
  date: r.date?.toISOString?.().split('T')[0] ?? r.date,
  dueDate: r.due_date?.toISOString?.().split('T')[0] ?? r.due_date,
  periodFrom: r.period_from?.toISOString?.().split('T')[0] ?? r.period_from,
  periodTo: r.period_to?.toISOString?.().split('T')[0] ?? r.period_to,
  lineItems: r.line_items || [],
  subtotal: parseFloat(r.subtotal),
  tax: parseFloat(r.tax),
  taxRate: parseFloat(r.tax_rate),
  total: parseFloat(r.total),
  status: r.status,
  emailSent: r.email_sent,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM invoices WHERE user_id=$1 ORDER BY date DESC',
      [req.userId]
    );
    res.json(rows.map(toClient));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

router.post('/', async (req, res) => {
  const { clinicId, clinicName, invoiceNumber, date, dueDate, periodFrom, periodTo,
          lineItems, subtotal, tax, taxRate, total, status } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO invoices (user_id, clinic_id, clinic_name, invoice_number, date, due_date,
       period_from, period_to, line_items, subtotal, tax, tax_rate, total, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [req.userId, clinicId || null, clinicName, invoiceNumber, date, dueDate,
       periodFrom, periodTo, JSON.stringify(lineItems || []),
       subtotal, tax, taxRate || 13, total, status || 'unpaid']
    );
    res.status(201).json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

router.put('/:id', async (req, res) => {
  const { clinicId, clinicName, invoiceNumber, date, dueDate, periodFrom, periodTo,
          lineItems, subtotal, tax, taxRate, total, status, emailSent } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE invoices SET clinic_id=$1, clinic_name=$2, invoice_number=$3, date=$4,
       due_date=$5, period_from=$6, period_to=$7, line_items=$8, subtotal=$9, tax=$10,
       tax_rate=$11, total=$12, status=$13, email_sent=$14, updated_at=NOW()
       WHERE id=$15 AND user_id=$16 RETURNING *`,
      [clinicId || null, clinicName, invoiceNumber, date, dueDate, periodFrom, periodTo,
       JSON.stringify(lineItems || []), subtotal, tax, taxRate, total, status,
       emailSent || null, req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Invoice not found' });
    res.json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM invoices WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

module.exports = router;
