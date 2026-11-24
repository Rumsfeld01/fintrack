from fastapi import APIRouter
from app.api.v1.endpoints import auth, assets, portfolios, transactions, analytics

api_router = APIRouter()

# Authentication
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Asset catalogue (optional supplement to instrument strings)
api_router.include_router(assets.router, prefix="/assets", tags=["Assets"])

# Portfolios — includes nested /portfolios/{id}/transactions and /portfolios/{id}/summary
api_router.include_router(portfolios.router, prefix="/portfolios", tags=["Portfolios"])

# Standalone transaction delete: DELETE /transactions/{id}
api_router.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])

# Analytics dashboard
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
