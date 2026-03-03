const BASE = '/api';

function getToken() {
  return localStorage.getItem('kinevie_token');
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    localStorage.removeItem('kinevie_token');
    localStorage.removeItem('kinevie_user');
    window.location.reload();
    return;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('POST', '/auth/register', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),

  // Clinics
  getClinics: () => request('GET', '/clinics'),
  createClinic: (b) => request('POST', '/clinics', b),
  updateClinic: (id, b) => request('PUT', `/clinics/${id}`, b),
  deleteClinic: (id) => request('DELETE', `/clinics/${id}`),

  // Sessions
  getSessions: () => request('GET', '/sessions'),
  createSession: (b) => request('POST', '/sessions', b),
  bulkCreateSessions: (sessions) => request('POST', '/sessions/bulk', { sessions }),
  updateSession: (id, b) => request('PUT', `/sessions/${id}`, b),
  deleteSession: (id) => request('DELETE', `/sessions/${id}`),

  // Invoices
  getInvoices: () => request('GET', '/invoices'),
  createInvoice: (b) => request('POST', '/invoices', b),
  updateInvoice: (id, b) => request('PUT', `/invoices/${id}`, b),
  deleteInvoice: (id) => request('DELETE', `/invoices/${id}`),

  // Expenses
  getExpenses: () => request('GET', '/expenses'),
  createExpense: (b) => request('POST', '/expenses', b),
  updateExpense: (id, b) => request('PUT', `/expenses/${id}`, b),
  deleteExpense: (id) => request('DELETE', `/expenses/${id}`),

  // Settings
  getSettings: () => request('GET', '/settings'),
  saveSettings: (b) => request('PUT', '/settings', b),
};
