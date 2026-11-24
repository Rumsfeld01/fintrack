from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.transaction import TransactionType


class TransactionCreate(BaseModel):
    instrument: str
    transaction_type: TransactionType
    quantity: Decimal
    unit_price: Decimal
    trade_date: datetime
    notes: Optional[str] = None

    @field_validator("instrument")
    @classmethod
    def instrument_not_empty(cls, v: str) -> str:
        v = v.strip().upper()
        if not v:
            raise ValueError("Instrument cannot be empty")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Quantity must be greater than zero")
        return v

    @field_validator("unit_price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Unit price must be greater than zero")
        return v


class TransactionResponse(BaseModel):
    id: int
    portfolio_id: int
    instrument: str
    transaction_type: TransactionType
    quantity: Decimal
    unit_price: Decimal
    total_value: Decimal
    trade_date: datetime
    notes: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionFilter(BaseModel):
    instrument: Optional[str] = None
    transaction_type: Optional[TransactionType] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    skip: int = 0
    limit: int = 50
