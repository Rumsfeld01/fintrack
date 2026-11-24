# Database Schema

FinTrack uses PostgreSQL with SQLAlchemy ORM and Alembic for migrations.

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| email | VARCHAR UNIQUE | Indexed |
| full_name | VARCHAR | |
| hashed_password | VARCHAR | Argon2 hash |
| is_active | BOOLEAN | Default true |
| is_demo | BOOLEAN | Marks the demo account |
| created_at | TIMESTAMPTZ | Server default |
| updated_at | TIMESTAMPTZ | Auto-updated |

### assets
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| symbol | VARCHAR(20) UNIQUE | Indexed, uppercased |
| name | VARCHAR(255) | |
| category | ENUM | STOCK, BOND, CRYPTO, CASH, ETF, REAL_ESTATE, COMMODITY, OTHER |
| current_price | NUMERIC(18,6) | |
| currency | VARCHAR(3) | Default USD |
| description | VARCHAR(500) | Nullable |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### portfolios
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(255) | |
| description | VARCHAR(500) | Nullable |
| owner_id | INT FK → users.id | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

### portfolio_holdings
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| portfolio_id | INT FK → portfolios.id | |
| asset_id | INT FK → assets.id | |
| quantity | NUMERIC(18,8) | |
| average_buy_price | NUMERIC(18,6) | Weighted average cost |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |
| — | UNIQUE(portfolio_id, asset_id) | One row per asset per portfolio |

### transactions
| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| portfolio_id | INT FK → portfolios.id | |
| asset_id | INT FK → assets.id | |
| transaction_type | ENUM | BUY or SELL |
| quantity | NUMERIC(18,8) | |
| price | NUMERIC(18,6) | Price per unit at time of transaction |
| total_value | NUMERIC(18,6) | quantity × price |
| notes | VARCHAR(500) | Nullable |
| transacted_at | TIMESTAMPTZ | User-supplied date |
| created_at | TIMESTAMPTZ | Record creation date |

## Relationships

```
users ──< portfolios ──< portfolio_holdings >── assets
                    ──< transactions       >── assets
```

## Running migrations

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Create a new migration after model changes
alembic revision --autogenerate -m "describe the change"

# Roll back one step
alembic downgrade -1
```
