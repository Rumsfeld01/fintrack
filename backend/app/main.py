from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="FinTrack API",
    description="""
## FinTrack — Portfolio & Transaction Tracker by Finnet

FinTrack is a full-featured investment portfolio management API. Track assets across multiple
portfolios, record BUY/SELL transactions, and retrieve aggregated analytics.

### Authentication
All endpoints (except `/auth/register` and `/auth/login`) require a **Bearer token**.
Obtain a token via `POST /api/v1/auth/login`, then include it in the `Authorization` header:
```
Authorization: Bearer <token>
```

### Demo Account
- **Email:** demo@fintrack.io
- **Password:** Demo1234!
    """,
    version="1.0.0",
    contact={
        "name": "Finnet Engineering",
        "url": "https://finnet.io",
        "email": "dev@finnet.io",
    },
    license_info={"name": "MIT"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["Health"], summary="Health check")
def root():
    return {"status": "ok", "service": "FinTrack API", "version": "1.0.0"}


@app.get("/health", tags=["Health"], summary="Detailed health check")
def health():
    return {"status": "healthy", "service": "FinTrack API"}
