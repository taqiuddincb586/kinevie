# Kinevie RMT Assistant

A production-ready full-stack web application for Registered Massage Therapists to manage clinics, sessions, invoices, and expenses — with multi-therapist authentication backed by PostgreSQL.

---

## Architecture

```
kinevie/
├── backend/                  # Node.js + Express API
│   └── src/
│       ├── db/index.js       # PostgreSQL pool + schema init
│       ├── middleware/auth.js # JWT verification
│       ├── routes/
│       │   ├── auth.js       # /api/auth/register, /login, /me
│       │   ├── clinics.js    # /api/clinics CRUD
│       │   ├── sessions.js   # /api/sessions CRUD + bulk
│       │   ├── invoices.js   # /api/invoices CRUD
│       │   └── other.js      # /api/expenses + /api/settings
│       └── index.js          # Express app entry
├── frontend/                 # React + Vite
│   └── src/
│       ├── api/client.js     # Fetch wrapper with JWT headers
│       ├── hooks/useAuth.jsx # Auth context (login/register/logout)
│       ├── pages/AuthPage.jsx# Login + Register UI
│       └── App.jsx           # Main app + all components
├── Dockerfile                # Multi-stage production build
├── docker-compose.yml        # Production stack (app + postgres)
├── docker-compose.dev.yml    # Dev stack with hot reload
├── railway.toml              # Railway deployment config
└── .env.example              # Environment variable template
```

---

## Quick Start (Local Development)

### Option A: Docker Compose (recommended)

```bash
# 1. Clone / extract the project
cd kinevie

# 2. Start everything (hot reload)
docker compose -f docker-compose.dev.yml up

# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
```

### Option B: Manual

**Prerequisites:** Node.js 20+, PostgreSQL 14+

```bash
# 1. Create a local Postgres database
createdb kinevie

# 2. Backend
cd backend
cp ../.env.example .env
# Edit .env: set DATABASE_URL, JWT_SECRET
npm install
npm run dev     # starts on :3001

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev     # starts on :5173, proxies /api → :3001
```

---

## Deploy on Railway

Railway supports deploying from a GitHub repo with automatic builds.

### Step 1 — Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/kinevie.git
git push -u origin main
```

### Step 2 — Create Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Select **Deploy from GitHub repo** → choose your repo
3. Railway will detect the `Dockerfile` and build automatically

### Step 3 — Add PostgreSQL

1. In your Railway project, click **+ New** → **Database** → **PostgreSQL**
2. Railway will provision a Postgres instance

### Step 4 — Set Environment Variables

In your Railway service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(auto-filled by Railway when you link the DB — click "Add Reference")* |
| `JWT_SECRET` | *(generate: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)* |
| `JWT_EXPIRES_IN` | `7d` |
| `FRONTEND_URL` | *(your Railway app URL, e.g. `https://kinevie.up.railway.app`)* |

### Step 5 — Link the Database

In your app service → **Variables** → click **"Add Reference"** → select the PostgreSQL `DATABASE_URL`. Railway injects it automatically.

### Step 6 — Deploy

Railway will auto-deploy on every push to `main`. The schema is created automatically on first boot.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Full PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Long random string for signing JWTs |
| `NODE_ENV` | ✅ | `production` or `development` |
| `PORT` | | Server port (default: `3001`) |
| `JWT_EXPIRES_IN` | | Token TTL (default: `7d`) |
| `FRONTEND_URL` | | Allowed CORS origin |

---

## API Reference

All endpoints except `/api/auth/*` and `/api/health` require:
```
Authorization: Bearer <JWT_TOKEN>
```

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register new therapist |
| `POST` | `/api/auth/login` | Sign in, returns JWT |
| `GET` | `/api/auth/me` | Get current user info |
| `GET/POST` | `/api/clinics` | List / create clinics |
| `PUT/DELETE` | `/api/clinics/:id` | Update / delete clinic |
| `GET/POST` | `/api/sessions` | List / create sessions |
| `POST` | `/api/sessions/bulk` | Bulk import sessions |
| `PUT/DELETE` | `/api/sessions/:id` | Update / delete session |
| `GET/POST` | `/api/invoices` | List / create invoices |
| `PUT/DELETE` | `/api/invoices/:id` | Update / delete invoice |
| `GET/POST` | `/api/expenses` | List / create expenses |
| `PUT/DELETE` | `/api/expenses/:id` | Update / delete expense |
| `GET/PUT` | `/api/settings` | Get / save SMTP + company info |
| `GET` | `/api/health` | Health check (no auth) |

---

## Database Schema

All tables include `user_id` (foreign key to `users`) so each therapist's data is fully isolated.

- **users** — email, bcrypt password hash, full_name, rmt_number
- **clinics** — name, address, contact, billing_cycle, rates (JSONB)
- **sessions** — clinic, date, duration, session_type, client_initial
- **invoices** — line_items (JSONB), subtotal, tax, status, email_sent
- **expenses** — date, category, amount, notes
- **settings** — smtp config + company info (JSONB), one row per user

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWTs signed with HS256, configurable TTL
- All data routes protected by auth middleware
- Row-level isolation: every query scopes to `user_id`
- Rate limiting on all API routes (500/15min) and auth routes (20/15min)
- Helmet.js for HTTP security headers
- Non-root Docker user in production
