# FinTrack by Finnet

A full-stack portfolio and transaction tracking application.

![FinTrack Dashboard](https://via.placeholder.com/1200x630/0f172a/10b981?text=FinTrack+by+Finnet)

## Live Demo

| Resource | URL |
|---|---|
| **Application** | https://fintrack-app.vercel.app |
| **API** | https://fintrack-api.onrender.com |
| **API Docs (Swagger)** | https://fintrack-api.onrender.com/docs |
| **API Docs (ReDoc)** | https://fintrack-api.onrender.com/redoc |

### Demo credentials
```
Email:    demo@fintrack.io
Password: Demo1234!
```

---

## Features

- **Dashboard** — total portfolio value, gain/loss, 30-day performance chart, asset allocation pie chart
- **Portfolios** — create and manage multiple portfolios; per-portfolio holdings with live P&L
- **Transactions** — record BUY/SELL transactions; holdings and weighted average cost update automatically
- **Assets** — browse and add trackable assets across stocks, crypto, ETFs, bonds, and more
- **Authentication** — JWT-based login/register, Argon2 password hashing, protected routes
- **API documentation** — interactive Swagger UI at `/docs`, ReDoc at `/redoc`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS v4, Recharts |
| Backend | FastAPI, Python 3.11, SQLAlchemy 2, Alembic |
| Database | PostgreSQL |
| Auth | JWT (python-jose), Argon2 (passlib) |
| Deployment | Vercel (frontend), Render (backend), Supabase (database) |

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Docker)

### Quick start with Docker

```bash
git clone https://github.com/your-username/fintrack.git
cd fintrack
docker-compose up --build
```

Then open:
- Frontend: http://localhost:5173
- API Docs: http://localhost:8000/docs

### Manual setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL to your PostgreSQL instance

# Run migrations
alembic upgrade head

# Seed demo data
python seed.py

# Start the API server
uvicorn app.main:app --reload
# → http://localhost:8000
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
# → http://localhost:5173
```

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Tests use SQLite in-memory — no PostgreSQL instance required.

---

## Project Structure

```
fintrack/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # Route handlers
│   │   ├── core/               # Config, JWT, security
│   │   ├── models/             # SQLAlchemy models
│   │   ├── schemas/            # Pydantic schemas
│   │   ├── services/           # Business logic
│   │   ├── db/                 # Database session
│   │   └── main.py             # FastAPI app
│   ├── alembic/                # Migrations
│   ├── tests/                  # Pytest test suite
│   ├── seed.py                 # Demo data seeder
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Layout, UI, charts
│   │   ├── context/            # AuthContext
│   │   ├── pages/              # Route pages
│   │   ├── services/           # API client wrappers
│   │   ├── types/              # TypeScript interfaces
│   │   └── utils/              # Formatting helpers
│   └── package.json
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   └── deployment.md
│
├── docker-compose.yml
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, receive JWT |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/portfolios` | List portfolios |
| POST | `/api/v1/portfolios` | Create portfolio |
| GET | `/api/v1/portfolios/{id}` | Portfolio with holdings |
| PATCH | `/api/v1/portfolios/{id}` | Update portfolio |
| DELETE | `/api/v1/portfolios/{id}` | Delete portfolio |
| GET | `/api/v1/transactions` | List transactions (filterable) |
| POST | `/api/v1/transactions` | Record BUY/SELL |
| DELETE | `/api/v1/transactions/{id}` | Delete transaction |
| GET | `/api/v1/assets` | List assets |
| POST | `/api/v1/assets` | Add asset |
| PATCH | `/api/v1/assets/{id}` | Update asset price |
| GET | `/api/v1/analytics/dashboard` | Dashboard metrics |

Full interactive documentation: `/docs` (Swagger UI) · `/redoc` (ReDoc)

---

## Deployment

See [docs/deployment.md](docs/deployment.md) for step-by-step instructions for Vercel + Render + Supabase.
