const express = require('express');
const https = require('https');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const { pool } = require('../db');

const router = express.Router();
router.use(auth);

// ─── Load SMTP settings (falls back to admin if practitioner has none) ────────
async function loadSmtpSettings(userId) {
  // Try current user first
  const { rows } = await pool.query(
    'SELECT smtp, company FROM settings WHERE user_id = $1', [userId]
  );
  let settings = rows[0] || {};
  const smtp = settings.smtp || {};
  const hasConfig = smtp.apiKey || smtp.password;

  // Fall back to admin settings if practitioner has nothing configured
  if (!hasConfig) {
    const { rows: adminRows } = await pool.query(
      `SELECT s.smtp, s.company FROM settings s
       INNER JOIN users u ON u.id = s.user_id
       WHERE u.role = 'administrator'
         AND (s.smtp->>'apiKey' IS NOT NULL OR s.smtp->>'password' IS NOT NULL)
       LIMIT 1`
    );
    if (adminRows[0]) settings = adminRows[0];
  }
  return settings;
}

// ─── Detect which sending method to use ──────────────────────────────────────
function detectSendMethod(smtp) {
  // Resend API key always starts with re_
  if (smtp.apiKey && smtp.apiKey.startsWith('re_')) return 'resend';
  // Gmail / SMTP: has host and password (App Password)
  if (smtp.host && smtp.password) return 'smtp';
  // Legacy: password field used as Resend key
  if (smtp.password && smtp.password.startsWith('re_')) return 'resend';
  return null;
}

// ─── Send via Resend HTTP API ─────────────────────────────────────────────────
function sendViaResend(apiKey, { from, to, subject, html, text, attachments }) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ from, to: [to], subject, html, text, attachments });
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
          else reject(new Error(parsed.message || parsed.name || `Resend error ${res.statusCode}: ${data}`));
        } catch {
          reject(new Error(`Invalid response from Resend: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Request timeout')); });
    req.write(body);
    req.end();
  });
}

// ─── Send via Nodemailer SMTP (Gmail App Password etc.) ───────────────────────
async function sendViaSMTP(smtp, { from, to, subject, html, text, attachments }) {
  const transporter = nodemailer.createTransport({
    host: smtp.host || 'smtp.gmail.com',
    port: parseInt(smtp.port) || 587,
    secure: smtp.port == 465,
    auth: {
      user: smtp.username,
      pass: smtp.password, // App Password (16 chars, no spaces)
    },
    tls: { rejectUnauthorized: false },
  });

  await transporter.verify();

  const mailAttachments = (attachments || []).map(a => ({
    filename: a.filename,
    content: Buffer.from(a.content, 'base64'),
    contentType: 'text/html',
  }));

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
    attachments: mailAttachments,
  });
}

// ─── Unified send function ────────────────────────────────────────────────────
async function sendEmail(smtp, payload) {
  const method = detectSendMethod(smtp);
  const fromEmail = smtp.fromEmail || smtp.username || 'onboarding@resend.dev';
  const fromName  = smtp.fromName  || 'Kinevie Lite';
  const from = `${fromName} <${fromEmail}>`;

  if (method === 'resend') {
    const apiKey = smtp.apiKey || smtp.password;
    await sendViaResend(apiKey, { from, ...payload });
  } else if (method === 'smtp') {
    await sendViaSMTP(smtp, { from, ...payload });
  } else {
    throw new Error('No valid email configuration found. Please configure either a Resend API key or Gmail SMTP credentials in Admin Settings.');
  }
}

// ─── Build Invoice HTML ───────────────────────────────────────────────────────
function buildInvoiceHTML(invoice, clinicData, company) {
  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;
  const fmtDate = (d) => {
    if (!d) return '';
    const [y, m, day] = d.toString().split('T')[0].split('-');
    return `${m}/${day}/${y}`;
  };
  const lineRows = (invoice.lineItems || []).map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${fmt(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${fmt(item.total)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
<style>
  body{font-family:Arial,sans-serif;color:#1e293b;margin:0;padding:40px 48px;font-size:13px;}
  .company-name{font-size:22px;font-weight:700;color:#3b1f0e;margin-bottom:4px;}
  .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;}
  table{width:100%;border-collapse:collapse;}
  th{padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;color:#64748b;font-weight:600;border-bottom:2px solid #3b1f0e;background:#f8fafc;}
  .total-row{display:flex;justify-content:space-between;padding:5px 0;font-size:14px;}
  .total-grand{display:flex;justify-content:space-between;padding:10px 0 0;font-size:17px;font-weight:700;border-top:2px solid #3b1f0e;margin-top:6px;}
  .bank-box{margin-top:24px;padding:14px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #c9a96e;}
</style>
</head><body>
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
    <div>
      <div class="company-name">${company.name || 'Kinevie Therapeutics Inc.'}</div>
      <div style="font-size:12px;color:#64748b;">${company.address || ''}</div>
      ${company.hstNumber ? `<div style="font-size:12px;color:#64748b;">HST: ${company.hstNumber}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div class="label">Invoice #</div>
      <div style="font-size:20px;font-weight:700;font-family:monospace;color:#3b1f0e;">${invoice.invoiceNumber}</div>
    </div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:28px;">
    <div>
      <div class="label">Bill To</div>
      <div style="font-weight:700;font-size:15px;">${invoice.clinicName}</div>
      ${clinicData?.address ? `<div style="font-size:12px;color:#64748b;">${clinicData.address}</div>` : ''}
      ${clinicData?.contact ? `<div style="font-size:12px;color:#64748b;">${clinicData.contact}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="margin-bottom:10px;"><div class="label">Invoice Date</div><div style="font-weight:600;">${fmtDate(invoice.date)}</div></div>
      <div><div class="label">Due Date</div><div style="font-weight:600;color:#c9a96e;">${fmtDate(invoice.dueDate)}</div></div>
    </div>
  </div>
  <table>
    <thead><tr>
      <th style="width:60px;text-align:center;">Qty</th>
      <th>Description</th>
      <th style="text-align:right;">Unit Price</th>
      <th style="text-align:right;">Line Total</th>
    </tr></thead>
    <tbody>${lineRows}</tbody>
  </table>
  <div style="display:flex;justify-content:flex-end;margin-top:16px;">
    <div style="min-width:260px;">
      <div class="total-row"><span>Subtotal</span><span style="font-weight:600;">${fmt(invoice.subtotal)}</span></div>
      <div class="total-row"><span>HST (${invoice.taxRate}%)</span><span>${fmt(invoice.tax)}</span></div>
      <div class="total-grand"><span>Total Due</span><span style="color:#3b1f0e;">${fmt(invoice.total)}</span></div>
    </div>
  </div>
  <div style="margin-top:16px;font-size:13px;color:#64748b;">
    <strong>Invoice Period:</strong> ${fmtDate(invoice.periodFrom)} &mdash; ${fmtDate(invoice.periodTo)}
  </div>
  <div class="bank-box">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Payment Details</div>
    <div style="font-size:13px;font-weight:600;">${company.bankName || ''}</div>
    <div style="font-size:12px;color:#64748b;margin-top:2px;">${company.bankDetails || ''}</div>
  </div>
  <div style="text-align:center;margin-top:24px;font-size:13px;color:#94a3b8;font-style:italic;">Thank you for your business!</div>
</body></html>`;
}

// ─── POST /api/email/send ─────────────────────────────────────────────────────
router.post('/send', async (req, res) => {
  const { to, subject, message, invoice, clinicData, company } = req.body;
  if (!to || !invoice) return res.status(400).json({ error: 'Missing required fields: to, invoice' });

  let settings;
  try {
    settings = await loadSmtpSettings(req.userId);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to load email settings' });
  }

  const smtp = settings.smtp || {};
  const companyInfo = company || settings.company || {};

  if (!detectSendMethod(smtp)) {
    return res.status(400).json({ error: 'Email not configured. Please ask your administrator to set up email in Admin Settings → Email / SMTP.' });
  }

  const invoiceHTML = buildInvoiceHTML(invoice, clinicData, companyInfo);

  try {
    await sendEmail(smtp, {
      to,
      subject: subject || `Invoice ${invoice.invoiceNumber} – ${invoice.clinicName}`,
      text: message,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#3b1f0e;padding:24px 32px;border-radius:8px 8px 0 0;">
          <h1 style="color:#c9a96e;margin:0;font-size:22px;">Kinevie</h1>
          <p style="color:rgba(245,237,224,0.7);margin:4px 0 0;font-size:11px;letter-spacing:1px;">SMART PRACTICE MANAGER</p>
        </div>
        <div style="background:#fdf8f2;padding:32px;border:1px solid #e0d4c0;border-top:none;border-radius:0 0 8px 8px;">
          <pre style="font-family:Arial,sans-serif;font-size:14px;color:#2c1a0e;white-space:pre-wrap;margin:0 0 24px;">${message}</pre>
          <div style="background:#f0e8d8;border-radius:8px;padding:12px 16px;">
            <p style="margin:0;font-size:12px;color:#7a6247;">📎 Invoice ${invoice.invoiceNumber} is attached to this email.</p>
          </div>
        </div>
        <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">Sent via Kinevie Smart Practice Manager · Developed by <a href="https://www.crossbolt.ca" style="color:#c4a882;">Crossbolt Technologies Inc.</a></p>
      </div>`,
      attachments: [{
        filename: `Invoice-${invoice.invoiceNumber}.html`,
        content: Buffer.from(invoiceHTML).toString('base64'),
      }],
    });
    res.json({ ok: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/email/test ─────────────────────────────────────────────────────
router.post('/test', async (req, res) => {
  let settings;
  try {
    settings = await loadSmtpSettings(req.userId);
  } catch {
    return res.status(500).json({ error: 'Failed to load settings' });
  }

  const smtp = settings.smtp || {};
  const method = detectSendMethod(smtp);

  if (!method) {
    return res.status(400).json({ error: 'No email credentials configured. Enter a Resend API key OR Gmail SMTP credentials.' });
  }

  const testTo = smtp.testEmail || smtp.username || smtp.fromEmail;
  if (!testTo) return res.status(400).json({ error: 'Please enter a test email address.' });

  try {
    await sendEmail(smtp, {
      to: testTo,
      subject: 'Kinevie – Email Connection Test ✓',
      text: 'Your Kinevie email configuration is working correctly!',
      html: `<div style="font-family:Arial;padding:24px;max-width:500px;">
        <h2 style="color:#3b1f0e;">✓ Email Working!</h2>
        <p>Your Kinevie email is configured correctly via <strong>${method === 'resend' ? 'Resend API' : 'Gmail SMTP'}</strong>.</p>
        <p style="color:#7a6247;font-size:12px;">Sent by Kinevie Smart Practice Manager</p>
      </div>`,
    });
    res.json({ ok: true, message: `Test email sent to ${testTo} via ${method === 'resend' ? 'Resend API' : 'Gmail SMTP'}` });
  } catch (err) {
    console.error('Test email error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
