from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from app.models.portfolio import Portfolio
from app.models.portfolio_holding import PortfolioHolding
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioDetailResponse


def _enrich(portfolio: Portfolio) -> PortfolioDetailResponse:
    total_value = Decimal("0")
    total_invested = Decimal("0")

    for h in portfolio.holdings:
        qty = Decimal(str(h.quantity))
        avg = Decimal(str(h.average_buy_price))
        cost = qty * avg
        # Without a live price feed we use cost as current value for holdings;
        # the /summary endpoint exposes the same breakdown per instrument.
        total_invested += cost
        total_value += cost  # updated when prices change via asset catalogue

    total_gain_loss = total_value - total_invested
    total_gain_loss_pct = (
        (total_gain_loss / total_invested * 100) if total_invested > 0 else Decimal("0")
    )

    return PortfolioDetailResponse(
        id=portfolio.id,
        name=portfolio.name,
        client_name=portfolio.client_name,
        base_currency=portfolio.base_currency,
        description=portfolio.description,
        created_at=portfolio.created_at,
        total_value=total_value,
        total_invested=total_invested,
        total_gain_loss=total_gain_loss,
        total_gain_loss_percent=total_gain_loss_pct,
        holdings_count=len(portfolio.holdings),
    )


def get_portfolios(db: Session, user_id: int) -> list[Portfolio]:
    return (
        db.query(Portfolio)
        .filter(Portfolio.owner_id == user_id)
        .order_by(Portfolio.created_at.desc())
        .all()
    )


def get_portfolio(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    p = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.owner_id == user_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return p


def create_portfolio(db: Session, data: PortfolioCreate, user_id: int) -> Portfolio:
    p = Portfolio(
        name=data.name,
        client_name=data.client_name,
        base_currency=data.base_currency,
        description=data.description,
        owner_id=user_id,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def update_portfolio(db: Session, portfolio_id: int, data: PortfolioUpdate, user_id: int) -> Portfolio:
    p = get_portfolio(db, portfolio_id, user_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(p, field, value)
    db.commit()
    db.refresh(p)
    return p


def delete_portfolio(db: Session, portfolio_id: int, user_id: int) -> None:
    p = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.owner_id == user_id)
        .first()
    )
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    db.delete(p)
    db.commit()


def get_portfolio_summary(db: Session, portfolio_id: int, user_id: int) -> dict:
    """
    GET /api/portfolios/{id}/summary
    Returns per-instrument net quantity, average cost, total invested, total value.
    """
    from app.models.asset import Asset
    from app.schemas.portfolio import HoldingResponse, PortfolioSummaryResponse

    p = get_portfolio(db, portfolio_id, user_id)
    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.portfolio_id == portfolio_id)
        .all()
    )

    holding_responses = []
    total_invested = Decimal("0")
    total_value = Decimal("0")

    for h in holdings:
        qty = Decimal(str(h.quantity))
        avg = Decimal(str(h.average_buy_price))
        invested = qty * avg

        # Try to look up a current price from the Asset catalogue
        asset = db.query(Asset).filter(Asset.symbol == h.instrument).first()
        current_price = Decimal(str(asset.current_price)) if asset else avg
        value = qty * current_price

        gain_loss = value - invested
        gain_loss_pct = (gain_loss / invested * 100) if invested > 0 else Decimal("0")

        total_invested += invested
        total_value += value

        holding_responses.append(
            HoldingResponse(
                instrument=h.instrument,
                quantity=qty,
                average_buy_price=avg,
                total_invested=invested,
                total_value=value,
                gain_loss=gain_loss,
                gain_loss_percent=gain_loss_pct,
            )
        )

    total_gain_loss = total_value - total_invested
    total_gain_loss_pct = (
        (total_gain_loss / total_invested * 100) if total_invested > 0 else Decimal("0")
    )

    return PortfolioSummaryResponse(
        portfolio_id=p.id,
        portfolio_name=p.name,
        client_name=p.client_name,
        base_currency=p.base_currency,
        holdings=holding_responses,
        total_invested=total_invested,
        total_value=total_value,
        total_gain_loss=total_gain_loss,
        total_gain_loss_percent=total_gain_loss_pct,
    )
