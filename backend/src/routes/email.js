const express = require('express');
const nodemailer = require('nodemailer');
const auth = require('../middleware/auth');
const { pool } = require('../db');

const router = express.Router();
router.use(auth);

// ─── Build transporter from user's saved SMTP settings ───────────────────────
function buildTransporter(smtp) {
  // Railway blocks outbound port 587 — force port 465 (SSL) for Gmail
  const isGmail = (smtp.host || '').includes('gmail.com');
  const port = isGmail ? 465 : (smtp.port || 587);
  const secure = isGmail ? true : (smtp.secure || false);

  return nodemailer.createTransport({
    host: smtp.host || 'smtp.gmail.com',
    port,
    secure,
    auth: {
      user: smtp.username,
      pass: smtp.password,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

// ─── Build the invoice HTML (self-contained, for PDF embedding) ───────────────
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

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    body { font-family: Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px 48px; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .company-name { font-size: 22px; font-weight: 700; color: #3b1f0e; margin-bottom: 4px; }
    .inv-number { font-size: 20px; font-weight: 700; font-family: monospace; color: #3b1f0e; }
    .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 4px; }
    .bill-section { display: flex; justify-content: space-between; margin-bottom: 28px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; border-bottom: 2px solid #3b1f0e; background: #f8fafc; }
    .totals { display: flex; justify-content: flex-end; margin-top: 16px; }
    .totals-box { min-width: 260px; }
    .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
    .total-grand { display: flex; justify-content: space-between; padding: 10px 0 0; font-size: 17px; font-weight: 700; border-top: 2px solid #3b1f0e; margin-top: 6px; }
    .bank-box { margin-top: 24px; padding: 14px 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #c9a96e; }
    .footer { text-align: center; margin-top: 24px; font-size: 13px; color: #94a3b8; font-style: italic; }
    .period-note { margin-top: 12px; font-size: 13px; color: #64748b; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company-name">${company.name || 'Kinevie Therapeutics Inc.'}</div>
      <div style="font-size:12px;color:#64748b;">${company.address || ''}</div>
      ${company.email ? `<div style="font-size:12px;color:#64748b;">${company.email}</div>` : ''}
      ${company.hstNumber ? `<div style="font-size:12px;color:#64748b;">HST: ${company.hstNumber}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div class="label">Invoice #</div>
      <div class="inv-number">${invoice.invoiceNumber}</div>
    </div>
  </div>

  <div class="bill-section">
    <div>
      <div class="label">Bill To</div>
      <div style="font-weight:700;font-size:15px;">${invoice.clinicName}</div>
      ${clinicData?.address ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${clinicData.address}</div>` : ''}
      ${clinicData?.contact ? `<div style="font-size:12px;color:#64748b;">${clinicData.contact}</div>` : ''}
      ${clinicData?.email ? `<div style="font-size:12px;color:#64748b;">${clinicData.email}</div>` : ''}
    </div>
    <div style="text-align:right;">
      <div style="margin-bottom:10px;">
        <div class="label">Invoice Date</div>
        <div style="font-weight:600;">${fmtDate(invoice.date)}</div>
      </div>
      <div>
        <div class="label">Due Date</div>
        <div style="font-weight:600;color:#c9a96e;">${fmtDate(invoice.dueDate)}</div>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:60px;text-align:center;">Qty</th>
        <th>Description</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Line Total</th>
      </tr>
    </thead>
    <tbody>${lineRows}</tbody>
  </table>

  <div class="totals">
    <div class="totals-box">
      <div class="total-row"><span>Subtotal</span><span style="font-weight:600;">${fmt(invoice.subtotal)}</span></div>
      <div class="total-row"><span>HST (${invoice.taxRate}%)</span><span>${fmt(invoice.tax)}</span></div>
      <div class="total-grand"><span>Total Due</span><span style="color:#3b1f0e;">${fmt(invoice.total)}</span></div>
    </div>
  </div>

  <div class="period-note">
    <strong>Invoice Period:</strong> ${fmtDate(invoice.periodFrom)} &mdash; ${fmtDate(invoice.periodTo)}
  </div>

  <div class="bank-box">
    <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Payment Details</div>
    <div style="font-size:13px;font-weight:600;">${company.bankName || 'Royal Bank of Canada'}</div>
    <div style="font-size:12px;color:#64748b;margin-top:2px;">${company.bankDetails || ''}</div>
  </div>

  <div class="footer">Thank you for your business!</div>
</body>
</html>`;
}

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { invoiceId, to, subject, message, invoice, clinicData, company } = req.body;

  if (!to || !invoice) {
    return res.status(400).json({ error: 'Missing required fields: to, invoice' });
  }

  // Load SMTP settings from DB
  let smtpSettings;
  try {
    const { rows } = await pool.query('SELECT smtp FROM settings WHERE user_id = $1', [req.userId]);
    smtpSettings = rows[0]?.smtp || {};
  } catch (err) {
    return res.status(500).json({ error: 'Failed to load SMTP settings' });
  }

  if (!smtpSettings.username || !smtpSettings.password) {
    return res.status(400).json({ 
      error: 'Email not configured. Please set up your Gmail credentials in Admin Settings → Email / SMTP first.' 
    });
  }

  // Build invoice HTML for PDF attachment
  const invoiceHTML = buildInvoiceHTML(invoice, clinicData, company || {});

  try {
    const transporter = buildTransporter(smtpSettings);

    // Verify connection before sending
    await transporter.verify();

    const fromName = smtpSettings.fromName || 'Kinevie Therapeutics Inc.';
    const fromEmail = smtpSettings.fromEmail || smtpSettings.username;

    await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: to,
      subject: subject || `Invoice ${invoice.invoiceNumber} – ${invoice.clinicName}`,
      text: message,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#3b1f0e;padding:24px 32px;border-radius:8px 8px 0 0;">
            <h1 style="color:#c9a96e;margin:0;font-size:22px;">Kinevie</h1>
            <p style="color:rgba(245,237,224,0.7);margin:4px 0 0;font-size:12px;letter-spacing:1px;">SMART PRACTICE MANAGER</p>
          </div>
          <div style="background:#fdf8f2;padding:32px;border:1px solid #e0d4c0;border-top:none;border-radius:0 0 8px 8px;">
            <pre style="font-family:Arial,sans-serif;font-size:14px;color:#2c1a0e;white-space:pre-wrap;margin:0 0 24px;">${message}</pre>
            <div style="background:#f0e8d8;border-radius:8px;padding:16px;margin-top:16px;">
              <p style="margin:0;font-size:12px;color:#7a6247;">📎 Invoice PDF is attached to this email.</p>
            </div>
          </div>
          <p style="text-align:center;font-size:11px;color:#94a3b8;margin-top:16px;">Sent via Kinevie Smart Practice Manager · Developed by Crossbolt Technologies Inc.</p>
        </div>`,
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.html`,
          content: invoiceHTML,
          contentType: 'text/html',
        },
      ],
    });

    res.json({ ok: true, message: 'Email sent successfully' });
  } catch (err) {
    console.error('Email send error:', err);

    // Give a helpful error for common Gmail issues
    let errMsg = err.message;
    if (err.code === 'EAUTH' || errMsg.includes('535') || errMsg.includes('Username and Password')) {
      errMsg = 'Gmail authentication failed. Make sure you are using an App Password (not your regular Gmail password). See setup instructions in Admin Settings.';
    } else if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      errMsg = 'Could not connect to Gmail SMTP. Check your host/port settings.';
    }

    res.status(500).json({ error: errMsg });
  }
});

// POST /api/email/test  
router.post('/test', async (req, res) => {
  let smtpSettings;
  try {
    const { rows } = await pool.query('SELECT smtp FROM settings WHERE user_id = $1', [req.userId]);
    smtpSettings = rows[0]?.smtp || {};
  } catch {
    return res.status(500).json({ error: 'Failed to load settings' });
  }

  if (!smtpSettings.username || !smtpSettings.password) {
    return res.status(400).json({ error: 'SMTP credentials not configured' });
  }

  try {
    const transporter = buildTransporter(smtpSettings);
    await transporter.verify();

    // Send test email
    await transporter.sendMail({
      from: `"${smtpSettings.fromName || 'Kinevie'}" <${smtpSettings.fromEmail || smtpSettings.username}>`,
      to: smtpSettings.testEmail || smtpSettings.username,
      subject: 'Kinevie – SMTP Test Email ✓',
      text: 'Your Kinevie email configuration is working correctly!',
      html: '<div style="font-family:Arial;padding:24px;"><h2 style="color:#3b1f0e;">✓ SMTP Connection Working</h2><p>Your Kinevie email configuration is set up correctly.</p><p style="color:#7a6247;font-size:12px;">Sent by Kinevie Smart Practice Manager</p></div>',
    });

    res.json({ ok: true, message: `Test email sent to ${smtpSettings.testEmail || smtpSettings.username}` });
  } catch (err) {
    let errMsg = err.message;
    if (err.code === 'EAUTH' || errMsg.includes('535')) {
      errMsg = 'Authentication failed. Use a Gmail App Password, not your regular password.';
    }
    res.status(500).json({ error: errMsg });
  }
});

module.exports = router;