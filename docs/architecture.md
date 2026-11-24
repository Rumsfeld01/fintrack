# FinTrack Architecture

## Overview

FinTrack is a full-stack portfolio tracking application built as a REST API backend paired with a React single-page application frontend.

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          React SPA (Vite + TypeScript)               │   │
│  │                                                      │   │
│  │  AuthContext → Protected Routes → Pages              │   │
│  │  Axios API Client (JWT Bearer token)                 │   │
│  └──────────────────────┬──────────────────────────────┘   │
└─────────────────────────┼───────────────────────────────────┘
                          │ HTTPS REST
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend (Python)                  │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │   Auth   │  │   Portfolio  │  │     Transaction       │ │
│  │  /auth/* │  │ /portfolios/*│  │   /transactions/*     │ │
│  └────┬─────┘  └──────┬──��────┘  └──────────┬────────────┘ │
│       │               │                      │              │
│  ┌────▼───────────────▼──────────────────────▼────────────┐ │
│  │               Service Layer                             │ │
│  │  auth_service  portfolio_service  transaction_service   │ │
│  │  analytics_service                                      │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │ SQLAlchemy ORM                   │
│  ┌────────────────────────▼───────────────────────────────┐ │
│  │                    PostgreSQL                           │ │
│  │  users  assets  portfolios  portfolio_holdings         │ │
│  │  transactions                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Key design decisions

**Layered backend**: Routes → Services → Models. No business logic lives in route handlers.

**JWT stateless auth**: Tokens are signed with HS256. No server-side session storage is needed. The frontend stores the token in `localStorage` and sends it as a `Bearer` header on every request.

**Argon2 password hashing**: Industry standard for new applications; resistant to GPU and ASIC attacks.

**Weighted average cost**: When a BUY transaction is recorded, the holding's average cost recalculates as `(old_qty × old_avg + new_qty × new_price) / total_qty`. This matches how brokerages typically report cost basis.

**Cascading deletes**: Deleting a portfolio removes all holdings and transactions for that portfolio via SQLAlchemy `cascade="all, delete-orphan"`.

**Decimal arithmetic**: All monetary calculations use Python's `Decimal` type (not float) to avoid floating-point rounding errors.

## Component responsibilities

| Layer | Responsibility |
|---|---|
| `app/api/v1/endpoints/` | HTTP request/response handling, input validation via Pydantic |
| `app/services/` | Business logic: auth, portfolio valuation, transaction processing, analytics |
| `app/models/` | SQLAlchemy ORM table definitions |
| `app/schemas/` | Pydantic request/response models |
| `app/core/` | Config (pydantic-settings), JWT, password hashing |
| `app/db/` | SQLAlchemy engine, session factory, `get_db` dependency |
