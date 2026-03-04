const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const SCHEMA = `
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";

  CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    password    TEXT NOT NULL,
    full_name   TEXT NOT NULL,
    rmt_number  TEXT,
    role        TEXT DEFAULT 'practitioner' CHECK (role IN ('administrator', 'practitioner')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS clinics (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    address       TEXT,
    contact       TEXT,
    phone         TEXT,
    email         TEXT,
    billing_cycle TEXT DEFAULT 'monthly',
    status        TEXT DEFAULT 'active',
    rates         JSONB DEFAULT '[]',
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id    UUID REFERENCES clinics(id) ON DELETE SET NULL,
    clinic_name  TEXT,
    date         DATE NOT NULL,
    start_time   TIME,
    duration     INTEGER,
    session_type TEXT DEFAULT 'RMT',
    client_initial TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    clinic_id      UUID REFERENCES clinics(id) ON DELETE SET NULL,
    clinic_name    TEXT,
    invoice_number TEXT NOT NULL,
    date           DATE,
    due_date       DATE,
    period_from    DATE,
    period_to      DATE,
    line_items     JSONB DEFAULT '[]',
    subtotal       NUMERIC(10,2) DEFAULT 0,
    tax            NUMERIC(10,2) DEFAULT 0,
    tax_rate       NUMERIC(5,2) DEFAULT 13,
    total          NUMERIC(10,2) DEFAULT 0,
    status         TEXT DEFAULT 'unpaid',
    email_sent     TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date       DATE NOT NULL,
    category   TEXT,
    amount     NUMERIC(10,2) DEFAULT 0,
    notes      TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS settings (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    smtp        JSONB DEFAULT '{}',
    company     JSONB DEFAULT '{}',
    updated_at  TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'practitioner' CHECK (role IN ('administrator', 'practitioner'));

  CREATE INDEX IF NOT EXISTS idx_clinics_user   ON clinics(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_date  ON sessions(date);
  CREATE INDEX IF NOT EXISTS idx_invoices_user  ON invoices(user_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_user  ON expenses(user_id);
`;

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(SCHEMA);
    console.log('✅ Database schema initialized');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
