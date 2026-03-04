import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { api, emailApi, authApi } from './api/client';
import AuthPage from './pages/AuthPage';


// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Aesthetic: Clean medical professional meets modern fintech
// Color palette: Deep slate + warm amber accents + clean whites

const COLORS = {
  primary: "#8a7258",
  accent: "#c4a882",
  accentLight: "#f5ede0",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  bg: "#f5ede0",
  surface: "#fdf8f2",
  border: "#ddd0b8",
  text: "#3d2e1a",
  textMuted: "#8a7055",
};



// ─── COUNTRIES & CURRENCIES ──────────────────────────────────────────────────
const COUNTRIES = [
  { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'CA$', provinces: ['Alberta','British Columbia','Manitoba','New Brunswick','Newfoundland and Labrador','Northwest Territories','Nova Scotia','Nunavut','Ontario','Prince Edward Island','Quebec','Saskatchewan','Yukon'] },
  { code: 'US', name: 'United States', currency: 'USD', symbol: '$', provinces: ['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming','District of Columbia'] },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', provinces: ['England','Scotland','Wales','Northern Ireland'] },
  { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', provinces: ['Australian Capital Territory','New South Wales','Northern Territory','Queensland','South Australia','Tasmania','Victoria','Western Australia'] },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', provinces: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi'] },
  { code: 'AE', name: 'UAE', currency: 'AED', symbol: 'AED', provinces: ['Abu Dhabi','Ajman','Dubai','Fujairah','Ras Al Khaimah','Sharjah','Umm Al Quwain'] },
];

// ─── THEMES ───────────────────────────────────────────────────────────────────
const THEMES = [
  {
    id: 'warm-beige',
    label: 'Warm Beige',
    preview: ['#7a6248', '#c4a882', '#f5ede0'],
    vars: {
      '--sidebar-bg': '#7a6248',
      '--sidebar-text': '#fdf5e8',
      '--sidebar-accent': '#c4a882',
      '--sidebar-active-bg': 'rgba(196,168,130,0.25)',
      '--sidebar-hover-bg': 'rgba(196,168,130,0.12)',
      '--sidebar-border': 'rgba(196,168,130,0.2)',
      '--primary': '#8a7258',
      '--primary-hover': '#9a8268',
      '--accent': '#c4a882',
      '--accent-hover': '#b09060',
      '--accent-text': '#3d2e1a',
      '--bg': '#f5ede0',
      '--surface': '#fdf8f2',
      '--border': '#ddd0b8',
      '--text': '#3d2e1a',
      '--text-muted': '#8a7055',
      '--table-head-bg': '#f0e4d0',
      '--badge-active-bg': '#ecdec8',
      '--badge-active-text': '#6b5a3e',
      '--nav-label': 'rgba(253,245,232,0.35)',
      '--nav-text': 'rgba(253,245,232,0.65)',
    }
  },
  {
    id: 'slate-blue',
    label: 'Slate Blue',
    preview: ['#1e3a5f', '#4a90d9', '#f0f4f8'],
    vars: {
      '--sidebar-bg': '#1e3a5f',
      '--sidebar-text': '#e8f0fb',
      '--sidebar-accent': '#4a90d9',
      '--sidebar-active-bg': 'rgba(74,144,217,0.22)',
      '--sidebar-hover-bg': 'rgba(74,144,217,0.1)',
      '--sidebar-border': 'rgba(74,144,217,0.2)',
      '--primary': '#1e3a5f',
      '--primary-hover': '#2a4f80',
      '--accent': '#4a90d9',
      '--accent-hover': '#3a7bc8',
      '--accent-text': '#ffffff',
      '--bg': '#f0f4f8',
      '--surface': '#ffffff',
      '--border': '#d0dce8',
      '--text': '#1a2e45',
      '--text-muted': '#5a7a99',
      '--table-head-bg': '#e8f0f8',
      '--badge-active-bg': '#dbeafe',
      '--badge-active-text': '#1d4ed8',
      '--nav-label': 'rgba(232,240,251,0.35)',
      '--nav-text': 'rgba(232,240,251,0.65)',
    }
  },
  {
    id: 'forest-green',
    label: 'Forest Green',
    preview: ['#1a4a2e', '#4caf7d', '#f0f7f2'],
    vars: {
      '--sidebar-bg': '#1a4a2e',
      '--sidebar-text': '#e8f5ee',
      '--sidebar-accent': '#4caf7d',
      '--sidebar-active-bg': 'rgba(76,175,125,0.22)',
      '--sidebar-hover-bg': 'rgba(76,175,125,0.1)',
      '--sidebar-border': 'rgba(76,175,125,0.2)',
      '--primary': '#1a4a2e',
      '--primary-hover': '#245a38',
      '--accent': '#4caf7d',
      '--accent-hover': '#3d9e6a',
      '--accent-text': '#0f2d1e',
      '--bg': '#f0f7f2',
      '--surface': '#f7fbf8',
      '--border': '#c8dfd1',
      '--text': '#0f2d1e',
      '--text-muted': '#4a7a5e',
      '--table-head-bg': '#e0f0e8',
      '--badge-active-bg': '#d4ead9',
      '--badge-active-text': '#1a4a2e',
      '--nav-label': 'rgba(232,245,238,0.35)',
      '--nav-text': 'rgba(232,245,238,0.65)',
    }
  },
  {
    id: 'charcoal',
    label: 'Charcoal',
    preview: ['#2d2d2d', '#e0b84a', '#f5f5f5'],
    vars: {
      '--sidebar-bg': '#2d2d2d',
      '--sidebar-text': '#f0f0f0',
      '--sidebar-accent': '#e0b84a',
      '--sidebar-active-bg': 'rgba(224,184,74,0.2)',
      '--sidebar-hover-bg': 'rgba(224,184,74,0.08)',
      '--sidebar-border': 'rgba(224,184,74,0.15)',
      '--primary': '#2d2d2d',
      '--primary-hover': '#404040',
      '--accent': '#e0b84a',
      '--accent-hover': '#c9a430',
      '--accent-text': '#1a1a1a',
      '--bg': '#f5f5f5',
      '--surface': '#ffffff',
      '--border': '#e0e0e0',
      '--text': '#1a1a1a',
      '--text-muted': '#707070',
      '--table-head-bg': '#eeeeee',
      '--badge-active-bg': '#fef3c7',
      '--badge-active-text': '#92400e',
      '--nav-label': 'rgba(240,240,240,0.35)',
      '--nav-text': 'rgba(240,240,240,0.65)',
    }
  },
  {
    id: 'rose-mauve',
    label: 'Rose Mauve',
    preview: ['#6b3a4a', '#d4849a', '#fdf0f3'],
    vars: {
      '--sidebar-bg': '#6b3a4a',
      '--sidebar-text': '#fdeef2',
      '--sidebar-accent': '#d4849a',
      '--sidebar-active-bg': 'rgba(212,132,154,0.22)',
      '--sidebar-hover-bg': 'rgba(212,132,154,0.1)',
      '--sidebar-border': 'rgba(212,132,154,0.2)',
      '--primary': '#6b3a4a',
      '--primary-hover': '#7d4a5a',
      '--accent': '#d4849a',
      '--accent-hover': '#c07088',
      '--accent-text': '#3d1a24',
      '--bg': '#fdf0f3',
      '--surface': '#fff5f7',
      '--border': '#e8c8d0',
      '--text': '#3d1a24',
      '--text-muted': '#8a5a68',
      '--table-head-bg': '#f5e0e8',
      '--badge-active-bg': '#fce4ec',
      '--badge-active-text': '#6b3a4a',
      '--nav-label': 'rgba(253,238,242,0.35)',
      '--nav-text': 'rgba(253,238,242,0.65)',
    }
  },
  {
    id: 'ocean-teal',
    label: 'Ocean Teal',
    preview: ['#1a4a4a', '#3dbdbd', '#f0fafa'],
    vars: {
      '--sidebar-bg': '#1a4a4a',
      '--sidebar-text': '#e8fafa',
      '--sidebar-accent': '#3dbdbd',
      '--sidebar-active-bg': 'rgba(61,189,189,0.22)',
      '--sidebar-hover-bg': 'rgba(61,189,189,0.1)',
      '--sidebar-border': 'rgba(61,189,189,0.2)',
      '--primary': '#1a4a4a',
      '--primary-hover': '#245a5a',
      '--accent': '#3dbdbd',
      '--accent-hover': '#2ea8a8',
      '--accent-text': '#0f2d2d',
      '--bg': '#f0fafa',
      '--surface': '#f7fdfd',
      '--border': '#c0dede',
      '--text': '#0f2d2d',
      '--text-muted': '#4a7a7a',
      '--table-head-bg': '#e0f5f5',
      '--badge-active-bg': '#ccf2f2',
      '--badge-active-text': '#1a4a4a',
      '--nav-label': 'rgba(232,250,250,0.35)',
      '--nav-text': 'rgba(232,250,250,0.65)',
    }
  },
];

const DEFAULT_THEME_ID = 'warm-beige';

function applyTheme(themeId) {
  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
}

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const INITIAL_CLINICS = [
  {
    id: "c1", name: "FlexCare Rehab",
    address: "1200 Sheppard Ave W, Toronto, ON",
    contact: "Dr. Sarah Chen", phone: "416-555-0101", email: "billing@flexcarerehab.ca",
    billingCycle: "bi-weekly", status: "active",
    rates: [
      { duration: 30, rate: 48.00 }, { duration: 45, rate: 65.00 },
      { duration: 60, rate: 85.00 }, { duration: 90, rate: 115.00 },
    ]
  },
  {
    id: "c2", name: "Eglington Mavis",
    address: "279 Eglinton Ave W, Mississauga, ON",
    contact: "Mike Patel", phone: "905-555-0202", email: "accounts@eglintonmavis.com",
    billingCycle: "semi-monthly", status: "active",
    rates: [
      { duration: 45, rate: 65.00 }, { duration: 60, rate: 85.00 },
      { duration: 90, rate: 115.00 },
    ]
  },
  {
    id: "c3", name: "All About Physio",
    address: "850 Brant St, Burlington, ON",
    contact: "Jessica Wong", phone: "905-555-0303", email: "invoices@allaboutphysio.ca",
    billingCycle: "monthly", status: "active",
    rates: [
      { duration: 45, rate: 68.00 }, { duration: 60, rate: 88.00 },
      { duration: 90, rate: 118.00 },
    ]
  },
  {
    id: "c4", name: "Massage Osteo Experts",
    address: "279 Lakeshore Rd E, Mississauga, ON, Canada",
    contact: "Dr. Lee", phone: "905-555-0404", email: "billing@massageosteo.ca",
    billingCycle: "semi-monthly", status: "active",
    rates: [
      { duration: 50, rate: 69.00 }, { duration: 65, rate: 85.00 },
      { duration: 80, rate: 103.67 }, { duration: 100, rate: 138.22 },
    ]
  },
  {
    id: "c5", name: "Interlink",
    address: "500 King St W, Hamilton, ON",
    contact: "Tom Rao", phone: "905-555-0505", email: "finance@interlinkhc.ca",
    billingCycle: "bi-weekly", status: "active",
    rates: [
      { duration: 60, rate: 80.00 }, { duration: 90, rate: 108.00 },
    ]
  },
];

const SESSION_TYPES = ["RMT", "RMT + Cupping", "RMT + Osteo", "Others"];

const EXPENSE_CATEGORIES = [
  "Supplies", "Rent", "Gas", "Telephone", "Internet", "Miscellaneous", "Admin", "Others"
];

// Pre-seeded sessions from CSV data
const INITIAL_SESSIONS = [
  { id: "s1", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-14", startTime: "13:00", duration: 60, sessionType: "RMT", clientInitial: "Sk", notes: "" },
  { id: "s2", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-14", startTime: "11:00", duration: 60, sessionType: "RMT", clientInitial: "J", notes: "" },
  { id: "s3", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-14", startTime: "12:00", duration: 60, sessionType: "RMT", clientInitial: "JE", notes: "" },
  { id: "s4", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-20", startTime: "15:30", duration: 60, sessionType: "RMT", clientInitial: "A", notes: "" },
  { id: "s5", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-20", startTime: "14:30", duration: 60, sessionType: "RMT", clientInitial: "H", notes: "" },
  { id: "s6", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-21", startTime: "14:00", duration: 60, sessionType: "RMT", clientInitial: "N", notes: "" },
  { id: "s7", clinicId: "c1", clinicName: "FlexCare Rehab", date: "2025-11-21", startTime: "16:00", duration: 30, sessionType: "RMT", clientInitial: "A", notes: "" },
  { id: "s8", clinicId: "c2", clinicName: "Eglington Mavis", date: "2025-11-15", startTime: "11:00", duration: 60, sessionType: "RMT", clientInitial: "A", notes: "" },
  { id: "s9", clinicId: "c2", clinicName: "Eglington Mavis", date: "2025-11-15", startTime: "10:00", duration: 60, sessionType: "RMT", clientInitial: "S", notes: "" },
  { id: "s10", clinicId: "c2", clinicName: "Eglington Mavis", date: "2025-11-22", startTime: "14:00", duration: 60, sessionType: "RMT", clientInitial: "I", notes: "" },
  { id: "s11", clinicId: "c2", clinicName: "Eglington Mavis", date: "2025-11-22", startTime: "10:30", duration: 90, sessionType: "RMT", clientInitial: "J", notes: "" },
  { id: "s12", clinicId: "c2", clinicName: "Eglington Mavis", date: "2025-11-22", startTime: "19:30", duration: 45, sessionType: "RMT", clientInitial: "R", notes: "" },
  { id: "s13", clinicId: "c3", clinicName: "All About Physio", date: "2025-11-23", startTime: "09:00", duration: 45, sessionType: "RMT", clientInitial: "MT", notes: "" },
  { id: "s14", clinicId: "c3", clinicName: "All About Physio", date: "2025-11-24", startTime: "10:00", duration: 90, sessionType: "RMT", clientInitial: "P", notes: "" },
  { id: "s15", clinicId: "c3", clinicName: "All About Physio", date: "2025-11-23", startTime: "11:00", duration: 45, sessionType: "RMT", clientInitial: "R", notes: "" },
  { id: "s16", clinicId: "c5", clinicName: "Interlink", date: "2025-11-19", startTime: "15:00", duration: 60, sessionType: "RMT", clientInitial: "H", notes: "" },
  { id: "s17", clinicId: "c5", clinicName: "Interlink", date: "2025-11-26", startTime: "15:00", duration: 60, sessionType: "RMT", clientInitial: "H", notes: "" },
  { id: "s18", clinicId: "c4", clinicName: "Massage Osteo Experts", date: "2026-02-03", startTime: "10:00", duration: 65, sessionType: "RMT", clientInitial: "AB", notes: "" },
  { id: "s19", clinicId: "c4", clinicName: "Massage Osteo Experts", date: "2026-02-07", startTime: "11:00", duration: 65, sessionType: "RMT", clientInitial: "CD", notes: "" },
  { id: "s20", clinicId: "c4", clinicName: "Massage Osteo Experts", date: "2026-02-10", startTime: "14:00", duration: 50, sessionType: "RMT", clientInitial: "EF", notes: "" },
  { id: "s21", clinicId: "c4", clinicName: "Massage Osteo Experts", date: "2026-02-13", startTime: "16:00", duration: 50, sessionType: "RMT", clientInitial: "GH", notes: "" },
];

const INITIAL_INVOICES = [
  {
    id: "inv1", clinicId: "c4", clinicName: "Massage Osteo Experts",
    invoiceNumber: "2026021505", date: "2026-02-15", dueDate: "2026-02-20",
    periodFrom: "2026-02-01", periodTo: "2026-02-15",
    lineItems: [
      { description: "RMT - Massage Sessions 65min", qty: 2, unitPrice: 85.00, total: 170.00 },
      { description: "RMT - Massage Sessions 50min", qty: 2, unitPrice: 69.00, total: 138.00 },
    ],
    subtotal: 308.00, tax: 40.04, taxRate: 13, total: 348.04,
    status: "unpaid", emailSent: null,
  },
  {
    id: "inv2", clinicId: "c1", clinicName: "FlexCare Rehab",
    invoiceNumber: "2025120101", date: "2025-12-01", dueDate: "2025-12-04",
    periodFrom: "2025-11-14", periodTo: "2025-11-30",
    lineItems: [
      { description: "RMT - Massage Sessions 60min", qty: 6, unitPrice: 85.00, total: 510.00 },
      { description: "RMT - Massage Sessions 30min", qty: 1, unitPrice: 48.00, total: 48.00 },
    ],
    subtotal: 558.00, tax: 72.54, taxRate: 13, total: 630.54,
    status: "paid", emailSent: "2025-12-01T10:30:00Z",
  },
];

const INITIAL_EXPENSES = [
  { id: "e1", date: "2026-01-15", category: "Supplies", amount: 85.50, notes: "Massage oil, linens" },
  { id: "e2", date: "2026-01-20", category: "Gas", amount: 120.00, notes: "Travel to clinics" },
  { id: "e3", date: "2026-02-01", category: "Internet", amount: 65.00, notes: "Monthly internet" },
  { id: "e4", date: "2026-02-05", category: "Admin", amount: 45.00, notes: "Accounting software" },
];

// ─── UTILITY FUNCTIONS ────────────────────────────────────────────────────────
const addWorkingDays = (dateStr, days) => {
  const date = new Date(dateStr);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return date.toISOString().split("T")[0];
};

const formatCurrency = (n, currency) => {
  const num = parseFloat(n || 0).toFixed(2);
  const country = COUNTRIES.find(c => c.currency === currency);
  const sym = country ? country.symbol : '$';
  return `${sym}${num}`;
};

const formatDate = (d) => {
  if (!d) return "";
  const [y, m, day] = d.split("-");
  return `${m}/${day}/${y}`;
};

const genId = () => Math.random().toString(36).substr(2, 9);

const genInvoiceNumber = (date, seq) => {
  const d = date.replace(/-/g, "");
  return `${d}${String(seq).padStart(2, "0")}`;
};

// PDF download via browser print
const downloadInvoicePDF = (invoice, clinics) => {
  const clinic = clinics.find(c => c.id === invoice.clinicId) || {};
  const companyInfo = {
    name: "Kinevie Therapeutics Inc.",
    address: "224 Otterbein Road Kitchener ON N2B 0A8",
    bank: "Royal Bank of Canada",
    bankDetails: "Kinevie Therapeutics Inc. | Transit Number: 00482 | Institution Number: 003 | Account Number: 1023696",
  };

  const lineRowsHTML = invoice.lineItems.map(item => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${item.qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${item.description}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatCurrency(item.unitPrice)}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;">${formatCurrency(item.total)}</td>
    </tr>`).join("");

  const html = `
    <div style="font-family:'DM Sans',Arial,sans-serif;color:#1e293b;padding:0;max-width:760px;margin:0 auto;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;">
        <div>
          <div style="font-size:24px;font-weight:700;color:#1a2942;margin-bottom:4px;">${companyInfo.name}</div>
          <div style="font-size:12px;color:#64748b;">${companyInfo.address}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Invoice #</div>
          <div style="font-size:20px;font-weight:700;font-family:monospace;color:#1a2942;">${invoice.invoiceNumber}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-bottom:28px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:6px;">Bill To</div>
          <div style="font-weight:700;font-size:15px;">${invoice.clinicName}</div>
          <div style="font-size:12px;color:#64748b;margin-top:2px;">${clinic.address || ""}</div>
          ${clinic.contact ? `<div style="font-size:12px;color:#64748b;">${clinic.contact}</div>` : ""}
        </div>
        <div style="text-align:right;">
          <div style="margin-bottom:8px;">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Date</div>
            <div style="font-weight:600;">${formatDate(invoice.date)}</div>
          </div>
          <div>
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;">Due Date</div>
            <div style="font-weight:600;color:#e8a045;">${formatDate(invoice.dueDate)}</div>
          </div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1.5px solid #1a2942;width:60px;">Qty</th>
            <th style="padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1.5px solid #1a2942;">Description</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1.5px solid #1a2942;">Unit Price</th>
            <th style="padding:10px 12px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:0.8px;color:#64748b;font-weight:600;border-bottom:1.5px solid #1a2942;">Line Total</th>
          </tr>
        </thead>
        <tbody>${lineRowsHTML}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px;">
        <div style="min-width:260px;">
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
            <span>Subtotal</span><span style="font-weight:600;">${formatCurrency(invoice.subtotal)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
            <span>Sales Tax (${invoice.taxRate}%)</span><span>${formatCurrency(invoice.tax)}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:10px 0 0;font-size:17px;font-weight:700;border-top:1.5px solid #1a2942;margin-top:6px;">
            <span>Total</span><span style="color:#1a2942;">${formatCurrency(invoice.total)}</span>
          </div>
        </div>
      </div>

      <div style="margin-top:20px;font-size:13px;color:#64748b;">
        <span style="font-weight:600;">Invoice Period:</span> ${formatDate(invoice.periodFrom)} &mdash; ${formatDate(invoice.periodTo)}
      </div>

      <div style="margin-top:20px;padding:14px 16px;background:#f8fafc;border-radius:8px;border-left:3px solid #e8a045;">
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;margin-bottom:4px;">Bank Account Details</div>
        <div style="font-size:13px;font-weight:600;">${companyInfo.bank}</div>
        <div style="font-size:12px;color:#64748b;margin-top:2px;">${companyInfo.bankDetails}</div>
      </div>

      <div style="text-align:center;margin-top:24px;font-size:13px;color:#94a3b8;font-style:italic;">
        Thank you for your business!
      </div>
    </div>`;

  const el = document.getElementById("print-invoice-area");
  if (el) {
    el.innerHTML = html;
    // Set document title for filename
    const origTitle = document.title;
    document.title = `Invoice_${invoice.invoiceNumber}_${invoice.clinicName.replace(/\s+/g, "_")}`;
    window.print();
    document.title = origTitle;
    setTimeout(() => { el.innerHTML = ""; }, 500);
  }
};

// Parse CSV text
const parseCSV = (text) => {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
  return lines.slice(1).map(line => {
    const values = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, i) => obj[h] = values[i] || "");
    return obj;
  });
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@300;400;500;600;700&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); }
  
  .app { display: flex; height: 100vh; overflow: hidden; }
  
  .sidebar {
    width: 240px; background: var(--sidebar-bg); color: var(--sidebar-text);
    display: flex; flex-direction: column;
    flex-shrink: 0;
  }
  
  .sidebar-logo {
    padding: 24px 20px; border-bottom: 1px solid var(--sidebar-border);
  }
  
  .sidebar-logo h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 22px; color: white; line-height: 1.1;
  }
  
  .sidebar-logo span {
    font-size: 11px; color: var(--sidebar-accent); letter-spacing: 2px; text-transform: uppercase;
    font-family: 'DM Sans', sans-serif; font-weight: 600;
  }
  
  .sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
  
  .nav-section-label {
    font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--nav-label); padding: 16px 8px 6px;
  }
  
  .nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: 8px; cursor: pointer;
    color: var(--nav-text); font-size: 14px; font-weight: 500;
    transition: all 0.15s; margin-bottom: 2px;
  }
  
  .nav-item:hover { background: rgba(196,168,130,0.15); color: #fdf5e8; }
  .nav-item.active { background: var(--sidebar-active-bg); color: var(--sidebar-accent); }
  .nav-item svg { width: 18px; height: 18px; flex-shrink: 0; }
  
  .sidebar-footer {
    padding: 16px; border-top: 1px solid var(--sidebar-border);
    font-size: 13px; color: var(--nav-label);
  }
  
  .main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }
  
  .topbar {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 0 32px; height: 64px; display: flex; align-items: center;
    justify-content: space-between; flex-shrink: 0;
    position: sticky; top: 0; z-index: 10;
  }
  
  .topbar-title { font-size: 18px; font-weight: 700; color: #8a7258; }
  .topbar-sub { font-size: 13px; color: #64748b; margin-top: 1px; }
  
  .topbar-actions { display: flex; align-items: center; gap: 12px; }
  
  .content { padding: 28px 32px; flex: 1; }
  
  .card {
    background: var(--surface); border-radius: 12px; border: 1px solid var(--border);
    overflow: hidden;
  }
  
  .card-header {
    padding: 18px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  
  .card-title { font-size: 15px; font-weight: 700; color: #8a7258; }
  .card-body { padding: 20px; }
  
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  
  .stat-card {
    background: var(--surface); border-radius: 12px; padding: 20px;
    border: 1px solid var(--border);
  }
  
  .stat-label { font-size: 12px; color: #8a7055; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; }
  .stat-value { font-size: 28px; font-weight: 700; color: #3b1f0e; margin: 6px 0 2px; font-family: 'DM Serif Display', serif; }
  .stat-sub { font-size: 12px; color: #64748b; }
  .stat-accent { color: #c4a882; }
  
  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 16px; border-radius: 8px; font-size: 13px;
    font-weight: 600; cursor: pointer; border: none; font-family: inherit;
    transition: all 0.15s;
  }
  
  .btn svg { width: 15px; height: 15px; }
  
  .btn-primary { background: #3b1f0e; color: #fdf5e8; }
  .btn-primary:hover { background: var(--primary-hover); }
  .btn-accent { background: var(--accent); color: var(--accent-text); }
  .btn-accent:hover { background: var(--accent-hover); }
  .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
  .btn-ghost:hover { background: #f8fafc; color: #1e293b; }
  .btn-danger { background: #fee2e2; color: #ef4444; }
  .btn-danger:hover { background: #fecaca; }
  .btn-success { background: #dcfce7; color: #16a34a; }
  .btn-sm { padding: 6px 10px; font-size: 12px; }
  
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #8a7055; font-weight: 600; padding: 12px 16px; text-align: left; background: #f0e8d8; border-bottom: 1px solid #e0d4c0; }
  td { padding: 12px 16px; font-size: 14px; border-bottom: 1px solid #d4ead9; color: #8a7258; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg); }
  
  .badge {
    display: inline-flex; align-items: center; padding: 3px 10px;
    border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
  }
  
  .badge-paid { background: #dcfce7; color: #15803d; }
  .badge-unpaid { background: #fef3c7; color: #92400e; }
  .badge-active { background: #e8dcc8; color: #8a7258; }
  .badge-inactive { background: #f1f5f9; color: #64748b; }
  
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 6px; }
  
  .form-input, .form-select, .form-textarea {
    width: 100%; padding: 9px 12px; border: 1.5px solid #e2e8f0;
    border-radius: 8px; font-size: 14px; font-family: inherit;
    color: #1e293b; background: white; outline: none;
    transition: border-color 0.15s;
  }
  
  .form-input:focus, .form-select:focus, .form-textarea:focus {
    border-color: #e8a045;
    box-shadow: 0 0 0 3px rgba(232,160,69,0.1);
  }
  
  .form-textarea { resize: vertical; min-height: 80px; }
  
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .form-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; z-index: 100;
    padding: 20px;
  }
  
  .modal {
    background: white; border-radius: 16px; width: 100%; max-width: 640px;
    max-height: 90vh; overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  
  .modal-lg { max-width: 820px; }
  
  .modal-header {
    padding: 20px 24px; border-bottom: 1px solid #e2e8f0;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; background: white; z-index: 1;
  }
  
  .modal-title { font-size: 17px; font-weight: 700; color: #1a2942; }
  .modal-body { padding: 24px; }
  .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end; }
  
  .close-btn { background: none; border: none; cursor: pointer; color: #64748b; padding: 4px; }
  .close-btn:hover { color: #1e293b; }
  
  .tabs { display: flex; gap: 4px; padding: 4px; background: #f1f5f9; border-radius: 10px; margin-bottom: 24px; }
  .tab { flex: 1; padding: 8px 14px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; color: #64748b; border: none; background: none; font-family: inherit; }
  .tab.active { background: white; color: #1a2942; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  
  .filter-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
  
  .empty-state { text-align: center; padding: 60px 20px; color: #94a3b8; }
  .empty-state svg { width: 48px; height: 48px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 15px; font-weight: 500; }
  .empty-state small { font-size: 13px; display: block; margin-top: 4px; }
  
  .invoice-preview { font-family: 'DM Sans', sans-serif; }
  .invoice-header-block { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .invoice-co-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1a2942; }
  .invoice-line { font-size: 13px; color: #64748b; margin-top: 2px; }
  .invoice-to { margin-bottom: 24px; }
  .invoice-to strong { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; }
  .invoice-table th { font-size: 12px; }
  .invoice-totals { margin-top: 16px; display: flex; justify-content: flex-end; }
  .invoice-totals-inner { min-width: 240px; }
  .invoice-total-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }
  .invoice-total-row.grand { font-weight: 700; font-size: 16px; border-top: 1.5px solid #1a2942; margin-top: 6px; padding-top: 10px; }
  .invoice-bank { margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 3px solid #e8a045; }
  .invoice-footer { text-align: center; margin-top: 20px; color: #64748b; font-size: 13px; }
  
  .chart-bar { display: flex; align-items: flex-end; gap: 8px; height: 120px; margin: 16px 0; }
  .chart-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .chart-bar-inner { width: 100%; background: #1a2942; border-radius: 4px 4px 0 0; transition: height 0.3s; position: relative; }
  .chart-bar-inner:hover { background: #e8a045; }
  .chart-label { font-size: 10px; color: #64748b; text-align: center; }
  .chart-value { font-size: 10px; color: #1a2942; font-weight: 600; }
  
  .donut-ring { position: relative; display: inline-block; }
  
  .alert { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 16px; }
  .alert-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
  .alert-info { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
  .alert-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
  
  .pagination { display: flex; gap: 4px; align-items: center; margin-top: 16px; justify-content: flex-end; }
  .page-btn { padding: 6px 10px; border: 1px solid #e2e8f0; border-radius: 6px; background: white; cursor: pointer; font-size: 13px; font-weight: 500; color: #64748b; }
  .page-btn.active { background: #3b1f0e; color: #fdf5e8; border-color: #8a7258; }
  .page-btn:hover:not(.active) { background: #f8fafc; }
  
  .rates-table { width: 100%; }
  .rates-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
  .rates-row .form-input { flex: 1; }
  
  .phi-warning { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #991b1b; margin-top: 8px; }
  
  .import-zone { border: 2px dashed #e2e8f0; border-radius: 10px; padding: 32px; text-align: center; cursor: pointer; }
  .import-zone:hover { border-color: #e8a045; background: #fef3e2; }
  
  .import-preview { max-height: 240px; overflow-y: auto; margin-top: 12px; }
  
  input[type="file"] { display: none; }

  .actions-cell { display: flex; gap: 6px; }

  #print-invoice-area { display: none; }
  @media print {
    body * { visibility: hidden; }
    #print-invoice-area, #print-invoice-area * { visibility: visible; }
    #print-invoice-area {
      display: block !important; position: fixed; inset: 0;
      background: white; padding: 40px 48px;
      font-family: 'DM Sans', sans-serif; color: #1e293b; font-size: 13px; z-index: 99999;
    }
    #print-invoice-area table { width: 100%; border-collapse: collapse; }
    #print-invoice-area th { font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #64748b; font-weight: 600; padding: 10px 12px; text-align: left; border-bottom: 1.5px solid #1a2942; }
    #print-invoice-area td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
  }

  .settings-section { margin-bottom: 32px; }
  .settings-section-title { font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
  .smtp-status-bar { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
  .smtp-status-bar.connected { background: #dcfce7; color: #166534; }
  .smtp-status-bar.disconnected { background: #fef3c7; color: #92400e; }
  .smtp-status-bar.testing { background: #dbeafe; color: #1e40af; }
  .password-wrapper { position: relative; }
  .toggle-password { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0; display: flex; align-items: center; }
  .toggle-password:hover { color: #64748b; }
  .provider-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
  .provider-btn { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 10px 8px; text-align: center; cursor: pointer; font-size: 12px; font-weight: 600; color: #374151; background: white; font-family: inherit; transition: all 0.15s; }
  .provider-btn:hover { border-color: #e8a045; color: #e8a045; }
  .provider-btn.active { border-color: #e8a045; background: #fef3e2; color: #d4911e; }
  .provider-icon { font-size: 18px; display: block; margin-bottom: 4px; }

  .split-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }

  @media (max-width: 768px) {
    .stat-grid { grid-template-columns: repeat(2, 1fr); }
    .form-grid { grid-template-columns: 1fr; }
    .split-layout { grid-template-columns: 1fr; }
  }
`;

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────────
const Icon = ({ name, ...props }) => {
  const icons = {
    dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>,
    clinic: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    sessions: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    invoice: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    expense: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
    import: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="8 17 12 21 16 17"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.88 18.09A5 5 0 0018 9h-1.26A8 8 0 103 16.29"/></svg>,
    plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
    eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    x: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" {...props}><polyline points="20 6 9 17 4 12"/></svg>,
    download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    filter: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    warning: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    pdf: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15h1.5a1.5 1.5 0 000-3H9v6m7-6v6m0-3h-2m5-3v6"/></svg>,
    lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
    server: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    eye2: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  };
  return icons[name] || null;
};

// ─── MODAL WRAPPER ─────────────────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, footer, large }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${large ? " modal-lg" : ""}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="close-btn" onClick={onClose}><Icon name="x" style={{ width: 20, height: 20 }} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
const Dashboard = ({ sessions, invoices, expenses, clinics }) => {
  const [range, setRange] = useState("all");

  const filterDate = (date) => {
    if (range === "all") return true;
    const d = new Date(date);
    const now = new Date();
    if (range === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (range === "30d") {
      return (now - d) / 86400000 <= 30;
    }
    return true;
  };

  const filteredInvoices = invoices.filter(i => filterDate(i.date));
  const filteredSessions = sessions.filter(s => filterDate(s.date));
  const filteredExpenses = expenses.filter(e => filterDate(e.date));

  const totalRevenue = filteredInvoices.reduce((s, i) => s + i.total, 0);
  const paidRevenue = filteredInvoices.filter(i => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const unpaidRevenue = filteredInvoices.filter(i => i.status === "unpaid").reduce((s, i) => s + i.total, 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // Sessions by clinic
  const sessionsByClinic = {};
  filteredSessions.forEach(s => {
    sessionsByClinic[s.clinicName] = (sessionsByClinic[s.clinicName] || 0) + 1;
  });

  // Revenue by clinic
  const revenueByClinic = {};
  filteredInvoices.forEach(inv => {
    revenueByClinic[inv.clinicName] = (revenueByClinic[inv.clinicName] || 0) + inv.total;
  });

  const maxSessions = Math.max(...Object.values(sessionsByClinic), 1);
  const maxRevenue = Math.max(...Object.values(revenueByClinic), 1);

  const clinicColors = ["#1a2942", "#e8a045", "#22c55e", "#3b82f6", "#a855f7", "#ef4444"];

  const totalSessions = filteredSessions.length;
  const clinicNames = Object.keys(sessionsByClinic);

  return (
    <div>
      <div className="filter-row" style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Period:</span>
        {[["all", "All Time"], ["month", "This Month"], ["30d", "Last 30 Days"]].map(([k, label]) => (
          <button key={k} className={`btn btn-ghost btn-sm`} style={range === k ? { background: "#1a2942", color: "white", borderColor: "#1a2942" } : {}} onClick={() => setRange(k)}>{label}</button>
        ))}
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Total Revenue</div>
          <div className="stat-value">{formatCurrency(totalRevenue)}</div>
          <div className="stat-sub">{filteredInvoices.length} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Paid</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{formatCurrency(paidRevenue)}</div>
          <div className="stat-sub">{filteredInvoices.filter(i => i.status === "paid").length} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value stat-accent">{formatCurrency(unpaidRevenue)}</div>
          <div className="stat-sub">{filteredInvoices.filter(i => i.status === "unpaid").length} invoices</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Income</div>
          <div className="stat-value">{formatCurrency(totalRevenue - totalExpenses)}</div>
          <div className="stat-sub">After {formatCurrency(totalExpenses)} expenses</div>
        </div>
      </div>

      <div className="split-layout">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Sessions by Clinic</span>
            <span style={{ fontSize: 13, color: "#64748b" }}>{totalSessions} total</span>
          </div>
          <div className="card-body">
            {clinicNames.length === 0 ? (
              <div className="empty-state"><p>No sessions yet</p></div>
            ) : (
              <>
                <div className="chart-bar">
                  {clinicNames.map((name, i) => {
                    const count = sessionsByClinic[name];
                    const pct = Math.round((count / maxSessions) * 100);
                    return (
                      <div key={name} className="chart-col">
                        <span className="chart-value">{count}</span>
                        <div className="chart-bar-inner" style={{ height: `${Math.max(pct, 8)}%`, background: clinicColors[i % clinicColors.length] }}/>
                        <span className="chart-label" style={{ fontSize: 9, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}>
                  {clinicNames.map((name, i) => {
                    const pct = Math.round((sessionsByClinic[name] / totalSessions) * 100);
                    return (
                      <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 2, background: clinicColors[i % clinicColors.length], flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1 }}>{name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#1a2942" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Revenue by Clinic</span>
          </div>
          <div className="card-body">
            {Object.keys(revenueByClinic).length === 0 ? (
              <div className="empty-state"><p>No invoices yet</p></div>
            ) : (
              <>
                <div className="chart-bar">
                  {Object.entries(revenueByClinic).map(([name, rev], i) => {
                    const pct = Math.round((rev / maxRevenue) * 100);
                    return (
                      <div key={name} className="chart-col">
                        <span className="chart-value" style={{ fontSize: 9 }}>${Math.round(rev)}</span>
                        <div className="chart-bar-inner" style={{ height: `${Math.max(pct, 8)}%`, background: clinicColors[i % clinicColors.length] }}/>
                        <span className="chart-label" style={{ fontSize: 9, maxWidth: 50, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {name.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {Object.entries(revenueByClinic).map(([name, rev], i) => (
                  <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: clinicColors[i % clinicColors.length], flexShrink: 0 }} />
                    <span style={{ fontSize: 12, flex: 1 }}>{name}</span>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>{formatCurrency(rev)}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Invoices</span></div>
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Clinic</th>
                <th>Period</th>
                <th>Total</th>
                <th>Status</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600, fontFamily: "monospace" }}>{inv.invoiceNumber}</td>
                  <td>{inv.clinicName}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{formatDate(inv.periodFrom)} – {formatDate(inv.periodTo)}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td style={{ fontSize: 12, color: inv.status === "unpaid" ? "#e8a045" : "#64748b" }}>{formatDate(inv.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── CLINICS ─────────────────────────────────────────────────────────────────
const Clinics = ({ clinics, setClinics }) => {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [rates, setRates] = useState([{ duration: "", rate: "" }]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", country: "CA", address: "", city: "", province: "", postalCode: "", contact: "", phone: "", email: "", billingCycle: "bi-weekly", status: "active" });
    setRates([{ duration: "", rate: "" }]);
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c.id);
    setForm({ name: c.name, country: c.country||"CA", address: c.address||"", city: c.city||"", province: c.province||"", postalCode: c.postalCode||"", contact: c.contact, phone: c.phone, email: c.email, billingCycle: c.billingCycle, status: c.status });
    setRates(c.rates.map(r => ({ duration: String(r.duration), rate: String(r.rate) })));
    setModal(true);
  };

  const save = () => {
    const clinicRates = rates.filter(r => r.duration && r.rate).map(r => ({ duration: parseInt(r.duration), rate: parseFloat(r.rate) }));
    if (!form.name) return;
    if (editing) {
      setClinics(prev => prev.map(c => c.id === editing ? { ...c, ...form, rates: clinicRates } : c));
    } else {
      setClinics(prev => [...prev, { id: genId(), ...form, rates: clinicRates }]);
    }
    setModal(false);
  };

  const deleteClinic = (id) => {
    if (window.confirm("Delete this clinic?")) setClinics(prev => prev.filter(c => c.id !== id));
  };

  const toggleStatus = (id) => {
    setClinics(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "active" ? "inactive" : "active" } : c));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" />Add Clinic</button>
      </div>

      <div className="card">
        {clinics.length === 0 ? (
          <div className="empty-state">
            <Icon name="clinic" /><p>No clinics yet</p><small>Add your first clinic to get started</small>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Clinic Name</th>
                <th>Contact</th>
                <th>Billing Cycle</th>
                <th>Rates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clinics.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{[c.address, c.city, c.province, c.country].filter(Boolean).join(", ")}</div>
                  </td>
                  <td>
                    <div>{c.contact}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{c.email}</div>
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{c.billingCycle}</td>
                  <td>
                    <div style={{ fontSize: 12 }}>
                      {c.rates.map(r => `${r.duration}min: ${formatCurrency(r.rate)}`).join(" · ")}
                    </div>
                  </td>
                  <td>
                    <button className={`badge badge-${c.status}`} style={{ cursor: "pointer", border: "none" }} onClick={() => toggleStatus(c.id)}>
                      {c.status}
                    </button>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}><Icon name="edit" /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteClinic(c.id)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Clinic" : "Add Clinic"}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Clinic</button></>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Clinic Name *</label>
            <input className="form-input" value={form.name || ""} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          {editing && (
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-select" value={form.status || "active"} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          )}
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Country *</label>
            <select className="form-select" value={form.country||"CA"} onChange={e => setForm(f => ({ ...f, country: e.target.value, province: "" }))}>
              {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.currency})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">City *</label>
            <input className="form-input" value={form.city||""} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="e.g. Toronto" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Street Address</label>
          <input className="form-input" value={form.address||""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Main St" />
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Province / State</label>
            <select className="form-select" value={form.province||""} onChange={e => setForm(f => ({ ...f, province: e.target.value }))}>
              <option value="">Select...</option>
              {(COUNTRIES.find(c=>c.code===(form.country||"CA"))?.provinces||[]).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Postal / ZIP Code</label>
            <input className="form-input" value={form.postalCode||""} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))} placeholder="e.g. M5V 3A8" />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Contact Person</label>
            <input className="form-input" value={form.contact || ""} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone || ""} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email || ""} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Billing Cycle</label>
            <select className="form-select" value={form.billingCycle || "bi-weekly"} onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="semi-monthly">Semi-Monthly (1st & 15th)</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <label className="form-label">Session Rates (Duration + Rate)</label>
          {rates.map((r, i) => (
            <div key={i} className="rates-row">
              <input className="form-input" placeholder="Duration (min)" type="number" value={r.duration} onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, duration: e.target.value } : x))} />
              <input className="form-input" placeholder="Rate ($)" type="number" step="0.01" value={r.rate} onChange={e => setRates(prev => prev.map((x, j) => j === i ? { ...x, rate: e.target.value } : x))} />
              <button className="btn btn-danger btn-sm" onClick={() => setRates(prev => prev.filter((_, j) => j !== i))} disabled={rates.length === 1}><Icon name="trash" /></button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => setRates(prev => [...prev, { duration: "", rate: "" }])}><Icon name="plus" /> Add Rate</button>
        </div>
      </Modal>
    </div>
  );
};

// ─── SESSIONS ────────────────────────────────────────────────────────────────
const Sessions = ({ sessions, setSessions, clinics }) => {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [filterClinic, setFilterClinic] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [voiceMode, setVoiceMode] = useState(false);
  const [recording, setRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceProcessing, setVoiceProcessing] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const PER_PAGE = 10;

  const activeClinics = clinics.filter(c => c.status === "active");
  const selectedClinic = activeClinics.find(c => c.id === form.clinicId);

  const filtered = sessions.filter(s => {
    if (filterClinic && s.clinicId !== filterClinic) return false;
    if (search && !s.clientInitial?.toLowerCase().includes(search.toLowerCase()) &&
      !s.clinicName?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => b.date.localeCompare(a.date));

  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(filtered.length / PER_PAGE);

  const openAdd = () => {
    setEditing(null);
    setVoiceMode(false);
    setVoiceTranscript("");
    setVoiceError("");
    setForm({ clinicId: activeClinics[0]?.id || "", date: new Date().toISOString().split("T")[0], startTime: "", duration: "", sessionType: "RMT", clientInitial: "", notes: "" });
    setModal(true);
  };

  const openVoiceAdd = () => {
    setEditing(null);
    setVoiceMode(true);
    setVoiceTranscript("");
    setVoiceError("");
    setForm({ clinicId: activeClinics[0]?.id || "", date: new Date().toISOString().split("T")[0], startTime: "", duration: "", sessionType: "RMT", clientInitial: "", notes: "" });
    setModal(true);
  };

  const startRecording = async () => {
    setVoiceError("");
    setVoiceTranscript("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
      audioChunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mr.mimeType });
        await processVoice(blob);
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (e) {
      setVoiceError("Microphone access denied. Please allow microphone access and try again.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setVoiceProcessing(true);
    }
  };

  const processVoice = async (audioBlob) => {
    try {
      // Use Web Speech API for transcription (browser-native, free)
      const text = await transcribeAudio(audioBlob);
      setVoiceTranscript(text);
      // Use Claude AI to extract session details from transcript
      await extractSessionFromText(text);
    } catch (e) {
      setVoiceError("Could not process voice. Please try again or fill in manually.");
    } finally {
      setVoiceProcessing(false);
    }
  };

  const transcribeAudio = (audioBlob) => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) { reject(new Error("Not supported")); return; }
      // Re-play via audio element for recognition
      const url = URL.createObjectURL(audioBlob);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";
      let result = "";
      recognition.onresult = e => { for (let i = e.resultIndex; i < e.results.length; i++) result += e.results[i][0].transcript + " "; };
      recognition.onerror = () => reject(new Error("Recognition failed"));
      recognition.onend = () => resolve(result.trim() || "Could not transcribe audio. Please speak clearly and try again.");
      recognition.start();
      // Stop after short delay if no speech detected
      setTimeout(() => { try { recognition.stop(); } catch(e){} }, 10000);
    });
  };

  const extractSessionFromText = async (text) => {
    if (!text || text.includes("Could not transcribe")) return;
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          system: "You are a medical assistant helping an RMT log session details. Extract session information from the voice note and return ONLY a JSON object with these fields: date (YYYY-MM-DD, default today), startTime (HH:MM 24h), duration (integer minutes: 30/45/60/90), sessionType (one of: RMT, RMT + Cupping, RMT + Osteo, Others), clientInitial (initials only, e.g. J.D.), notes (brief treatment notes). If a field is not mentioned, use empty string or sensible default. Return only valid JSON, no other text.",
          messages: [{ role: "user", content: `Today is ${new Date().toISOString().split("T")[0]}. Voice note: "${text}"` }]
        })
      });
      const data = await response.json();
      const raw = data.content?.[0]?.text || "{}";
      const clean = raw.replace(/\`\`\`json|\`\`\`/g, "").trim();
      const parsed = JSON.parse(clean);
      setForm(f => ({
        ...f,
        date: parsed.date || f.date,
        startTime: parsed.startTime || f.startTime,
        duration: parsed.duration ? parseInt(parsed.duration) : f.duration,
        sessionType: parsed.sessionType || f.sessionType,
        clientInitial: parsed.clientInitial || f.clientInitial,
        notes: parsed.notes || f.notes,
      }));
    } catch(e) {
      // AI extraction failed, transcript still shown for manual review
    }
  };

  const openEdit = (s) => {
    setEditing(s.id);
    setForm({ clinicId: s.clinicId, date: s.date, startTime: s.startTime, duration: s.duration, sessionType: s.sessionType, clientInitial: s.clientInitial, notes: s.notes });
    setModal(true);
  };

  const save = () => {
    const clinic = activeClinics.find(c => c.id === form.clinicId);
    if (!form.clinicId || !form.date || !form.duration) return;
    if (editing) {
      setSessions(prev => prev.map(s => s.id === editing ? { ...s, ...form, clinicName: clinic?.name || "" } : s));
    } else {
      setSessions(prev => [...prev, { id: genId(), ...form, clinicName: clinic?.name || "" }]);
    }
    setModal(false);
  };

  const del = (id) => { if (window.confirm("Delete session?")) setSessions(prev => prev.filter(s => s.id !== id)); };

  const toggleSelect = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected(prev => prev.size === paged.length ? new Set() : new Set(paged.map(s => s.id)));
  const bulkDelete = () => {
    if (selected.size === 0) return;
    if (window.confirm(`Delete ${selected.size} selected session(s)?`)) {
      setSessions(prev => prev.filter(s => !selected.has(s.id)));
      setSelected(new Set());
    }
  };

  const hasPhi = (s) => s.notes?.length > 20;

  return (
    <div>
      <div className="filter-row">
        <div style={{ position: "relative", flex: 1 }}>
          <Icon name="search" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#8a7055" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search by client or clinic…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <select className="form-select" style={{ width: 200 }} value={filterClinic} onChange={e => { setFilterClinic(e.target.value); setPage(1); }}>
          <option value="">All Clinics</option>
          {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={bulkDelete}>
            <Icon name="trash" />Delete {selected.size} Selected
          </button>
        )}
        <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" />Log Session</button>
        <button className="btn btn-accent" onClick={openVoiceAdd} title="Voice log a session">🎙 Voice Log</button>
      </div>

      <div className="card">
        {paged.length === 0 ? (
          <div className="empty-state"><Icon name="sessions" /><p>No sessions found</p></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}><input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} style={{ cursor: 'pointer' }} /></th>
                <th>Date</th>
                <th>Clinic</th>
                <th>Client</th>
                <th>Time</th>
                <th>Duration</th>
                <th>Type</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(s => (
                <tr key={s.id} style={{ background: selected.has(s.id) ? 'rgba(201,169,110,0.1)' : undefined }}>
                  <td><input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleSelect(s.id)} style={{ cursor: 'pointer' }} /></td>
                  <td style={{ fontWeight: 500 }}>{formatDate(s.date)}</td>
                  <td>{s.clinicName}</td>
                  <td style={{ fontWeight: 500 }}>{s.clientInitial}</td>
                  <td>{s.startTime}</td>
                  <td><span className="badge badge-active">{s.duration} min</span></td>
                  <td style={{ fontSize: 12 }}>{s.sessionType}</td>
                  <td style={{ fontSize: 12, color: "#8a7055", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hasPhi(s) ? <span style={{ color: "#c4a882" }}>⚠ PHI</span> : s.notes || "—"}
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(s)}><Icon name="edit" /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(s.id)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px" }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setRecording(false); if(mediaRecorderRef.current && recording) try{mediaRecorderRef.current.stop()}catch(e){}; }} title={editing ? "Edit Session" : voiceMode ? "🎙 Voice Log Session" : "Log Session"}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Session</button></>}
      >
        {voiceMode && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ background: 'var(--table-head-bg)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 8 }}>🎙 Voice Recording</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                Speak naturally: <em>"Today I treated J.D. at FlexCare for a 60 minute RMT session starting at 2pm. Deep tissue work on upper back."</em>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                {!recording && !voiceProcessing && (
                  <button className="btn btn-accent" onClick={startRecording} style={{ gap: 8 }}>
                    🎙 Start Recording
                  </button>
                )}
                {recording && (
                  <button className="btn btn-danger" onClick={stopRecording} style={{ animation: 'pulse 1s infinite' }}>
                    ⏹ Stop Recording
                  </button>
                )}
                {voiceProcessing && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> Processing voice with AI…
                  </div>
                )}
                {recording && (
                  <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                    {[1,2,3,4,5].map(i => (
                      <div key={i} style={{ width: 4, background: '#ef4444', borderRadius: 2, animation: `voiceBar${i} 0.5s ease infinite alternate`, height: `${8 + i*4}px` }} />
                    ))}
                    <span style={{ fontSize: 12, color: '#ef4444', marginLeft: 6, fontWeight: 600 }}>Recording…</span>
                  </div>
                )}
              </div>
              {voiceTranscript && (
                <div style={{ background: 'var(--surface)', borderRadius: 8, padding: '10px 12px', border: '1px solid var(--border)', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Transcript</div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontStyle: 'italic' }}>{voiceTranscript}</div>
                </div>
              )}
              {voiceTranscript && !voiceProcessing && (
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Fields filled below — review and adjust before saving</div>
              )}
              {voiceError && (
                <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>⚠ {voiceError}</div>
              )}
            </div>
          </div>
        )}
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Clinic *</label>
            <select className="form-select" value={form.clinicId || ""} onChange={e => setForm(f => ({ ...f, clinicId: e.target.value, duration: "" }))}>
              {activeClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Session Type</label>
            <select className="form-select" value={form.sessionType || "RMT"} onChange={e => setForm(f => ({ ...f, sessionType: e.target.value }))}>
              {SESSION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <input className="form-input" type="time" value={form.startTime || ""} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Duration *</label>
            <select className="form-select" value={form.duration || ""} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) }))}>
              <option value="">Select duration</option>
              {(selectedClinic?.rates || []).map(r => <option key={r.duration} value={r.duration}>{r.duration} min</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Client's Initial</label>
            <input className="form-input" placeholder="e.g. J.D." value={form.clientInitial || ""} onChange={e => setForm(f => ({ ...f, clientInitial: e.target.value }))} />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <textarea className="form-textarea" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Treatment notes…" />
          {form.notes?.length > 0 && (
            <div className="phi-warning">
              <Icon name="warning" style={{ width: 13, height: 13, display: "inline", verticalAlign: "middle" }} /> Privacy reminder: Avoid entering full patient names or identifying health information in notes.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

// ─── INVOICE PREVIEW ──────────────────────────────────────────────────────────
const InvoicePreview = ({ invoice }) => {
  const companyInfo = {
    name: "Kinevie Therapeutics Inc.",
    address: "224 Otterbein Road Kitchener ON N2B 0A8",
    bank: "Royal Bank of Canada",
    bankDetails: "Kinevie Therapeutics Inc. | Transit Number: 00482 | Institution Number: 003 | Account Number: 1023696",
  };

  const clinic = invoice.clinic || { name: invoice.clinicName, address: "—" };

  return (
    <div className="invoice-preview" style={{ padding: "8px 0" }}>
      <div className="invoice-header-block">
        <div>
          <div className="invoice-co-name">{companyInfo.name} Invoice</div>
          <div className="invoice-line">{companyInfo.address}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1 }}>Invoice #</div>
          <div style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 700, color: "#1a2942" }}>{invoice.invoiceNumber}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
        <div className="invoice-to">
          <strong>To:</strong>
          <div style={{ marginTop: 6, fontWeight: 600 }}>{invoice.clinicName}</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>{clinic.address || "—"}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>Date</div>
          <div style={{ fontWeight: 600 }}>{formatDate(invoice.date)}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 8 }}>Due Date</div>
          <div style={{ fontWeight: 600, color: "#e8a045" }}>{formatDate(invoice.dueDate)}</div>
        </div>
      </div>

      <table className="invoice-table" style={{ marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ width: 50 }}>Qty</th>
            <th>Description</th>
            <th style={{ textAlign: "right" }}>Unit Price</th>
            <th style={{ textAlign: "right" }}>Line Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lineItems.map((item, i) => (
            <tr key={i}>
              <td>{item.qty}</td>
              <td>{item.description}</td>
              <td style={{ textAlign: "right" }}>{formatCurrency(item.unitPrice)}</td>
              <td style={{ textAlign: "right", fontWeight: 500 }}>{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-totals">
        <div className="invoice-totals-inner">
          <div className="invoice-total-row"><span>Subtotal</span><span style={{ fontWeight: 600 }}>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="invoice-total-row"><span>Sales Tax ({invoice.taxRate}%)</span><span>{formatCurrency(invoice.tax)}</span></div>
          <div className="invoice-total-row grand"><span>Total</span><span style={{ color: "#1a2942" }}>{formatCurrency(invoice.total)}</span></div>
        </div>
      </div>

      <div style={{ marginTop: 20, fontSize: 13, color: "#64748b" }}>
        <span style={{ fontWeight: 600 }}>Invoice Period:</span> {formatDate(invoice.periodFrom)} — {formatDate(invoice.periodTo)}
      </div>

      <div className="invoice-bank">
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#94a3b8", marginBottom: 4 }}>Bank Account Details</div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{companyInfo.bank}</div>
        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{companyInfo.bankDetails}</div>
      </div>

      <div className="invoice-footer">Thank you for your business!</div>
    </div>
  );
};

// ─── INVOICES ─────────────────────────────────────────────────────────────────
const Invoices = ({ invoices, setInvoices, sessions, clinics, company }) => {
  const [generateModal, setGenerateModal] = useState(false);
  const [viewModal, setViewModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [emailStatus, setEmailStatus] = useState(null); // null | "sending" | "sent" | "error"
  const [emailError, setEmailError] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [genForm, setGenForm] = useState({ clinicId: "", periodFrom: "", periodTo: "" });
  const [preview, setPreview] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const activeClinics = clinics.filter(c => c.status === "active");

  const generateInvoice = () => {
    const clinic = clinics.find(c => c.id === genForm.clinicId);
    if (!clinic || !genForm.periodFrom || !genForm.periodTo) return;

    const relevantSessions = sessions.filter(s =>
      s.clinicId === genForm.clinicId &&
      s.date >= genForm.periodFrom && s.date <= genForm.periodTo
    );

    if (relevantSessions.length === 0) {
      alert("No sessions found for this clinic in the selected period.");
      return;
    }

    // Group by duration
    const byDuration = {};
    relevantSessions.forEach(s => {
      const dur = s.duration;
      const rate = clinic.rates.find(r => r.duration === dur);
      if (!byDuration[dur]) byDuration[dur] = { count: 0, rate: rate?.rate || 0 };
      byDuration[dur].count++;
    });

    const lineItems = Object.entries(byDuration)
      .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
      .map(([dur, data]) => ({
        description: `RMT - Massage Sessions ${dur}min`,
        qty: data.count,
        unitPrice: data.rate,
        total: data.count * data.rate,
      }));

    const subtotal = lineItems.reduce((s, i) => s + i.total, 0);
    const taxRate = 13;
    const tax = parseFloat((subtotal * taxRate / 100).toFixed(2));
    const total = subtotal + tax;
    const today = new Date().toISOString().split("T")[0];
    const seq = invoices.filter(i => i.date === today).length + 1;

    const newInvoice = {
      id: genId(),
      clinicId: clinic.id,
      clinicName: clinic.name,
      clinic: { name: clinic.name, address: clinic.address },
      invoiceNumber: genInvoiceNumber(today, seq),
      date: today,
      dueDate: addWorkingDays(today, 3),
      periodFrom: genForm.periodFrom,
      periodTo: genForm.periodTo,
      lineItems,
      subtotal,
      tax,
      taxRate,
      total,
      status: "unpaid",
      emailSent: null,
    };

    setPreview(newInvoice);
  };

  const confirmGenerate = () => {
    if (!preview) return;
    setInvoices(prev => [preview, ...prev]);
    setGenerateModal(false);
    setPreview(null);
    setGenForm({ clinicId: "", periodFrom: "", periodTo: "" });
  };

  const toggleStatus = (id) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "paid" ? "unpaid" : "paid" } : i));
  };

  const del = (id) => { if (window.confirm("Delete invoice?")) setInvoices(prev => prev.filter(i => i.id !== id)); };

  const openEmailModal = (inv) => {
    const clinic = clinics.find(c => c.id === inv.clinicId) || {};
    setEmailTo(clinic.email || "");
    setEmailSubject(`Invoice ${inv.invoiceNumber} – ${inv.clinicName}`);
    setEmailMessage(`Hi ${clinic.contact || "there"},\n\nPlease find attached Invoice ${inv.invoiceNumber} for the period ${formatDate(inv.periodFrom)} – ${formatDate(inv.periodTo)}.\n\nAmount Due: ${formatCurrency(inv.total)}\nDue Date: ${formatDate(inv.dueDate)}\n\nPlease process payment at your earliest convenience.\n\nThank you,\nKinevie Therapeutics Inc.`);
    setEmailStatus(null);
    setEmailError("");
    setEmailModal(inv);
  };

  const sendEmail = async () => {
    const inv = emailModal;
    if (!emailTo) { setEmailError("Recipient email is required"); return; }
    setEmailStatus("sending");
    setEmailError("");
    try {
      const clinic = clinics.find(c => c.id === inv.clinicId) || {};
      await emailApi.send({
        invoiceId: inv.id,
        to: emailTo,
        subject: emailSubject,
        message: emailMessage,
        invoice: inv,
        clinicData: { address: clinic.address, contact: clinic.contact, email: clinic.email },
        company: company || {},
      });
      setEmailStatus("sent");
      setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, emailSent: new Date().toISOString() } : i));
      setTimeout(() => { setEmailModal(null); setEmailStatus(null); }, 2000);
    } catch (err) {
      setEmailStatus("error");
      setEmailError(err.message);
    }
  };

  const paged = invoices.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.ceil(invoices.length / PER_PAGE);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-accent" onClick={() => { setGenerateModal(true); setPreview(null); }}><Icon name="plus" />Generate Invoice</button>
      </div>

      <div className="card">
        {paged.length === 0 ? (
          <div className="empty-state"><Icon name="invoice" /><p>No invoices yet</p><small>Generate your first invoice above</small></div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Clinic</th>
                <th>Period</th>
                <th>Date</th>
                <th>Due</th>
                <th>Subtotal</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paged.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td>{inv.clinicName}</td>
                  <td style={{ fontSize: 12, color: "#64748b" }}>{formatDate(inv.periodFrom)} – {formatDate(inv.periodTo)}</td>
                  <td style={{ fontSize: 12 }}>{formatDate(inv.date)}</td>
                  <td style={{ fontSize: 12, color: inv.status === "unpaid" ? "#e8a045" : "#64748b" }}>{formatDate(inv.dueDate)}</td>
                  <td>{formatCurrency(inv.subtotal)}</td>
                  <td style={{ fontWeight: 700 }}>{formatCurrency(inv.total)}</td>
                  <td>
                    <button className={`badge badge-${inv.status}`} style={{ cursor: "pointer", border: "none" }} onClick={() => toggleStatus(inv.id)}>
                      {inv.status}
                    </button>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => setViewModal(inv)} title="View"><Icon name="eye" /></button>
                      <button className="btn btn-ghost btn-sm" title="Download PDF" onClick={() => downloadInvoicePDF(inv, clinics)}><Icon name="pdf" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEmailModal(inv)} title="Email"><Icon name="mail" /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(inv.id)}><Icon name="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div style={{ padding: "12px 16px" }}>
            <div className="pagination">
              <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn${page === p ? " active" : ""}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Modal */}
      <Modal open={generateModal} onClose={() => setGenerateModal(false)} title="Generate Invoice" large
        footer={
          preview
            ? <><button className="btn btn-ghost" onClick={() => setPreview(null)}>Back</button><button className="btn btn-accent" onClick={confirmGenerate}><Icon name="check" />Confirm & Save Invoice</button></>
            : <><button className="btn btn-ghost" onClick={() => setGenerateModal(false)}>Cancel</button><button className="btn btn-primary" onClick={generateInvoice}>Preview Invoice</button></>
        }
      >
        {!preview ? (
          <>
            <div className="form-group">
              <label className="form-label">Clinic *</label>
              <select className="form-select" value={genForm.clinicId} onChange={e => setGenForm(f => ({ ...f, clinicId: e.target.value }))}>
                <option value="">Select active clinic…</option>
                {activeClinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Period From *</label>
                <input className="form-input" type="date" value={genForm.periodFrom} onChange={e => setGenForm(f => ({ ...f, periodFrom: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Period To *</label>
                <input className="form-input" type="date" value={genForm.periodTo} onChange={e => setGenForm(f => ({ ...f, periodTo: e.target.value }))} />
              </div>
            </div>
            {genForm.clinicId && (
              <div className="alert alert-info">
                Sessions found for {clinics.find(c => c.id === genForm.clinicId)?.name}: {
                  genForm.periodFrom && genForm.periodTo
                    ? sessions.filter(s => s.clinicId === genForm.clinicId && s.date >= genForm.periodFrom && s.date <= genForm.periodTo).length
                    : "—"
                }
              </div>
            )}
          </>
        ) : (
          <>
            <div className="alert alert-success"><Icon name="check" style={{ width: 13, height: 13, display: "inline" }} /> Invoice preview ready. Review and confirm to save.</div>
            <InvoicePreview invoice={preview} />
          </>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={!!viewModal} onClose={() => setViewModal(null)} title={`Invoice ${viewModal?.invoiceNumber}`} large>
        {viewModal && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => openEmailModal(viewModal)}><Icon name="mail" />Email</button>
              <button className="btn btn-accent btn-sm" onClick={() => downloadInvoicePDF(viewModal, clinics)}><Icon name="pdf" />Download PDF</button>
            </div>
            <InvoicePreview invoice={viewModal} />
          </>
        )}
      </Modal>

      {/* Email Modal */}
      <Modal open={!!emailModal} onClose={() => { if (emailStatus !== "sending") setEmailModal(null); }} title="Email Invoice to Clinic"
        footer={
          emailStatus === "sent" ? (
            <div style={{ color: "#16a34a", fontWeight: 600, fontSize: 14 }}>✓ Email sent successfully!</div>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => setEmailModal(null)} disabled={emailStatus === "sending"}>Cancel</button>
              <button className="btn btn-primary" onClick={sendEmail} disabled={emailStatus === "sending"}>
                <Icon name="mail" />{emailStatus === "sending" ? "Sending…" : "Send Email"}
              </button>
            </>
          )
        }
      >
        {emailModal && (
          <>
            {emailError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 16 }}>
                ⚠ {emailError}
              </div>
            )}
            {emailModal.emailSent && (
              <div className="alert alert-info" style={{ marginBottom: 16 }}>Previously sent: {new Date(emailModal.emailSent).toLocaleString()}</div>
            )}
            <div className="form-group">
              <label className="form-label">To *</label>
              <input className="form-input" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="clinic@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-textarea" rows={7} value={emailMessage} onChange={e => setEmailMessage(e.target.value)} />
            </div>
            <div style={{ background: "#f5ede0", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#8a7055", display: "flex", alignItems: "center", gap: 8 }}>
              <span>📎</span>
              <span>Invoice <strong>{emailModal.invoiceNumber}</strong> will be attached as a PDF to this email.</span>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ─── EXPENSES ────────────────────────────────────────────────────────────────
const Expenses = ({ expenses, setExpenses }) => {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const openAdd = () => {
    setEditing(null);
    setForm({ date: new Date().toISOString().split("T")[0], category: "Supplies", amount: "", notes: "" });
    setModal(true);
  };

  const openEdit = (e) => {
    setEditing(e.id);
    setForm({ date: e.date, category: e.category, amount: e.amount, notes: e.notes });
    setModal(true);
  };

  const save = () => {
    if (!form.date || !form.amount) return;
    if (editing) {
      setExpenses(prev => prev.map(e => e.id === editing ? { ...e, ...form, amount: parseFloat(form.amount) } : e));
    } else {
      setExpenses(prev => [...prev, { id: genId(), ...form, amount: parseFloat(form.amount) }]);
    }
    setModal(false);
  };

  const del = (id) => { if (window.confirm("Delete expense?")) setExpenses(prev => prev.filter(e => e.id !== id)); };

  const totalByCategory = {};
  expenses.forEach(e => { totalByCategory[e.category] = (totalByCategory[e.category] || 0) + e.amount; });
  const grandTotal = expenses.reduce((s, e) => s + e.amount, 0);

  const sorted = [...expenses].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openAdd}><Icon name="plus" />Add Expense</button>
      </div>

      <div className="split-layout" style={{ marginBottom: 24 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">By Category</span></div>
          <div className="card-body">
            {Object.entries(totalByCategory).map(([cat, amt]) => (
              <div key={cat} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 14 }}>
                <span>{cat}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(amt)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0 0", fontWeight: 700, fontSize: 15 }}>
              <span>Total</span><span style={{ color: "#1a2942" }}>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Expenses</span></div>
          <div className="card-body">
            {sorted.slice(0, 4).map(e => (
              <div key={e.id} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, background: "#f1f5f9", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="expense" style={{ width: 16, height: 16, color: "#64748b" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.category}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{formatDate(e.date)} · {e.notes}</div>
                </div>
                <div style={{ fontWeight: 700, color: "#ef4444", fontSize: 13 }}>−{formatCurrency(e.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Amount</th><th>Notes</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {sorted.map(e => (
              <tr key={e.id}>
                <td style={{ fontWeight: 500 }}>{formatDate(e.date)}</td>
                <td><span className="badge badge-active">{e.category}</span></td>
                <td style={{ fontWeight: 700, color: "#ef4444" }}>{formatCurrency(e.amount)}</td>
                <td style={{ fontSize: 13, color: "#64748b" }}>{e.notes}</td>
                <td>
                  <div className="actions-cell">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(e)}><Icon name="edit" /></button>
                    <button className="btn btn-danger btn-sm" onClick={() => del(e.id)}><Icon name="trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Expense" : "Add Expense"}
        footer={<><button className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}
      >
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input className="form-input" type="date" value={form.date || ""} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-select" value={form.category || "Supplies"} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Amount ($) *</label>
          <input className="form-input" type="number" step="0.01" value={form.amount || ""} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input className="form-input" value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
};

// ─── CSV IMPORT ───────────────────────────────────────────────────────────────
const CSVImport = ({ sessions, setSessions, clinics, setClinics }) => {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [missingClinics, setMissingClinics] = useState([]);
  const [dupes, setDupes] = useState([]);
  const [step, setStep] = useState(0);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCSV(ev.target.result);
      setRows(parsed);
      setStep(1);
      setStatus(null);
      setMissingClinics([]);
      setDupes([]);
    };
    reader.readAsText(file);
  };

  const analyze = () => {
    const missing = new Set();
    const newDupes = [];

    rows.forEach(r => {
      const cName = r["Clinic Name"]?.trim();
      if (!cName) return;
      const clinic = clinics.find(c => c.name.toLowerCase() === cName.toLowerCase());
      if (!clinic) missing.add(cName);

      // Check dupe
      const dur = parseInt(r["Duration"]) || 0;
      const date = r["Date"];
      const time = r["Start Time"];
      const dupe = sessions.find(s =>
        s.clinicName?.toLowerCase() === cName.toLowerCase() &&
        s.date === date && s.startTime === time && s.duration === dur
      );
      if (dupe) newDupes.push(r);
    });

    setMissingClinics([...missing]);
    setDupes(newDupes);
    setStep(2);
  };

  const doImport = () => {
    const imported = [];
    let skipped = 0;

    rows.forEach(r => {
      const cName = r["Clinic Name"]?.trim();
      const clinic = clinics.find(c => c.name.toLowerCase() === cName.toLowerCase());
      const date = r["Date"];
      const time = r["Start Time"];
      const durStr = r["Duration"] || "";
      const dur = parseInt(durStr);

      // Skip if missing clinic
      if (!clinic) { skipped++; return; }

      // Skip dupes
      const dupe = sessions.find(s =>
        s.clinicId === clinic.id && s.date === date && s.startTime === time && s.duration === dur
      );
      if (dupe) { skipped++; return; }

      imported.push({
        id: genId(),
        clinicId: clinic.id,
        clinicName: clinic.name,
        date,
        startTime: time,
        duration: dur,
        sessionType: r["Session Type"] || "RMT",
        clientInitial: r["Client's Initial"] || "",
        notes: r["Notes"] || "",
      });
    });

    setSessions(prev => [...prev, ...imported]);
    setStatus({ imported: imported.length, skipped });
    setStep(3);
  };

  const createMissingAsInactive = () => {
    const newClinics = missingClinics.map(name => ({
      id: genId(), name, address: "", contact: "", phone: "", email: "",
      billingCycle: "bi-weekly", status: "inactive", rates: [],
    }));
    setClinics(prev => [...prev, ...newClinics]);
    setMissingClinics([]);
    alert(`Created ${newClinics.length} clinics as inactive. Complete their details in Manage Clinics.`);
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Import from Google Form CSV</span></div>
        <div className="card-body">
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 16 }}>
            Upload the CSV export from your Google Form. Expected columns: <code>Timestamp, Clinic Name, Client's Initial, Date, Start Time, Duration, Session Type, Notes</code>
          </p>

          <label htmlFor="csvInput" className="import-zone">
            <Icon name="import" style={{ width: 32, height: 32, color: "#e8a045", margin: "0 auto 8px" }} />
            <div style={{ fontWeight: 600, color: "#1a2942" }}>Click to upload CSV file</div>
            <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>or drag and drop</div>
          </label>
          <input id="csvInput" type="file" accept=".csv" onChange={handleFile} />

          {step >= 1 && rows.length > 0 && (
            <div>
              <div className="alert alert-info" style={{ marginTop: 16 }}>
                {rows.length} rows loaded from CSV.
              </div>
              {step === 1 && (
                <div className="import-preview">
                  <table>
                    <thead>
                      <tr>
                        <th>Clinic</th><th>Date</th><th>Duration</th><th>Type</th><th>Client</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i}>
                          <td>{r["Clinic Name"]}</td>
                          <td>{r["Date"]}</td>
                          <td>{r["Duration"]}</td>
                          <td>{r["Session Type"]}</td>
                          <td>{r["Client's Initial"]}</td>
                        </tr>
                      ))}
                      {rows.length > 5 && <tr><td colSpan={5} style={{ color: "#94a3b8", textAlign: "center" }}>…and {rows.length - 5} more rows</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
              {step === 1 && <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={analyze}>Analyze & Check</button>}
            </div>
          )}

          {step === 2 && (
            <div style={{ marginTop: 16 }}>
              {missingClinics.length > 0 && (
                <div className="alert alert-warning">
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>⚠ {missingClinics.length} clinic(s) not found in your database:</div>
                  {missingClinics.map(c => <div key={c} style={{ fontSize: 12 }}>• {c}</div>)}
                  <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={createMissingAsInactive}>
                    Create as inactive & complete later
                  </button>
                </div>
              )}
              {dupes.length > 0 && (
                <div className="alert alert-info">
                  {dupes.length} duplicate session(s) will be skipped.
                </div>
              )}
              <div className="alert alert-success">
                Ready to import {rows.length - dupes.length - (missingClinics.length > 0 ? rows.filter(r => missingClinics.some(m => m.toLowerCase() === r["Clinic Name"]?.trim().toLowerCase())).length : 0)} sessions.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>Back</button>
                <button className="btn btn-accent" onClick={doImport}><Icon name="import" />Import Sessions</button>
              </div>
            </div>
          )}

          {step === 3 && status && (
            <div className="alert alert-success" style={{ marginTop: 16 }}>
              ✓ Imported {status.imported} sessions. {status.skipped} skipped (duplicates or missing clinics).
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── MAIN APP ────────────────────────────────────────────────────────────────
const SMTP_PROVIDERS = [
  { id: "gmail", label: "Gmail", icon: "📧", host: "smtp.gmail.com", port: 587, secure: false },
  { id: "sendgrid", label: "SendGrid", icon: "📨", host: "smtp.sendgrid.net", port: 587, secure: false },
  { id: "mailgun", label: "Mailgun", icon: "📬", host: "smtp.mailgun.org", port: 587, secure: false },
  { id: "custom", label: "Custom", icon: "⚙️", host: "", port: 587, secure: false },
];

const INITIAL_SMTP = {
  provider: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  username: "",
  password: "",
  fromName: "Kinevie Therapeutics Inc.",
  fromEmail: "",
  testEmail: "",
  configured: false,
};

const INITIAL_COMPANY = {
  name: "Kinevie Therapeutics Inc.",
  address: "224 Otterbein Road Kitchener ON N2B 0A8",
  phone: "",
  email: "",
  hstNumber: "",
  bankName: "Royal Bank of Canada",
  bankDetails: "Kinevie Therapeutics Inc. | Transit Number: 00482 | Institution Number: 003 | Account Number: 1023696",
};

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const Settings = ({ smtp, setSmtp, company, setCompany, themeId, setThemeId }) => {
  const [activeTab, setActiveTab] = useState("smtp");
  const [showPassword, setShowPassword] = useState(false);
  const [testStatus, setTestStatus] = useState(null); // null | "testing" | "success" | "error"
  const [testMsg, setTestMsg] = useState("");
  const [saved, setSaved] = useState(false);

  const selectProvider = (p) => {
    setSmtp(s => ({ ...s, provider: p.id, host: p.host, port: p.port, secure: p.secure }));
  };

  const handleSaveSmtp = () => {
    setSmtp(s => ({ ...s, configured: !!(s.host && s.username && s.password && s.fromEmail) }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTest = async () => {
    if (!(smtp.host && smtp.username && smtp.password)) {
      setTestStatus("error");
      setTestMsg("Please fill in SMTP host, username, and password, then Save before testing.");
      return;
    }
    setTestStatus("testing");
    setTestMsg("Connecting to SMTP server…");
    try {
      const result = await emailApi.test();
      setTestStatus("success");
      setTestMsg(result.message || `Test email sent to ${smtp.testEmail || smtp.username}`);
      setSmtp(s => ({ ...s, configured: true }));
    } catch (err) {
      setTestStatus("error");
      setTestMsg(err.message || "Connection failed. Check your credentials.");
    }
  };

  const smtpStatusClass = testStatus === "success" ? "connected" : testStatus === "testing" ? "testing" : smtp.configured ? "connected" : "disconnected";
  const smtpStatusLabel = testStatus === "testing" ? "Testing connection…" : testStatus === "success" ? "Connected & verified" : testStatus === "error" ? "Connection failed" : smtp.configured ? "Configured" : "Not configured";
  const smtpStatusIcon = testStatus === "testing" ? "⏳" : testStatus === "success" || smtp.configured ? "✓" : "⚠";

  return (
    <div>
      <div className="tabs">
        <button className={`tab${activeTab === "smtp" ? " active" : ""}`} onClick={() => setActiveTab("smtp")}>Email / SMTP</button>
        <button className={`tab${activeTab === "company" ? " active" : ""}`} onClick={() => setActiveTab("company")}>Company Info</button>
        <button className={`tab${activeTab === "theme" ? " active" : ""}`} onClick={() => setActiveTab("theme")}>🎨 Theme</button>
      </div>

      {activeTab === "smtp" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">SMTP Email Configuration</span>
            <div className={`smtp-status-bar ${smtpStatusClass}`} style={{ margin: 0, padding: "4px 12px", borderRadius: 20, fontSize: 12 }}>
              {smtpStatusIcon} {smtpStatusLabel}
            </div>
          </div>
          <div className="card-body">
            <div className="settings-section">
              <div className="settings-section-title">Email Provider</div>
              <div className="provider-grid">
                {SMTP_PROVIDERS.map(p => (
                  <button key={p.id} className={`provider-btn${smtp.provider === p.id ? " active" : ""}`} onClick={() => selectProvider(p)}>
                    <span className="provider-icon">{p.icon}</span>
                    {p.label}
                  </button>
                ))}
              </div>
              <div style={{ background: "#f5ede0", border: "1px solid #ddd0b8", borderRadius: 10, padding: "14px 16px", fontSize: 12, color: "#8a7258", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 13 }}>📋 Email Setup — Using Resend (Free, 3000 emails/month)</div>
                <ol style={{ paddingLeft: 18, lineHeight: 2 }}>
                  <li>Go to <a href="https://resend.com" target="_blank" rel="noreferrer" style={{ color: "#c4a882" }}>resend.com</a> and create a free account</li>
                  <li>Click <strong>API Keys</strong> in the left menu → <strong>Create API Key</strong></li>
                  <li>Name it "Kinevie", click <strong>Add</strong> — copy the key starting with <code>re_...</code></li>
                  <li>Paste that key into the <strong>Password / API Key</strong> field below</li>
                  <li>Set <strong>From Email</strong> to <code>onboarding@resend.dev</code> (free tier) or your verified domain</li>
                  <li>Click <strong>Save</strong> then <strong>Test Connection</strong></li>
                </ol>
                <div style={{ marginTop: 6, color: "#8a7055" }}>💡 Resend works over HTTPS so it is never blocked by Railway.</div>
              </div>
              {smtp.provider === "sendgrid" && (
                <div className="alert alert-info" style={{ fontSize: 12 }}>
                  <strong>SendGrid:</strong> Use <code>apikey</code> as the username and your SendGrid API key as the password.
                </div>
              )}
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Server Settings</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">SMTP Host *</label>
                  <input className="form-input" value={smtp.host} onChange={e => setSmtp(s => ({ ...s, host: e.target.value }))} placeholder="e.g. smtp.gmail.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Port *</label>
                  <select className="form-select" value={smtp.port} onChange={e => setSmtp(s => ({ ...s, port: parseInt(e.target.value) }))}>
                    <option value={587}>587 (STARTTLS — recommended)</option>
                    <option value={465}>465 (SSL/TLS)</option>
                    <option value={25}>25 (Plain — not recommended)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={smtp.secure} onChange={e => setSmtp(s => ({ ...s, secure: e.target.checked }))} />
                  <span>Use SSL/TLS (enable for port 465)</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Authentication</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Username / Email *</label>
                  <input className="form-input" value={smtp.username} onChange={e => setSmtp(s => ({ ...s, username: e.target.value }))} placeholder="your@email.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password / API Key *</label>
                  <div className="password-wrapper">
                    <input className="form-input" style={{ paddingRight: 36 }} type={showPassword ? "text" : "password"} value={smtp.password} onChange={e => setSmtp(s => ({ ...s, password: e.target.value }))} placeholder="App password or API key" />
                    <button className="toggle-password" onClick={() => setShowPassword(v => !v)}>
                      <Icon name={showPassword ? "eye2" : "eye"} style={{ width: 16, height: 16 }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Sender Identity</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">From Name</label>
                  <input className="form-input" value={smtp.fromName} onChange={e => setSmtp(s => ({ ...s, fromName: e.target.value }))} placeholder="Kinevie Therapeutics Inc." />
                </div>
                <div className="form-group">
                  <label className="form-label">From Email *</label>
                  <input className="form-input" type="email" value={smtp.fromEmail} onChange={e => setSmtp(s => ({ ...s, fromEmail: e.target.value }))} placeholder="invoices@kinevie.ca" />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Test Connection</div>
              <div className="form-group">
                <label className="form-label">Send Test Email To</label>
                <input className="form-input" type="email" value={smtp.testEmail} onChange={e => setSmtp(s => ({ ...s, testEmail: e.target.value }))} placeholder="your@email.com" />
              </div>
              {testStatus && (
                <div className={`alert alert-${testStatus === "success" ? "success" : testStatus === "testing" ? "info" : "warning"}`} style={{ marginBottom: 12 }}>
                  {testMsg}
                </div>
              )}
              <div style={{ display: "flex", gap: 10 }}>
                <button className="btn btn-ghost" onClick={handleTest}>
                  <Icon name="server" />Test Connection
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0" }}>
              <button className="btn btn-primary" onClick={handleSaveSmtp}>
                <Icon name="check" />Save SMTP Settings
              </button>
              {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Settings saved</span>}
              <span style={{ fontSize: 12, color: "#94a3b8", marginLeft: "auto" }}>
                <Icon name="lock" style={{ width: 13, height: 13, display: "inline", verticalAlign: "middle" }} /> Credentials are stored locally in this session
              </span>
            </div>
          </div>
        </div>
      )}


      {activeTab === "theme" && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">App Theme</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Changes apply instantly</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {THEMES.map(t => (
                <div
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  style={{
                    border: `2px solid ${themeId === t.id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: themeId === t.id ? '0 0 0 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {/* Mini app preview */}
                  <div style={{ display: 'flex', height: 80 }}>
                    <div style={{ width: 28, background: t.vars['--sidebar-bg'], display: 'flex', flexDirection: 'column', padding: '6px 4px', gap: 4 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ height: 4, borderRadius: 2, background: i === 2 ? t.vars['--sidebar-accent'] : 'rgba(255,255,255,0.25)' }} />
                      ))}
                    </div>
                    <div style={{ flex: 1, background: t.vars['--bg'], padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ height: 8, width: '60%', borderRadius: 3, background: t.vars['--primary'], opacity: 0.7 }} />
                      <div style={{ display: 'flex', gap: 3, flex: 1 }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, background: t.vars['--surface'], borderRadius: 4, border: `1px solid ${t.vars['--border']}` }} />
                        ))}
                      </div>
                      <div style={{ height: 14, borderRadius: 4, background: t.vars['--surface'], border: `1px solid ${t.vars['--border']}` }} />
                    </div>
                  </div>
                  {/* Label row */}
                  <div style={{
                    padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--surface)', borderTop: '1px solid var(--border)',
                  }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {t.preview.map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, borderRadius: '50%', background: c, border: '1px solid rgba(0,0,0,0.1)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                    {themeId === t.id && <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>✓ Active</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "company" && (
        <div className="card">
          <div className="card-header"><span className="card-title">Company Information</span></div>
          <div className="card-body">
            <div className="settings-section">
              <div className="settings-section-title">Business Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input className="form-input" value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">HST / Business Number</label>
                  <input className="form-input" value={company.hstNumber} onChange={e => setCompany(c => ({ ...c, hstNumber: e.target.value }))} placeholder="123456789 RT0001" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={company.address} onChange={e => setCompany(c => ({ ...c, address: e.target.value }))} />
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={company.phone} onChange={e => setCompany(c => ({ ...c, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={company.email} onChange={e => setCompany(c => ({ ...c, email: e.target.value }))} />
                </div>
              </div>
            </div>

            <div className="settings-section">
              <div className="settings-section-title">Banking Details (shown on invoices)</div>
              <div className="form-group">
                <label className="form-label">Bank Name</label>
                <input className="form-input" value={company.bankName} onChange={e => setCompany(c => ({ ...c, bankName: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Bank Details Line</label>
                <input className="form-input" value={company.bankDetails} onChange={e => setCompany(c => ({ ...c, bankDetails: e.target.value }))} placeholder="Company | Transit: XXXXX | Institution: XXX | Account: XXXXXXXXX" />
              </div>
            </div>

            <button className="btn btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>
              <Icon name="check" />Save Company Info
            </button>
            {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, marginLeft: 12 }}>✓ Saved</span>}
          </div>
        </div>
      )}
    </div>
  );
};
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "dashboard", section: "main" },
  { id: "clinics", label: "Manage Clinics", icon: "clinic", section: "main" },
  { id: "sessions", label: "Session Logs", icon: "sessions", section: "main" },
  { id: "invoices", label: "Invoices", icon: "invoice", section: "main" },
  { id: "expenses", label: "Expenses", icon: "expense", section: "main" },
  { id: "import", label: "CSV Import", icon: "import", section: "tools" },
  { id: "settings", label: "Admin Settings", icon: "settings", section: "tools" },
  { id: "users", label: "User Management", icon: "users", section: "tools", adminOnly: true },
];


const PAGE_TITLES = {
  dashboard: ["Dashboard", ""],  // subtitle set dynamically
  clinics: ["Manage Clinics", "Configure clinic rates & billing"],
  sessions: ["Session Logs", "Track your daily sessions"],
  invoices: ["Invoices", "Generate & manage invoices"],
  expenses: ["Expenses", "Track business expenses"],
  import: ["CSV Import", "Import from Google Form export"],
  settings: ["Admin Settings", "Configure email, SMTP & company info"],
  users: ["User Management", "Approve, edit & manage users"],
  profile: ["My Profile", "View and edit your profile"],

};


// ─── MAIN APP WITH AUTH ───────────────────────────────────────────────────────

// ─── USER MANAGEMENT (Admin only) ────────────────────────────────────────────
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = async () => {
    setLoading(true);
    try { setUsers(await authApi.getUsers()); } catch(e) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const pending = users.filter(u => u.status === 'pending');

  const updateStatus = async (id, status) => {
    try {
      await authApi.updateUserStatus(id, status);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    } catch(e) { alert(e.message); }
  };

  const saveEdit = async () => {
    try {
      await authApi.updateUser(editModal.id, editForm);
      setUsers(prev => prev.map(u => u.id === editModal.id ? { ...u, ...editForm } : u));
      setEditModal(null);
    } catch(e) { alert(e.message); }
  };

  const deleteUser = async (u) => {
    if (!window.confirm(`Delete ${u.fullName}? This cannot be undone.`)) return;
    try {
      await authApi.deleteUser(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
    } catch(e) { alert(e.message); }
  };

  const statusColor = { active: '#16a34a', pending: '#f59e0b', disabled: '#ef4444', rejected: '#94a3b8' };
  const statusBg = { active: '#dcfce7', pending: '#fef3c7', disabled: '#fee2e2', rejected: '#f1f5f9' };

  return (
    <div>
      {pending.length > 0 && (
        <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔔</span>
          <span style={{ fontWeight: 600, color: '#92400e' }}>{pending.length} pending registration request{pending.length > 1 ? 's' : ''} awaiting your approval</span>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">All Users</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{users.length} total</span>
        </div>
        {loading ? <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div> : (
          <table>
            <thead><tr>
              <th>Name</th><th>Email</th><th>Role</th><th>RMT #</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                  <td style={{ fontSize: 13 }}>{u.email}</td>
                  <td><span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: u.role === 'administrator' ? '#ede9fe' : 'var(--badge-active-bg)', color: u.role === 'administrator' ? '#7c3aed' : 'var(--badge-active-text)', padding: '2px 8px', borderRadius: 10 }}>{u.role}</span></td>
                  <td style={{ fontSize: 13 }}>{u.rmtNumber || '—'}</td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', background: statusBg[u.status], color: statusColor[u.status], padding: '3px 10px', borderRadius: 10 }}>{u.status}</span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="actions-cell">
                      {u.status === 'pending' && <>
                        <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }} onClick={() => updateStatus(u.id, 'active')}>✓ Approve</button>
                        <button className="btn btn-sm btn-danger" onClick={() => updateStatus(u.id, 'rejected')}>✗ Reject</button>
                      </>}
                      {u.status === 'active' && <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => updateStatus(u.id, 'disabled')}>⊘ Disable</button>}
                      {u.status === 'disabled' && <button className="btn btn-sm" style={{ background: '#dcfce7', color: '#16a34a', border: 'none' }} onClick={() => updateStatus(u.id, 'active')}>↺ Enable</button>}
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditModal(u); setEditForm({ fullName: u.fullName, rmtNumber: u.rmtNumber||'', role: u.role }); }}>✏</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit: ${editModal?.fullName}`}
        footer={<><button className="btn btn-ghost" onClick={() => setEditModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit}>Save Changes</button></>}
      >
        <div className="form-group"><label className="form-label">Full Name</label>
          <input className="form-input" value={editForm.fullName||''} onChange={e => setEditForm(f=>({...f,fullName:e.target.value}))} />
        </div>
        <div className="form-group"><label className="form-label">RMT Number</label>
          <input className="form-input" value={editForm.rmtNumber||''} onChange={e => setEditForm(f=>({...f,rmtNumber:e.target.value}))} />
        </div>
        <div className="form-group"><label className="form-label">Role</label>
          <select className="form-select" value={editForm.role||'practitioner'} onChange={e => setEditForm(f=>({...f,role:e.target.value}))}>
            <option value="practitioner">Practitioner</option>
            <option value="administrator">Administrator</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
const UserProfile = ({ themeId, saveTheme }) => {
  const { user, updateUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ fullName: user?.fullName||'', rmtNumber: user?.rmtNumber||'' });
  const [pwMode, setPwMode] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const saveProfile = async () => {
    setSaving(true); setErr(''); setMsg('');
    try {
      const updated = await authApi.updateProfile({ fullName: form.fullName, rmtNumber: form.rmtNumber });
      updateUser(updated);
      setMsg('Profile updated successfully!');
      setEditMode(false);
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword) { setErr('Passwords do not match'); return; }
    if (pwForm.newPassword.length < 8) { setErr('New password must be at least 8 characters'); return; }
    setSaving(true); setErr(''); setMsg('');
    try {
      await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setMsg('Password changed successfully!');
      setPwMode(false);
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e) { setErr(e.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Profile Information</span>
          {!editMode && <button className="btn btn-ghost btn-sm" onClick={() => setEditMode(true)}>✏ Edit</button>}
        </div>
        <div style={{ padding: 20 }}>
          {msg && <div style={{ background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#16a34a', fontWeight: 600, fontSize: 13 }}>✓ {msg}</div>}
          {err && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>⚠ {err}</div>}
          {!editMode ? (
            <div>
              {[['Full Name', user?.fullName], ['Email', user?.email], ['RMT Number', user?.rmtNumber||'—'], ['Role', user?.role], ['Account Status', user?.status]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 150, color: 'var(--text-muted)', fontSize: 13 }}>{label}</div>
                  <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13, textTransform: label === 'Role' || label === 'Account Status' ? 'capitalize' : 'none' }}>{val}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div className="form-group"><label className="form-label">Full Name</label>
                <input className="form-input" value={form.fullName} onChange={e => setForm(f=>({...f,fullName:e.target.value}))} />
              </div>
              <div className="form-group"><label className="form-label">RMT Number</label>
                <input className="form-input" value={form.rmtNumber} onChange={e => setForm(f=>({...f,rmtNumber:e.target.value}))} placeholder="Optional" />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-ghost" onClick={() => setEditMode(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving?'Saving…':'Save Profile'}</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {user?.role === 'practitioner' && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">🎨 Theme Preference</span></div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
              {THEMES.map(t => (
                <div key={t.id} onClick={() => { saveTheme(t.id); }} style={{ border: `2px solid ${themeId===t.id?'var(--accent)':'var(--border)'}`, borderRadius: 10, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', height: 50 }}>
                    <div style={{ width: 20, background: t.vars['--sidebar-bg'] }}/>
                    <div style={{ flex:1, background: t.vars['--bg'], padding: 4, display:'flex', flexDirection:'column', gap:3 }}>
                      <div style={{ height:6, width:'60%', borderRadius:2, background: t.vars['--primary'], opacity:0.7 }}/>
                      <div style={{ flex:1, background: t.vars['--surface'], borderRadius:3, border:`1px solid ${t.vars['--border']}` }}/>
                    </div>
                  </div>
                  <div style={{ padding:'6px 8px', background:'var(--surface)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:11, fontWeight:600, color:'var(--text)' }}>{t.label}</span>
                    {themeId===t.id && <span style={{ fontSize:10, color:'var(--accent)', fontWeight:700 }}>✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Password</span>
          {!pwMode && <button className="btn btn-ghost btn-sm" onClick={() => { setPwMode(true); setErr(''); setMsg(''); }}>🔒 Reset Password</button>}
        </div>
        {pwMode && (
          <div style={{ padding: 20 }}>
            {err && <div style={{ background: '#fee2e2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>⚠ {err}</div>}
            <div className="form-group"><label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f=>({...f,currentPassword:e.target.value}))} />
            </div>
            <div className="form-group"><label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.newPassword} onChange={e => setPwForm(f=>({...f,newPassword:e.target.value}))} placeholder="Min. 8 characters" />
            </div>
            <div className="form-group"><label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f=>({...f,confirmPassword:e.target.value}))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={() => setPwMode(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={changePassword} disabled={saving}>{saving?'Changing…':'Change Password'}</button>
            </div>
          </div>
        )}
        {!pwMode && <div style={{ padding: '12px 20px', color: 'var(--text-muted)', fontSize: 13 }}>Click "Reset Password" to change your password.</div>}
      </div>
    </div>
  );
};

function MainApp() {
  const { user, logout, updateUser } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [clinics, setClinicsRaw] = useState([]);
  const [sessions, setSessionsRaw] = useState([]);
  const [invoices, setInvoicesRaw] = useState([]);
  const [expenses, setExpensesRaw] = useState([]);
  const [smtp, setSmtpRaw] = useState(INITIAL_SMTP);
  const [company, setCompanyRaw] = useState(INITIAL_COMPANY);
  const [pendingCount, setPendingCount] = useState(0);
  const [weather, setWeather] = useState(null);

  // Fetch location + weather on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        // Open-Meteo: free, no API key
        const [wRes, gRes] = await Promise.all([
          fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&temperature_unit=celsius`),
          fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
        ]);
        const [wData, gData] = await Promise.all([wRes.json(), gRes.json()]);
        const city = gData.address?.city || gData.address?.town || gData.address?.village || gData.address?.county || '';
        const country = gData.address?.country_code?.toUpperCase() || '';
        const temp = Math.round(wData.current?.temperature_2m);
        const code = wData.current?.weather_code;
        const icon = code <= 1 ? '☀️' : code <= 3 ? '⛅' : code <= 48 ? '🌫️' : code <= 67 ? '🌧️' : code <= 77 ? '❄️' : code <= 82 ? '🌦️' : '⛈️';
        setWeather({ city, country, temp, icon });
      } catch(e) {}
    }, () => {});
  }, []);


  const [themeId, setThemeId] = useState(() => {
    try { const u = JSON.parse(localStorage.getItem('kinevie_user')); return u?.theme || DEFAULT_THEME_ID; } catch { return DEFAULT_THEME_ID; }
  });

  useEffect(() => { applyTheme(themeId); }, [themeId]);

  const saveTheme = async (tid) => {
    setThemeId(tid);
    try {
      const updated = await authApi.updateProfile({ theme: tid });
      updateUser(updated);
    } catch(e) {}
  };
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load all data on mount
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api.getClinics(),
      api.getSessions(),
      api.getInvoices(),
      api.getExpenses(),
      api.getSettings(),
    ]).then(([c, s, inv, exp, settings]) => {
      setClinicsRaw(c);
      setSessionsRaw(s);
      setInvoicesRaw(inv);
      setExpensesRaw(exp);
      if (settings.smtp && Object.keys(settings.smtp).length) setSmtpRaw({ ...INITIAL_SMTP, ...settings.smtp });
      if (settings.company && Object.keys(settings.company).length) setCompanyRaw({ ...INITIAL_COMPANY, ...settings.company });
      setDataLoaded(true);
      // Load pending user count for admin
      if (user?.role === 'administrator') {
        authApi.getUsers().then(users => {
          setPendingCount(users.filter(u => u.status === 'pending').length);
        }).catch(()=>{});
      }
    }).catch(console.error);
  }, [user]);

  // API-backed setters
  const setClinics = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(clinics) : updater;
    // diff: find added, updated, deleted
    const oldMap = Object.fromEntries(clinics.map(c => [c.id, c]));
    const newMap = Object.fromEntries(next.map(c => [c.id, c]));
    // deleted
    for (const id of Object.keys(oldMap)) {
      if (!newMap[id]) await api.deleteClinic(id).catch(console.error);
    }
    // added / updated
    for (const c of next) {
      if (!oldMap[c.id]) {
        const created = await api.createClinic(c).catch(console.error);
        if (created) newMap[c.id] = created;
      } else if (JSON.stringify(oldMap[c.id]) !== JSON.stringify(c)) {
        const updated = await api.updateClinic(c.id, c).catch(console.error);
        if (updated) newMap[c.id] = updated;
      }
    }
    setClinicsRaw(next.map(c => newMap[c.id] || c));
  }, [clinics]);

  const setSessions = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(sessions) : updater;
    const oldMap = Object.fromEntries(sessions.map(s => [s.id, s]));
    const newMap = Object.fromEntries(next.map(s => [s.id, s]));
    for (const id of Object.keys(oldMap)) {
      if (!newMap[id]) await api.deleteSession(id).catch(console.error);
    }
    for (const s of next) {
      if (!oldMap[s.id]) {
        const created = await api.createSession(s).catch(console.error);
        if (created) newMap[s.id] = created;
      } else if (JSON.stringify(oldMap[s.id]) !== JSON.stringify(s)) {
        const updated = await api.updateSession(s.id, s).catch(console.error);
        if (updated) newMap[s.id] = updated;
      }
    }
    setSessionsRaw(next.map(s => newMap[s.id] || s));
  }, [sessions]);

  const setInvoices = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(invoices) : updater;
    const oldMap = Object.fromEntries(invoices.map(i => [i.id, i]));
    const newMap = Object.fromEntries(next.map(i => [i.id, i]));
    for (const id of Object.keys(oldMap)) {
      if (!newMap[id]) await api.deleteInvoice(id).catch(console.error);
    }
    for (const inv of next) {
      if (!oldMap[inv.id]) {
        const created = await api.createInvoice(inv).catch(console.error);
        if (created) newMap[inv.id] = created;
      } else if (JSON.stringify(oldMap[inv.id]) !== JSON.stringify(inv)) {
        const updated = await api.updateInvoice(inv.id, inv).catch(console.error);
        if (updated) newMap[inv.id] = updated;
      }
    }
    setInvoicesRaw(next.map(i => newMap[i.id] || i));
  }, [invoices]);

  const setExpenses = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(expenses) : updater;
    const oldMap = Object.fromEntries(expenses.map(e => [e.id, e]));
    const newMap = Object.fromEntries(next.map(e => [e.id, e]));
    for (const id of Object.keys(oldMap)) {
      if (!newMap[id]) await api.deleteExpense(id).catch(console.error);
    }
    for (const ex of next) {
      if (!oldMap[ex.id]) {
        const created = await api.createExpense(ex).catch(console.error);
        if (created) newMap[ex.id] = created;
      } else if (JSON.stringify(oldMap[ex.id]) !== JSON.stringify(ex)) {
        const updated = await api.updateExpense(ex.id, ex).catch(console.error);
        if (updated) newMap[ex.id] = updated;
      }
    }
    setExpensesRaw(next.map(e => newMap[e.id] || e));
  }, [expenses]);

  const setSmtp = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(smtp) : updater;
    setSmtpRaw(next);
    await api.saveSettings({ smtp: next, company }).catch(console.error);
  }, [smtp, company]);

  const setCompany = useCallback(async (updater) => {
    const next = typeof updater === 'function' ? updater(company) : updater;
    setCompanyRaw(next);
    await api.saveSettings({ smtp, company: next }).catch(console.error);
  }, [smtp, company]);

  const [title, subtitleRaw] = PAGE_TITLES[page] || ['', ''];
  const subtitle = page === 'dashboard' ? `Welcome back, ${user?.fullName?.split(' ')[0] || 'there'} 👋` : subtitleRaw;

  if (!dataLoaded) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f5f6fa', flexDirection: 'column', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3px solid #e2e8f0', borderTopColor: '#e8a045', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Loading your workspace…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div id="print-invoice-area" />
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <h1>Kinevie <span style={{fontSize:14, fontWeight:400, opacity:0.7}}>Lite</span></h1>
            <span>Smart Practice Manager</span>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Main</div>
            {NAV.filter(n => n.section === 'main').map(n => (
              <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)}>
                <Icon name={n.icon} />
                {n.label}
              </div>
            ))}
            <div className="nav-section-label">Tools</div>
            {NAV.filter(n => n.section === 'tools' && (n.id !== 'settings' || user?.role === 'administrator') && (n.id !== 'users' || user?.role === 'administrator')).map(n => (
              <div key={n.id} className={`nav-item${page === n.id ? ' active' : ''}`} onClick={() => setPage(n.id)} style={{ position: 'relative' }}>
                <Icon name={n.icon} />
                {n.label}
                {n.id === 'users' && pendingCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{pendingCount}</span>
                )}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div style={{ fontWeight: 600, color: 'rgba(253,245,232,0.9)', fontSize: 13, marginBottom: 2 }}>{user?.fullName}</div>
            {user?.rmtNumber && <div style={{ fontSize: 11, color: 'rgba(196,168,130,0.7)', marginBottom: 8 }}>RMT #{user.rmtNumber}</div>}
            <button
              onClick={logout}
              style={{ background: 'rgba(201,169,110,0.12)', border: '1px solid rgba(196,168,130,0.25)', color: 'rgba(253,245,232,0.7)', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginBottom: 12 }}
            >
              Sign Out
            </button>
            <div style={{ fontSize: 10, color: 'rgba(196,168,130,0.5)', textAlign: 'center', letterSpacing: '0.5px', borderTop: '1px solid rgba(196,168,130,0.15)', paddingTop: 10 }}>
              Developed by<br/>
              <a href="https://www.crossbolt.ca/" target="_blank" rel="noreferrer" style={{ fontWeight: 600, color: 'rgba(196,168,130,0.8)', textDecoration: 'underline' }}>Crossbolt Technologies Inc.</a>
            </div>
          </div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{title}</div>
              {page === 'dashboard' ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</span>
                  {weather && (
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--table-head-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                      {weather.icon} {weather.temp}°C · {weather.city}{weather.country ? `, ${weather.country}` : ''}
                    </span>
                  )}
                </div>
              ) : (
                <div className="topbar-sub">{subtitle}</div>
              )}
            </div>
            <div className="topbar-actions">
              <div style={{ fontSize: 12, color: '#64748b', background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                {sessions.length} sessions · {invoices.length} invoices · {clinics.filter(c => c.status === 'active').length} active clinics
              </div>
              <button onClick={() => setPage('profile')} title="My Profile" style={{ background: 'var(--accent)', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--accent-text)', fontWeight: 700, flexShrink: 0 }}>
                {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </button>
              {smtp.configured && (
                <div style={{ fontSize: 11, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: 6, border: '1px solid #bbf7d0', fontWeight: 600 }}>
                  ✓ Email ready
                </div>
              )}
            </div>
          </div>
          <div className="content">
            {page === 'dashboard'  && <Dashboard sessions={sessions} invoices={invoices} expenses={expenses} clinics={clinics} />}
            {page === 'clinics'    && <Clinics clinics={clinics} setClinics={setClinics} />}
            {page === 'sessions'   && <Sessions sessions={sessions} setSessions={setSessions} clinics={clinics} />}
            {page === 'invoices'   && <Invoices invoices={invoices} setInvoices={setInvoices} sessions={sessions} clinics={clinics} company={company} />}
            {page === 'expenses'   && <Expenses expenses={expenses} setExpenses={setExpenses} />}
            {page === 'import'     && <CSVImport sessions={sessions} setSessions={setSessions} clinics={clinics} setClinics={setClinics} />}
            {page === 'settings' && user?.role === 'administrator' && <Settings smtp={smtp} setSmtp={setSmtp} company={company} setCompany={setCompany} themeId={themeId} setThemeId={saveTheme} />}
            {page === 'settings' && user?.role !== 'administrator' && <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>⛔ Admin access required.</div>}
            {page === 'users' && user?.role === 'administrator' && <UserManagement />}
            {page === 'profile' && <UserProfile themeId={themeId} saveTheme={saveTheme} />}
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

function AppRouter() {
  const { user } = useAuth();
  return user ? <MainApp /> : <AuthPage />;
}
