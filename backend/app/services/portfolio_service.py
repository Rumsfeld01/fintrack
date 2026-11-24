from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from decimal import Decimal
from app.models.portfolio import Portfolio
from app.models.portfolio_holding import PortfolioHolding
from app.models.asset import Asset
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate


def _calculate_holding_metrics(holding: PortfolioHolding) -> dict:
    qty = Decimal(str(holding.quantity))
    avg_buy = Decimal(str(holding.average_buy_price))
    current_price = Decimal(str(holding.asset.current_price))

    current_value = qty * current_price
    cost_basis = qty * avg_buy
    gain_loss = current_value - cost_basis
    gain_loss_percent = (
        (gain_loss / cost_basis * 100) if cost_basis > 0 else Decimal("0")
    )

    return {
        "current_value": current_value,
        "cost_basis": cost_basis,
        "gain_loss": gain_loss,
        "gain_loss_percent": gain_loss_percent,
    }


def _enrich_portfolio(portfolio: Portfolio) -> Portfolio:
    total_value = Decimal("0")
    total_invested = Decimal("0")

    enriched_holdings = []
    for h in portfolio.holdings:
        metrics = _calculate_holding_metrics(h)
        h.current_value = metrics["current_value"]
        h.cost_basis = metrics["cost_basis"]
        h.gain_loss = metrics["gain_loss"]
        h.gain_loss_percent = metrics["gain_loss_percent"]
        total_value += metrics["current_value"]
        total_invested += metrics["cost_basis"]
        enriched_holdings.append(h)

    portfolio.holdings = enriched_holdings
    portfolio.total_value = total_value
    portfolio.total_invested = total_invested
    portfolio.total_gain_loss = total_value - total_invested
    portfolio.total_gain_loss_percent = (
        ((total_value - total_invested) / total_invested * 100)
        if total_invested > 0
        else Decimal("0")
    )
    return portfolio


def get_portfolios(db: Session, user_id: int) -> list[Portfolio]:
    portfolios = (
        db.query(Portfolio)
        .options(
            joinedload(Portfolio.holdings).joinedload(PortfolioHolding.asset)
        )
        .filter(Portfolio.owner_id == user_id)
        .all()
    )
    return [_enrich_portfolio(p) for p in portfolios]


def get_portfolio(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    portfolio = (
        db.query(Portfolio)
        .options(
            joinedload(Portfolio.holdings).joinedload(PortfolioHolding.asset)
        )
        .filter(Portfolio.id == portfolio_id, Portfolio.owner_id == user_id)
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return _enrich_portfolio(portfolio)


def create_portfolio(db: Session, data: PortfolioCreate, user_id: int) -> Portfolio:
    portfolio = Portfolio(name=data.name, description=data.description, owner_id=user_id)
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    portfolio.holdings = []
    return _enrich_portfolio(portfolio)


def update_portfolio(db: Session, portfolio_id: int, data: PortfolioUpdate, user_id: int) -> Portfolio:
    portfolio = get_portfolio(db, portfolio_id, user_id)
    if data.name is not None:
        portfolio.name = data.name
    if data.description is not None:
        portfolio.description = data.description
    db.commit()
    db.refresh(portfolio)
    return get_portfolio(db, portfolio_id, user_id)


def delete_portfolio(db: Session, portfolio_id: int, user_id: int) -> None:
    portfolio = (
        db.query(Portfolio)
        .filter(Portfolio.id == portfolio_id, Portfolio.owner_id == user_id)
        .first()
    )
    if not portfolio:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    db.delete(portfolio)
    db.commit()
