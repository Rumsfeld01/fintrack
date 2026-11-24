from sqlalchemy.orm import Session
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from collections import defaultdict
from app.models.portfolio import Portfolio
from app.models.portfolio_holding import PortfolioHolding
from app.models.transaction import Transaction, TransactionType
from app.models.asset import Asset
from app.schemas.analytics import DashboardSummary, AllocationItem, PerformancePoint


def get_dashboard_summary(db: Session, user_id: int) -> DashboardSummary:
    portfolios = (
        db.query(Portfolio)
        .filter(Portfolio.owner_id == user_id)
        .all()
    )

    portfolio_ids = [p.id for p in portfolios]
    if not portfolio_ids:
        return DashboardSummary(
            total_portfolio_value=Decimal("0"),
            total_invested=Decimal("0"),
            total_gain_loss=Decimal("0"),
            total_gain_loss_percent=Decimal("0"),
            portfolio_count=0,
            holdings_count=0,
            allocation=[],
            recent_performance=[],
        )

    holdings = (
        db.query(PortfolioHolding)
        .filter(PortfolioHolding.portfolio_id.in_(portfolio_ids))
        .all()
    )

    total_value = Decimal("0")
    total_invested = Decimal("0")
    instrument_values: dict[str, Decimal] = defaultdict(Decimal)

    for h in holdings:
        qty = Decimal(str(h.quantity))
        avg = Decimal(str(h.average_buy_price))
        invested = qty * avg

        # Look up current price if available
        asset = db.query(Asset).filter(Asset.symbol == h.instrument).first()
        current_price = Decimal(str(asset.current_price)) if asset else avg
        value = qty * current_price

        total_value += value
        total_invested += invested
        instrument_values[h.instrument] += value

    total_gain_loss = total_value - total_invested
    total_gain_loss_pct = (
        (total_gain_loss / total_invested * 100) if total_invested > 0 else Decimal("0")
    )

    allocation = [
        AllocationItem(
            category=instrument,
            value=value,
            percentage=(value / total_value * 100) if total_value > 0 else Decimal("0"),
        )
        for instrument, value in instrument_values.items()
    ]

    recent_performance = _build_performance_series(db, portfolio_ids)

    return DashboardSummary(
        total_portfolio_value=total_value,
        total_invested=total_invested,
        total_gain_loss=total_gain_loss,
        total_gain_loss_percent=total_gain_loss_pct,
        portfolio_count=len(portfolios),
        holdings_count=len(holdings),
        allocation=allocation,
        recent_performance=recent_performance,
    )


def _build_performance_series(db: Session, portfolio_ids: list[int]) -> list[PerformancePoint]:
    transactions = (
        db.query(Transaction)
        .filter(Transaction.portfolio_id.in_(portfolio_ids))
        .order_by(Transaction.trade_date.asc())
        .all()
    )

    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=29)
    daily: dict = defaultdict(Decimal)

    for txn in transactions:
        date = txn.trade_date.date()
        val = Decimal(str(txn.total_value))
        if txn.transaction_type == TransactionType.BUY:
            daily[date] += val
        else:
            daily[date] -= val

    running = Decimal("0")
    for date, delta in sorted(daily.items()):
        if date < start:
            running += delta

    points = []
    for i in range(30):
        date = start + timedelta(days=i)
        running += daily.get(date, Decimal("0"))
        points.append(PerformancePoint(date=date.isoformat(), value=max(running, Decimal("0"))))

    return points
