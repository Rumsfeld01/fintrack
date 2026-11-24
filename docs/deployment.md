# Deployment Guide

## Stack

| Component | Platform | Notes |
|---|---|---|
| React frontend | Vercel | Auto-deploy from GitHub |
| FastAPI backend | Render | Web Service, free tier |
| PostgreSQL | Supabase | Free tier, 500 MB |
| Source code | GitHub | |

---

## 1. Database — Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string (URI format)
3. It looks like: `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`
4. Save it — you'll need it for the backend environment variable `DATABASE_URL`

---

## 2. Backend — Render

1. Push the repository to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo; set **Root Directory** to `backend`
4. Configure:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && python seed.py && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables:

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | Your Supabase connection string |
   | `SECRET_KEY` | A long random string (32+ chars) |
   | `ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `ENVIRONMENT` | `production` |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` |

6. Deploy. After it starts, visit `https://your-service.onrender.com/docs` to confirm the API is live.

---

## 3. Frontend — Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo
2. Set **Root Directory** to `frontend`
3. Add environment variable:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://your-service.onrender.com/api/v1` |

4. Deploy. Vercel handles the build command (`npm run build`) and serves the dist automatically.
5. The `vercel.json` already configures SPA rewrites so deep links work.

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
