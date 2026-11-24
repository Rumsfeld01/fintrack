from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.db.base import get_db
from app.schemas.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    PortfolioResponse,
    PortfolioDetailResponse,
    PortfolioSummaryResponse,
)
from app.schemas.transaction import TransactionCreate, TransactionResponse, TransactionFilter
from app.models.transaction import TransactionType
from app.services import portfolio_service, transaction_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()


# ── Portfolio CRUD ──────────────────────────────────────────────────────────

@router.get("", response_model=List[PortfolioResponse], summary="List all portfolios")
def list_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.get_portfolios(db, current_user.id)


@router.post(
    "",
    response_model=PortfolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new portfolio",
)
def create_portfolio(
    data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a portfolio.

    - **name**: portfolio label (e.g. "Acme Pension Fund")
    - **client_name**: the investment client's name
    - **base_currency**: `KES` or `USD`
    """
    return portfolio_service.create_portfolio(db, data, current_user.id)


@router.get("/{portfolio_id}", response_model=PortfolioResponse, summary="Get a portfolio")
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.get_portfolio(db, portfolio_id, current_user.id)


@router.put("/{portfolio_id}", response_model=PortfolioResponse, summary="Update a portfolio")
def update_portfolio(
    portfolio_id: int,
    data: PortfolioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.update_portfolio(db, portfolio_id, data, current_user.id)


@router.delete(
    "/{portfolio_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a portfolio and all its data",
)
def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio_service.delete_portfolio(db, portfolio_id, current_user.id)


# ── Holdings summary ────────────────────────────────────────────────────────

@router.get(
    "/{portfolio_id}/summary",
    response_model=PortfolioSummaryResponse,
    summary="Per-instrument holdings summary",
)
def get_summary(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns per-instrument:
    - net quantity, average cost, total invested, total value
    - gain/loss and percentage return

    Prices are sourced from the asset catalogue where available; otherwise cost is used.
    """
    return portfolio_service.get_portfolio_summary(db, portfolio_id, current_user.id)


# ── Nested transactions ─────────────────────────────────────────────────────

@router.get(
    "/{portfolio_id}/transactions",
    response_model=List[TransactionResponse],
    summary="List transactions for a portfolio",
)
def list_transactions(
    portfolio_id: int,
    instrument: Optional[str] = Query(None, description="Filter by instrument symbol"),
    transaction_type: Optional[TransactionType] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    filters = TransactionFilter(
        instrument=instrument,
        transaction_type=transaction_type,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )
    return transaction_service.get_transactions(db, portfolio_id, current_user.id, filters)


@router.post(
    "/{portfolio_id}/transactions",
    response_model=TransactionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Record a BUY or SELL transaction",
)
def create_transaction(
    portfolio_id: int,
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record a transaction.

    - **BUY**: increases net holding; recalculates weighted average cost
    - **SELL**: reduces net holding; rejected with 400 if quantity exceeds current holding
    - **instrument**: e.g. `SCOM`, `KCB`, `EQTY`, `T-BILL-91`
    """
    return transaction_service.create_transaction(db, portfolio_id, data, current_user.id)
