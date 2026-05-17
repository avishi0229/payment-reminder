live app demo: https://payment-reminder-kappa.vercel.app/
# PayRemind

Multi-tenant payment reminder SaaS: small businesses
manage invoices, send Gmail reminders via OAuth,
and track payment status through a clean dashboard.

## Live Demo

- Frontend:  https://payment-reminder-kappa.vercel.app/
- Backend API: https://payment-reminder-cav6.onrender.com

## Features

- Multi-tenant auth — each organization has isolated data
- Invoice tracking with auto-overdue detection
- Send reminder emails from your own Gmail via OAuth
- Bulk send reminders to all pending/overdue invoices
- Dashboard with charts (paid vs unpaid, status mix)
- Search, filter, sort invoices
- CSV export
- Reminder history log
- Responsive UI — desktop and mobile
- Dark mode

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Lucide
- **Backend:** Node.js, Express
- **Database:** SQLite (better-sqlite3, local file)
- **Auth:** JWT + bcrypt
- **Email:** Gmail API via Google OAuth2 (googleapis)

## Prerequisites

- Node.js 18+
- A Google Cloud project with Gmail API enabled
- OAuth 2.0 credentials (Client ID + Client Secret)

## Setup

### 1. Clone and install

cd server && npm install
cd ../client && npm install

### 2. Google OAuth Setup

1. Go to console.cloud.google.com
2. Create a project → Enable Gmail API
3. OAuth consent screen → External → Publish app
4. Credentials → Create OAuth 2.0 Client ID (Web)
5. Add redirect URI: http://localhost:5001/api/auth/gmail/callback
6. Copy Client ID and Client Secret

### 3. Environment variables



Never commit real secrets. .env is gitignored.
See .env.example for reference.

### 4. Run the app

Terminal 1 - Backend:
cd server && node index.js

Terminal 2 - Frontend:
cd client && npm run dev

Open http://localhost:5173

## How to use

### Create Organization
1. Go to / → Create Organization
2. Enter name, email, password, org name
3. Land on dashboard

### Connect Gmail (required for sending reminders)
1. Click "Connect Gmail" banner on dashboard
2. Sign in with Google → Allow
3. Green dot confirms connection
4. Now reminders send from your Gmail to any email

### Send Reminders
- Single: click Remind on any invoice
- Bulk: click "Send All Reminders" on invoices page

## Security

- Passwords: bcrypt hashed, never stored plain text
- Gmail: OAuth tokens stored in DB,
  never returned in API responses
- JWT: signed with JWT_SECRET, expires 7 days
- Every DB query filters by org_id from JWT token
- Users cannot access another org's data
- All secrets in .env, never hardcoded

## API Overview

Public:
- POST /api/auth/register-org
- POST /api/auth/login
- GET  /api/auth/check-code?code=XXXXXX
- GET  /api/auth/gmail/callback

Protected (Bearer token required):
- GET  /api/auth/me
- GET  /api/auth/gmail/connect
- GET  /api/auth/gmail/status
- GET/POST/PATCH/DELETE /api/invoices
- POST /api/invoices/bulk-remind
- GET  /api/invoices/export/csv
- GET  /api/reminders
- GET  /api/dashboard
- GET  /api/clients

## Design Decisions

- SQLite chosen for zero-config local setup within
  time constraints. Easily swappable to PostgreSQL
  via connection string change.
- OAuth over App Passwords removes technical friction
  for non-developer users.
- Platform is multi-tenant from day one — each org's
  data is fully isolated by org_id at query level.

## License

Educational / internship demo.

# payment-reminder
payment reminder app for small buisness

