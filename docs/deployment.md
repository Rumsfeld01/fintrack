# Deployment Guide

## Stack

| Component | Platform | Notes |
|---|---|---|
| React frontend | Vercel | Auto-deploy from GitHub |
| FastAPI backend | Render | Web Service, free tier |
| PostgreSQL | Supabase | Free tier, 500 MB |
| Source code | GitHub | |

---

## 1. Database — Supabase ✅

Project: `licwrbfuduclepwchmff` (eu-west-1 region)
Pooler URL: `postgresql://postgres.licwrbfuduclepwchmff:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require`

Tables migrated and demo data seeded.

---

## 2. Backend — Render ✅

Live URL: **https://fintrack-api-xney.onrender.com**
API Docs: **https://fintrack-api-xney.onrender.com/docs**

Service config (already deployed):
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

---

## 3. Frontend — Vercel ✅

Live URL: **https://fintrack-ui-neon.vercel.app**

Deployed from `frontend/` with:
- `VITE_API_URL` = `https://fintrack-api-xney.onrender.com/api/v1`

---

## 4. Demo account

The seed script (`backend/seed.py`) creates the demo account automatically on first start:

| Field | Value |
|---|---|
| Email | `demo@fintrack.io` |
| Password | `Demo1234!` |

The seed is idempotent — running it again clears and re-seeds only the demo user's data.

---

## Environment variable reference

### Backend
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection URI |
| `SECRET_KEY` | Yes | JWT signing secret (32+ chars) |
| `ALGORITHM` | No | JWT algorithm, default `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | Token lifetime, default `30` |
| `ENVIRONMENT` | No | `development` or `production` |
| `ALLOWED_ORIGINS` | Yes | Comma-separated CORS origins |

### Frontend
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend API base URL |

---

## Local development with Docker

```bash
# Start all services
docker-compose up --build

# Frontend:  http://localhost:5173
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```
