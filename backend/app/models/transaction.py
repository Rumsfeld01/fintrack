from sqlalchemy import Column, Integer, Numeric, String, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class TransactionType(str, enum.Enum):
    BUY = "BUY"
    SELL = "SELL"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    portfolio_id = Column(Integer, ForeignKey("portfolios.id"), nullable=False)
    instrument = Column(String(50), nullable=False)   # e.g. SCOM, KCB, T-BILL-91
    transaction_type = Column(Enum(TransactionType), nullable=False)
    quantity = Column(Numeric(18, 8), nullable=False)
    unit_price = Column(Numeric(18, 6), nullable=False)
    total_value = Column(Numeric(18, 6), nullable=False)
    trade_date = Column(DateTime(timezone=True), nullable=False)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    portfolio = relationship("Portfolio", back_populates="transactions")
