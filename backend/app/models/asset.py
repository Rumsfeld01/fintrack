from sqlalchemy import Column, Integer, String, Numeric, DateTime, Enum
from sqlalchemy.sql import func
import enum
from app.db.base import Base


class AssetCategory(str, enum.Enum):
    STOCK = "STOCK"
    BOND = "BOND"
    CRYPTO = "CRYPTO"
    CASH = "CASH"
    ETF = "ETF"
    REAL_ESTATE = "REAL_ESTATE"
    COMMODITY = "COMMODITY"
    OTHER = "OTHER"


class Asset(Base):
    """
    Optional asset catalogue. Used to look up current prices for holdings summary.
    The core transaction flow uses an `instrument` string (e.g. SCOM, KCB, T-BILL-91)
    rather than a FK to this table, keeping the entry flow simple.
    """
    __tablename__ = "assets"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String(20), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(Enum(AssetCategory), nullable=False, default=AssetCategory.STOCK)
    current_price = Column(Numeric(18, 6), nullable=False, default=0)
    currency = Column(String(3), default="KES")
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
