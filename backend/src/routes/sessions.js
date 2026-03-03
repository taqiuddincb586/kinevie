const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

router.use(auth);

const toClient = (r) => ({
  id: r.id,
  clinicId: r.clinic_id,
  clinicName: r.clinic_name,
  date: r.date?.toISOString?.().split('T')[0] ?? r.date,
  startTime: r.start_time?.slice?.(0,5) ?? r.start_time,
  duration: r.duration,
  sessionType: r.session_type,
  clientInitial: r.client_initial,
  notes: r.notes,
});

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM sessions WHERE user_id=$1 ORDER BY date DESC, start_time DESC',
      [req.userId]
    );
    res.json(rows.map(toClient));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

router.post('/', async (req, res) => {
  const { clinicId, clinicName, date, startTime, duration, sessionType, clientInitial, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO sessions (user_id, clinic_id, clinic_name, date, start_time, duration, session_type, client_initial, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, clinicId || null, clinicName, date, startTime || null, duration, sessionType || 'RMT', clientInitial, notes || '']
    );
    res.status(201).json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

router.post('/bulk', async (req, res) => {
  const { sessions } = req.body;
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return res.status(400).json({ error: 'sessions array required' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = [];
    for (const s of sessions) {
      const { rows } = await client.query(
        `INSERT INTO sessions (user_id, clinic_id, clinic_name, date, start_time, duration, session_type, client_initial, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.userId, s.clinicId || null, s.clinicName, s.date, s.startTime || null, s.duration, s.sessionType || 'RMT', s.clientInitial, s.notes || '']
      );
      inserted.push(toClient(rows[0]));
    }
    await client.query('COMMIT');
    res.status(201).json(inserted);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Bulk insert failed' });
  } finally {
    client.release();
  }
});

router.put('/:id', async (req, res) => {
  const { clinicId, clinicName, date, startTime, duration, sessionType, clientInitial, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE sessions SET clinic_id=$1, clinic_name=$2, date=$3, start_time=$4, duration=$5,
       session_type=$6, client_initial=$7, notes=$8, updated_at=NOW()
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [clinicId || null, clinicName, date, startTime || null, duration, sessionType, clientInitial, notes || '', req.params.id, req.userId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Session not found' });
    res.json(toClient(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM sessions WHERE id=$1 AND user_id=$2', [req.params.id, req.userId]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
