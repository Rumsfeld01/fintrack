from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.models.portfolio import BaseCurrency


class PortfolioCreate(BaseModel):
    name: str
    client_name: str
    base_currency: BaseCurrency = BaseCurrency.KES
    description: Optional[str] = None

    @field_validator("name", "client_name")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    client_name: Optional[str] = None
    base_currency: Optional[BaseCurrency] = None
    description: Optional[str] = None


class HoldingResponse(BaseModel):
    instrument: str
    quantity: Decimal
    average_buy_price: Decimal
    total_invested: Decimal
    total_value: Decimal
    gain_loss: Decimal
    gain_loss_percent: Decimal

    model_config = {"from_attributes": True}


class PortfolioSummaryResponse(BaseModel):
    portfolio_id: int
    portfolio_name: str
    client_name: str
    base_currency: BaseCurrency
    holdings: List[HoldingResponse]
    total_invested: Decimal
    total_value: Decimal
    total_gain_loss: Decimal
    total_gain_loss_percent: Decimal


class PortfolioResponse(BaseModel):
    id: int
    name: str
    client_name: str
    base_currency: BaseCurrency
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class PortfolioDetailResponse(PortfolioResponse):
    total_value: Decimal = Decimal("0")
    total_invested: Decimal = Decimal("0")
    total_gain_loss: Decimal = Decimal("0")
    total_gain_loss_percent: Decimal = Decimal("0")
    holdings_count: int = 0
