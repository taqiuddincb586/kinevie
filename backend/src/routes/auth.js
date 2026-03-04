const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db');

const router = express.Router();

const signToken = (userId, email, role) =>
  jwt.sign({ userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const safeUser = (u) => ({
  id: u.id, email: u.email, fullName: u.full_name,
  rmtNumber: u.rmt_number, role: u.role, status: u.status, theme: u.theme || 'warm-beige',
});

async function sendEmail({ to, subject, html }) {
  let apiKey = process.env.RESEND_API_KEY;
  let fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
  let fromName = process.env.FROM_NAME || 'Kinevie Lite';
  if (!apiKey) {
    try {
      const { rows } = await pool.query("SELECT smtp FROM settings WHERE smtp->>'apiKey' IS NOT NULL LIMIT 1");
      if (rows[0]?.smtp?.apiKey) { apiKey = rows[0].smtp.apiKey; fromEmail = rows[0].smtp.fromEmail || fromEmail; fromName = rows[0].smtp.fromName || fromName; }
    } catch(e){}
  }
  if (!apiKey) { console.warn('No Resend API key - email skipped:', subject); return; }
  const body = JSON.stringify({ from: `${fromName} <${fromEmail}>`, to: [to], subject, html });
  return new Promise((resolve) => {
    const req = https.request({ hostname: 'api.resend.com', path: '/emails', method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => { let d=''; res.on('data',c=>d+=c); res.on('end',()=>{ if(res.statusCode>=400) console.warn('Resend:',d); resolve(); }); });
    req.on('error', ()=>resolve()); req.setTimeout(10000,()=>{req.destroy();resolve()}); req.write(body); req.end();
  });
}

const B = (c) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;"><div style="background:#7a6248;padding:20px 28px;border-radius:8px 8px 0 0;"><h1 style="color:#c4a882;margin:0;font-size:22px;font-family:Georgia,serif;">Kinevie <span style="font-size:14px;font-weight:400;opacity:0.7">Lite</span></h1><p style="color:rgba(253,245,232,0.6);margin:2px 0 0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Smart Practice Manager</p></div><div style="background:#fdf8f2;padding:28px;border:1px solid #ddd0b8;border-top:none;border-radius:0 0 8px 8px;">${c}</div><p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:12px;">Developed by <a href="https://www.crossbolt.ca" style="color:#c4a882;">Crossbolt Technologies Inc.</a></p></div>`;

// REGISTER
router.post('/register', [body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }), body('password').isLength({min:8}), body('fullName').trim().isLength({min:2})],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password, fullName, rmtNumber, role } = req.body;
  const userRole = role === 'administrator' ? 'administrator' : 'practitioner';
  const status = userRole === 'administrator' ? 'active' : 'pending';
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'An account with this email already exists' });
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      `INSERT INTO users (email, password, full_name, rmt_number, role, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, email, full_name, rmt_number, role, status`,
      [email, hash, fullName, rmtNumber||null, userRole, status]
    );
    const user = result.rows[0];
    await pool.query(`INSERT INTO settings (user_id, smtp, company) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [user.id, '{}', '{}']);
    if (status === 'pending') {
      const admins = await pool.query("SELECT email, full_name FROM users WHERE role='administrator' AND status='active'");
      for (const admin of admins.rows) {
        await sendEmail({ to: admin.email, subject: `New registration request: ${fullName}`,
          html: B(`<h2 style="color:#3d2e1a;margin-top:0;">New User Registration Request</h2><p>A new user is awaiting approval:</p><table style="width:100%;border-collapse:collapse;margin:16px 0;"><tr><td style="padding:8px 0;color:#8a7055;width:120px;">Name</td><td style="font-weight:600;color:#3d2e1a;">${fullName}</td></tr><tr><td style="padding:8px 0;color:#8a7055;">Email</td><td style="font-weight:600;">${email}</td></tr><tr><td style="padding:8px 0;color:#8a7055;">Role</td><td style="font-weight:600;">${userRole}</td></tr></table><p>Log in to <strong>Kinevie Lite → User Management</strong> to approve or reject.</p>`)
        });
      }
      return res.status(201).json({ pending: true, message: 'Registration submitted. You will receive an email once approved.' });
    }
    const token = signToken(user.id, user.email, user.role);
    res.status(201).json({ token, user: safeUser(user) });
  } catch(err) { console.error('Register error:', err); res.status(500).json({ error: 'Server error' }); }
});

// LOGIN
router.post('/login', [body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }), body('password').notEmpty()],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id,email,password,full_name,rmt_number,role,status,login_attempts,locked_until,theme FROM users WHERE email=$1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid email or password' });
    const user = result.rows[0];
    if (user.status === 'pending') return res.status(403).json({ error: 'Your account is pending administrator approval.' });
    if (user.status === 'rejected') return res.status(403).json({ error: 'Your registration was not approved. Contact your administrator.' });
    if (user.status === 'disabled') return res.status(403).json({ error: 'Your account has been disabled. Contact your administrator.' });
    if (user.locked_until && new Date(user.locked_until) > new Date()) return res.status(403).json({ error: 'Account temporarily locked. Check your email for instructions.' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const attempts = (user.login_attempts||0) + 1;
      if (attempts >= 5) {
        await pool.query("UPDATE users SET login_attempts=$1, status='disabled', locked_until=NOW()+INTERVAL '1 hour' WHERE id=$2", [attempts, user.id]);
        await sendEmail({ to: user.email, subject: 'Kinevie Lite: Account Locked',
          html: B(`<h2 style="color:#dc2626;margin-top:0;">⚠ Account Locked</h2><p>Your account has been locked after 5 failed login attempts.</p><p>Please contact your administrator or use <strong>Forgot Password</strong> to reset your credentials.</p>`)
        });
        return res.status(403).json({ error: 'Account locked after 5 failed attempts. Check your email.' });
      }
      await pool.query('UPDATE users SET login_attempts=$1 WHERE id=$2', [attempts, user.id]);
      return res.status(401).json({ error: `Invalid email or password. ${5-attempts} attempt(s) remaining before lockout.` });
    }
    await pool.query('UPDATE users SET login_attempts=0, locked_until=NULL WHERE id=$1', [user.id]);
    const token = signToken(user.id, user.email, user.role);
    res.json({ token, user: safeUser(user) });
  } catch(err) { console.error('Login error:', err); res.status(500).json({ error: 'Server error' }); }
});

// ME
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id,email,full_name,rmt_number,role,status,theme FROM users WHERE id=$1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(safeUser(rows[0]));
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// UPDATE PROFILE
router.put('/profile', require('../middleware/auth'), async (req, res) => {
  const { fullName, rmtNumber, theme } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET full_name=COALESCE($1,full_name), rmt_number=COALESCE($2,rmt_number), theme=COALESCE($3,theme), updated_at=NOW() WHERE id=$4 RETURNING id,email,full_name,rmt_number,role,status,theme`,
      [fullName||null, rmtNumber!==undefined?rmtNumber||null:null, theme||null, req.userId]
    );
    res.json(safeUser(rows[0]));
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// CHANGE PASSWORD (logged in)
router.put('/change-password', require('../middleware/auth'), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters' });
  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id=$1', [req.userId]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    if (!await bcrypt.compare(currentPassword, rows[0].password)) return res.status(401).json({ error: 'Current password is incorrect' });
    await pool.query('UPDATE users SET password=$1, updated_at=NOW() WHERE id=$2', [await bcrypt.hash(newPassword,12), req.userId]);
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// FORGOT PASSWORD - send OTP
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const e = email.toLowerCase().trim();
  try {
    const { rows } = await pool.query("SELECT id, full_name FROM users WHERE email=$1 AND status='active'", [e]);
    if (!rows[0]) return res.json({ ok: true }); // silent - prevent enumeration
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await pool.query("DELETE FROM otp_tokens WHERE email=$1", [e]);
    await pool.query("INSERT INTO otp_tokens (email,token,expires_at) VALUES ($1,$2,NOW()+INTERVAL '15 minutes')", [e, otp]);
    await sendEmail({ to: e, subject: 'Kinevie Lite: Your Password Reset OTP',
      html: B(`<h2 style="color:#3d2e1a;margin-top:0;">Password Reset OTP</h2><p>Hi ${rows[0].full_name},</p><p>Your one-time password (OTP) to reset your Kinevie Lite password:</p><div style="text-align:center;margin:24px 0;"><div style="display:inline-block;background:#7a6248;color:#fdf5e8;font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 32px;border-radius:12px;font-family:monospace;">${otp}</div></div><p style="color:#8a7055;font-size:12px;">Expires in 15 minutes. If you didn't request this, ignore this email.</p>`)
    });
    res.json({ ok: true });
  } catch(err) { console.error(err); res.status(500).json({ error: 'Server error' }); }
});

// VERIFY OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });
  try {
    const { rows } = await pool.query("SELECT id FROM otp_tokens WHERE email=$1 AND token=$2 AND used=FALSE AND expires_at>NOW()", [email.toLowerCase().trim(), otp]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email||!otp||!newPassword||newPassword.length<8) return res.status(400).json({ error: 'All fields required. Password min 8 chars.' });
  const e = email.toLowerCase().trim();
  try {
    const { rows } = await pool.query("SELECT id FROM otp_tokens WHERE email=$1 AND token=$2 AND used=FALSE AND expires_at>NOW()", [e, otp]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired OTP.' });
    await pool.query("UPDATE users SET password=$1, login_attempts=0, status=CASE WHEN status='disabled' THEN 'active' ELSE status END, locked_until=NULL, updated_at=NOW() WHERE email=$2", [await bcrypt.hash(newPassword,12), e]);
    await pool.query("UPDATE otp_tokens SET used=TRUE WHERE id=$1", [rows[0].id]);
    await sendEmail({ to: e, subject: 'Kinevie Lite: Password Reset Successful',
      html: B(`<h2 style="color:#16a34a;margin-top:0;">✓ Password Reset Successful</h2><p>Your password has been successfully updated.</p><p>You can now log in with your new password.</p><p style="color:#8a7055;font-size:12px;">If you did not make this change, contact your administrator immediately.</p>`)
    });
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// ADMIN: GET all users
router.get('/users', require('../middleware/auth'), async (req, res) => {
  if (req.userRole !== 'administrator') return res.status(403).json({ error: 'Admin only' });
  try {
    const { rows } = await pool.query('SELECT id,email,full_name,rmt_number,role,status,login_attempts,created_at FROM users ORDER BY created_at DESC');
    res.json(rows.map(u => ({ id:u.id, email:u.email, fullName:u.full_name, rmtNumber:u.rmt_number, role:u.role, status:u.status, loginAttempts:u.login_attempts, createdAt:u.created_at })));
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// ADMIN: Update user status
router.put('/users/:id/status', require('../middleware/auth'), async (req, res) => {
  if (req.userRole !== 'administrator') return res.status(403).json({ error: 'Admin only' });
  const { status } = req.body;
  if (!['active','disabled','rejected'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  try {
    const { rows } = await pool.query(
      "UPDATE users SET status=$1, login_attempts=CASE WHEN $1='active' THEN 0 ELSE login_attempts END, locked_until=CASE WHEN $1='active' THEN NULL ELSE locked_until END, updated_at=NOW() WHERE id=$2 RETURNING email,full_name,status",
      [status, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const u = rows[0];
    const msgs = {
      active: { subject:'Kinevie Lite: Account Approved ✓', html:B(`<h2 style="color:#16a34a;margin-top:0;">🎉 Account Approved!</h2><p>Hi ${u.full_name},</p><p>Your Kinevie Lite account has been <strong>approved</strong>. You can now log in.</p>`) },
      rejected: { subject:'Kinevie Lite: Registration Update', html:B(`<h2 style="color:#dc2626;margin-top:0;">Registration Not Approved</h2><p>Hi ${u.full_name},</p><p>Unfortunately your registration was not approved. Please contact your administrator.</p>`) },
      disabled: { subject:'Kinevie Lite: Account Disabled', html:B(`<h2 style="color:#f59e0b;margin-top:0;">Account Disabled</h2><p>Hi ${u.full_name},</p><p>Your account has been disabled by an administrator.</p>`) },
    };
    await sendEmail({ to: u.email, ...msgs[status] });
    res.json({ ok: true, status });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// ADMIN: Edit user
router.put('/users/:id', require('../middleware/auth'), async (req, res) => {
  if (req.userRole !== 'administrator') return res.status(403).json({ error: 'Admin only' });
  const { fullName, rmtNumber, role } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE users SET full_name=COALESCE($1,full_name), rmt_number=COALESCE($2,rmt_number), role=COALESCE($3,role), updated_at=NOW() WHERE id=$4 RETURNING id,email,full_name,rmt_number,role,status`,
      [fullName||null, rmtNumber||null, role||null, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true, user: safeUser(rows[0]) });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

// ADMIN: Delete user
router.delete('/users/:id', require('../middleware/auth'), async (req, res) => {
  if (req.userRole !== 'administrator') return res.status(403).json({ error: 'Admin only' });
  if (req.params.id === req.userId) return res.status(400).json({ error: 'Cannot delete your own account' });
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch(err) { res.status(500).json({ error: 'Server error' }); }
});

module.exports = router;
