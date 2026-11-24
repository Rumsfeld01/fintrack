from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from decimal import Decimal
from app.models.transaction import Transaction, TransactionType
from app.models.portfolio import Portfolio
from app.models.portfolio_holding import PortfolioHolding
from app.schemas.transaction import TransactionCreate, TransactionFilter


def _verify_ownership(db: Session, portfolio_id: int, user_id: int) -> Portfolio:
    p = db.query(Portfolio).filter(
        Portfolio.id == portfolio_id, Portfolio.owner_id == user_id
    ).first()
    if not p:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Portfolio not found")
    return p


def create_transaction(
    db: Session, portfolio_id: int, data: TransactionCreate, user_id: int
) -> Transaction:
    _verify_ownership(db, portfolio_id, user_id)

    qty = Decimal(str(data.quantity))
    price = Decimal(str(data.unit_price))
    total = qty * price

    # Retrieve or create holding
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.portfolio_id == portfolio_id,
        PortfolioHolding.instrument == data.instrument,
    ).first()

    if data.transaction_type == TransactionType.BUY:
        if holding:
            old_qty = Decimal(str(holding.quantity))
            old_avg = Decimal(str(holding.average_buy_price))
            new_qty = old_qty + qty
            holding.average_buy_price = (old_qty * old_avg + qty * price) / new_qty
            holding.quantity = new_qty
        else:
            holding = PortfolioHolding(
                portfolio_id=portfolio_id,
                instrument=data.instrument,
                quantity=qty,
                average_buy_price=price,
            )
            db.add(holding)

    elif data.transaction_type == TransactionType.SELL:
        held_qty = Decimal(str(holding.quantity)) if holding else Decimal("0")
        if not holding or held_qty < qty:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient holdings for {data.instrument}. "
                       f"Held: {held_qty}, requested: {qty}",
            )
        holding.quantity = held_qty - qty
        if holding.quantity <= 0:
            db.delete(holding)

    txn = Transaction(
        portfolio_id=portfolio_id,
        instrument=data.instrument,
        transaction_type=data.transaction_type,
        quantity=qty,
        unit_price=price,
        total_value=total,
        trade_date=data.trade_date,
        notes=data.notes,
    )
    db.add(txn)
    db.commit()
    db.refresh(txn)
    return txn


def get_transactions(
    db: Session, portfolio_id: int, user_id: int, filters: TransactionFilter
) -> list[Transaction]:
    _verify_ownership(db, portfolio_id, user_id)

    query = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id)

    if filters.instrument:
        query = query.filter(Transaction.instrument == filters.instrument.upper())
    if filters.transaction_type:
        query = query.filter(Transaction.transaction_type == filters.transaction_type)
    if filters.date_from:
        query = query.filter(Transaction.trade_date >= filters.date_from)
    if filters.date_to:
        query = query.filter(Transaction.trade_date <= filters.date_to)

    return (
        query.order_by(Transaction.trade_date.desc())
        .offset(filters.skip)
        .limit(filters.limit)
        .all()
    )


def delete_transaction(db: Session, transaction_id: int, user_id: int) -> None:
    txn = (
        db.query(Transaction)
        .join(Portfolio, Transaction.portfolio_id == Portfolio.id)
        .filter(Transaction.id == transaction_id, Portfolio.owner_id == user_id)
        .first()
    )
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    # Reverse the holding impact
    holding = db.query(PortfolioHolding).filter(
        PortfolioHolding.portfolio_id == txn.portfolio_id,
        PortfolioHolding.instrument == txn.instrument,
    ).first()

    qty = Decimal(str(txn.quantity))

    if txn.transaction_type == TransactionType.BUY:
        if holding:
            new_qty = Decimal(str(holding.quantity)) - qty
            if new_qty <= 0:
                db.delete(holding)
            else:
                holding.quantity = new_qty
    elif txn.transaction_type == TransactionType.SELL:
        if holding:
            holding.quantity = Decimal(str(holding.quantity)) + qty
        else:
            holding = PortfolioHolding(
                portfolio_id=txn.portfolio_id,
                instrument=txn.instrument,
                quantity=qty,
                average_buy_price=Decimal(str(txn.unit_price)),
            )
            db.add(holding)

    db.delete(txn)
    db.commit()
