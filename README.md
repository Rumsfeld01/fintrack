# FinTrack by Finnet Technologies

A full-stack portfolio and transactions tracker for investment analysts.

> **AI tool disclosure**: This project was built using Kiro (Finnet's AI coding assistant) as an accelerator. All architecture decisions, code structure, and business logic choices were made and reviewed by the developer. Per the assessment rules, every line can be explained.

---

## Live Demo

| Resource | URL |
|---|---|
| **Application** | https://fintrack-ui-neon.vercel.app |
| **API** | https://fintrack-api-xney.onrender.com |
| **API Docs (Swagger UI)** | https://fintrack-api-xney.onrender.com/docs |
| **API Docs (ReDoc)** | https://fintrack-api-xney.onrender.com/redoc |
| **GitHub Repository** | https://github.com/Rumsfeld01/fintrack |

### Demo credentials
```
Email:    demo@fintrack.io
Password: Demo1234!
```
Pre-seeded with two portfolios (NSE Equity Portfolio + Fixed Income Portfolio) for Acme Pension Fund — NSE equities (SCOM, KCB, EQTY, COOP, BAMB, EABL) and Treasury instruments (T-BILL-91, T-BILL-182, T-BOND-10).

---

## Features

### Backend API
- `POST /api/v1/auth/register` — register analyst, returns JWT
- `POST /api/v1/auth/login` — authenticate, returns JWT
- `GET /api/v1/auth/me` — current user profile
- `GET/POST /api/v1/portfolios` — list and create portfolios (with client name and base currency KES/USD)
- `GET/PUT/DELETE /api/v1/portfolios/{id}` — full CRUD
- `GET /api/v1/portfolios/{id}/summary` — per-instrument net quantity, average cost, total invested, total value
- `GET/POST /api/v1/portfolios/{id}/transactions` — nested transaction list and create
- `DELETE /api/v1/transactions/{id}` — delete and reverse holding impact
- `GET /api/v1/analytics/dashboard` — aggregated metrics and 30-day performance series

### Frontend
- Login/register with form validation and error states
- Portfolio list with create, edit, delete and confirmation dialogs
- Portfolio detail: sortable/filterable transaction table, holdings summary, inline add-transaction form
- Allocation donut chart (per instrument) and 30-day performance line chart
- Loading, empty, and error states on every API call
- CSV export of transaction history
- Responsive layout (desktop + 375px mobile)
- Currency-aware formatting: KES 1,250,000.00 / USD 1,250.00, right-aligned numbers

---

## Architecture

```
React SPA (Vite + TypeScript)
  └── Axios API client (Bearer JWT)
        └── FastAPI backend (/api/v1/*)
              ├── Auth service (Argon2 + JWT)
              ├── Portfolio service (CRUD + summary computation)
              ├── Transaction service (BUY/SELL with holding reconciliation)
              ├── Analytics service (dashboard aggregation)
              └── SQLAlchemy ORM
                    └── PostgreSQL
```

**Key design decisions:**
- Transactions are **nested under portfolios** (`/portfolios/{id}/transactions`) for clear ownership and simpler queries
- **Instrument** is a plain string field (e.g. `SCOM`, `T-BILL-91`), not a FK to an asset catalogue — keeps transaction entry fast and matches how analysts think
- Holdings are maintained as a **running aggregate** updated on every BUY/SELL, so the summary endpoint is a simple read
- **Weighted average cost** recalculates on each BUY: `(old_qty × old_avg + new_qty × new_price) / total_qty`
- All monetary arithmetic uses Python `Decimal` to avoid floating-point errors
- Cascading deletes on portfolio → holdings and transactions

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | React 18, TypeScript, Vite | Type safety, fast HMR, familiar ecosystem |
| Styling | Tailwind CSS v4 | Utility-first keeps design tokens in one place |
| Charts | Recharts | Lightweight, composable, good TypeScript support |
| Backend | FastAPI, Python 3.11 | Auto OpenAPI docs, async-ready, Pydantic validation |
| ORM | SQLAlchemy 2 + Alembic | Mature, explicit, Alembic for schema migrations |
| Database | PostgreSQL | Production-grade, ACID, good Decimal support |
| Auth | python-jose (JWT) + passlib (Argon2) | Industry-standard hashing resistant to GPU attacks |
| Deployment | Vercel + Render + Supabase | Free tier, one-click deploys, managed Postgres |

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Docker)

### Docker (quickest)
```bash
git clone https://github.com/your-username/fintrack.git
cd fintrack
docker-compose up --build
# Frontend → http://localhost:5173
# API Docs  → http://localhost:8000/docs
```

### Manual

#### Backend
```bash
cd backend

python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL instance

alembic upgrade head
python seed.py                 # Creates demo account + sample data

uvicorn app.main:app --reload  # → http://localhost:8000
```

#### Frontend
```bash
cd frontend
npm install

cp .env.example .env.local
# Edit .env.local — VITE_API_URL=http://localhost:8000/api/v1

npm run dev                    # → http://localhost:5173
```

---

## Running Tests

```bash
cd backend
pytest tests/ -v
# 27 tests — no PostgreSQL required (SQLite in-memory)
```

Test coverage:
- Auth: register, duplicate email, weak password, login, wrong password, JWT decode
- Portfolios: CRUD, client name, currency, 404, auth guard, empty summary
- Transactions: BUY, BUY→SELL, oversell rejection, zero qty, negative price, filters, delete, holdings summary update

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | — | Register new analyst |
| POST | `/api/v1/auth/login` | — | Login, receive JWT |
| GET | `/api/v1/auth/me` | ✓ | Current user |
| GET | `/api/v1/portfolios` | ✓ | List all portfolios |
| POST | `/api/v1/portfolios` | ✓ | Create portfolio |
| GET | `/api/v1/portfolios/{id}` | ✓ | Get portfolio |
| PUT | `/api/v1/portfolios/{id}` | ✓ | Update portfolio |
| DELETE | `/api/v1/portfolios/{id}` | ✓ | Delete (cascades) |
| GET | `/api/v1/portfolios/{id}/summary` | ✓ | Holdings summary |
| GET | `/api/v1/portfolios/{id}/transactions` | ✓ | List transactions (filterable) |
| POST | `/api/v1/portfolios/{id}/transactions` | ✓ | Record BUY or SELL |
| DELETE | `/api/v1/transactions/{id}` | ✓ | Delete + reverse holding |
| GET | `/api/v1/analytics/dashboard` | ✓ | Aggregated metrics |

Full interactive docs: `GET /docs` (Swagger UI) · `GET /redoc` (ReDoc)

---

## Environment Variables

### Backend (`.env`)
| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | `postgresql://user:pass@host:5432/db` |
| `SECRET_KEY` | Yes | — | JWT signing secret (32+ characters) |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | Token lifetime |
| `ENVIRONMENT` | No | `development` | `development` or `production` |
| `ALLOWED_ORIGINS` | Yes | — | Comma-separated CORS origins |

### Frontend (`.env.local`)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for Render + Vercel + Supabase step-by-step.

Secrets are configured via platform environment variables — **never committed to the repo**.
CORS is restricted to `https://fintrack-ui-neon.vercel.app`.

---

## Assumptions

- An **analyst** manages multiple client portfolios; each portfolio belongs to one analyst
- **Instrument** is a free-form string (NSE tickers, T-Bill codes, etc.) rather than a normalised FK — this matches real analyst workflow where the instrument universe is too large to maintain as a catalogue
- Holdings are maintained as a **running aggregate** rather than computed on-the-fly to keep summary reads fast
- Current prices in the holdings summary come from the optional asset catalogue; if no catalogue entry exists for an instrument, cost is used as the current value
- Base currency (KES/USD) is stored on the portfolio and used for display formatting only — no FX conversion is performed

## Trade-offs

| Decision | Trade-off |
|---|---|
| Instrument as string | Faster entry and simpler schema; at the cost of no normalisation or price feed per instrument |
| Running aggregate for holdings | O(1) summary reads; at the cost of needing to reverse-calculate on transaction delete |
| SQLite for tests | No separate test database needed; at the cost of some PostgreSQL-specific features not being tested |
| Single-bundle JS (no code splitting) | Simpler build; bundle is ~746 KB minified (213 KB gzip) — acceptable for an internal tool |

## Next Steps

- [ ] Live price feed integration (NSE API or Yahoo Finance) to show real-time P&L
- [ ] Pagination on transaction list for portfolios with 1000+ transactions
- [ ] CSV export from the API layer, not just the frontend
- [ ] Role-based access: read-only analyst vs. portfolio manager
- [ ] Audit log for transaction modifications
- [ ] CI/CD pipeline with GitHub Actions
- [ ] Multi-currency support with FX rate conversion
