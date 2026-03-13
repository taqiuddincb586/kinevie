const express = require('express');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
router.use(auth);

const toClient = (r) => ({
  id: r.id,
  clinicId: r.clinic_id,
  clinicName: r.clinic_name,
  patient: r.patient,
  sessionDate: r.session_date?.toISOString?.().split('T')[0] ?? r.session_date,
  startTime: r.start_time?.slice?.(0, 5) ?? r.start_time,
  duration: r.duration,
  endTime: r.end_time?.slice?.(0, 5) ?? r.end_time,
  location: r.location,
  notes: r.notes,
  color: r.color,
  status: r.status,
  source: r.source,
  sessionId: r.session_id,
  createdAt: r.created_at,
});

// ─── GET all bookings for user ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM bookings WHERE user_id = $1 ORDER BY session_date ASC, start_time ASC`,
      [req.userId]
    );
    res.json(rows.map(toClient));
  } catch (err) {
    console.error('GET /bookings error:', err.message);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// ─── POST create booking ──────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  const { clinicId, clinicName, patient, sessionDate, startTime, duration, location, notes, color, status, source } = req.body;
  if (!sessionDate || !startTime) return res.status(400).json({ error: 'sessionDate and startTime are required' });

  // Compute end time
  let endTime = null;
  if (startTime && duration) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + parseInt(duration);
    endTime = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO bookings (user_id, clinic_id, clinic_name, patient, session_date, start_time, duration, end_time, location, notes, color, status, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [req.userId, clinicId || null, clinicName || '', patient || '', sessionDate, startTime, duration || 60,
       endTime, location || '', notes || '', color || '#3b82f6', status || 'confirmed', source || 'manual']
    );
    res.status(201).json(toClient(rows[0]));
  } catch (err) {
    console.error('POST /bookings error:', err.message);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// ─── PUT update booking ───────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  const { clinicId, clinicName, patient, sessionDate, startTime, duration, location, notes, color, status } = req.body;

  let endTime = null;
  if (startTime && duration) {
    const [h, m] = startTime.split(':').map(Number);
    const totalMin = h * 60 + m + parseInt(duration);
    endTime = `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  }

  try {
    const { rows } = await pool.query(
      `UPDATE bookings SET
         clinic_id=$1, clinic_name=$2, patient=$3, session_date=$4, start_time=$5,
         duration=$6, end_time=$7, location=$8, notes=$9, color=$10, status=$11,
         updated_at=NOW()
       WHERE id=$12 AND user_id=$13 RETURNING *`,
      [clinicId || null, clinicName || '', patient || '', sessionDate, startTime,
       duration || 60, endTime, location || '', notes || '', color || '#3b82f6',
       status || 'confirmed', req.params.id, req.userId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Booking not found' });
    res.json(toClient(rows[0]));
  } catch (err) {
    console.error('PUT /bookings error:', err.message);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ─── DELETE booking ───────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM bookings WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!rowCount) return res.status(404).json({ error: 'Booking not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// ─── POST convert booking → session ──────────────────────────────────────────
router.post('/:id/convert', async (req, res) => {
  try {
    const { rows: bRows } = await pool.query(
      'SELECT * FROM bookings WHERE id=$1 AND user_id=$2',
      [req.params.id, req.userId]
    );
    if (!bRows[0]) return res.status(404).json({ error: 'Booking not found' });
    const b = bRows[0];

    // Create session from booking
    const { rows: sRows } = await pool.query(
      `INSERT INTO sessions (user_id, clinic_id, clinic_name, date, start_time, duration, session_type, client_initial, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.userId, b.clinic_id, b.clinic_name, b.session_date, b.start_time,
       b.duration, 'RMT', b.patient, b.notes || '']
    );
    const session = sRows[0];

    // Mark booking — keep 'completed' if that's what triggered it, otherwise 'converted'
    const newStatus = b.status === 'completed' ? 'completed' : 'converted';
    await pool.query(
      `UPDATE bookings SET status=$1, session_id=$2, updated_at=NOW() WHERE id=$3`,
      [newStatus, session.id, b.id]
    );

    res.json({
      ok: true,
      sessionId: session.id,
      session: {
        id: session.id,
        clinicId: session.clinic_id,
        clinicName: session.clinic_name,
        date: session.date?.toISOString?.().split('T')[0],
        startTime: session.start_time?.slice?.(0, 5),
        duration: session.duration,
        sessionType: session.session_type,
        clientInitial: session.client_initial,
        notes: session.notes,
      }
    });
  } catch (err) {
    console.error('Convert error:', err.message);
    res.status(500).json({ error: 'Failed to convert booking' });
  }
});

module.exports = router;
