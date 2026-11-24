from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from app.schemas.asset import AssetResponse


class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class HoldingResponse(BaseModel):
    id: int
    asset: AssetResponse
    quantity: Decimal
    average_buy_price: Decimal
    current_value: Decimal
    cost_basis: Decimal
    gain_loss: Decimal
    gain_loss_percent: Decimal

    model_config = {"from_attributes": True}


class PortfolioResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    holdings: List[HoldingResponse] = []
    total_value: Decimal = Decimal("0")
    total_invested: Decimal = Decimal("0")
    total_gain_loss: Decimal = Decimal("0")
    total_gain_loss_percent: Decimal = Decimal("0")

    model_config = {"from_attributes": True}


class PortfolioSummary(BaseModel):
    id: int
    name: str
    description: Optional[str]
    created_at: datetime
    total_value: Decimal
    total_invested: Decimal
    total_gain_loss: Decimal
    total_gain_loss_percent: Decimal
    holdings_count: int

    model_config = {"from_attributes": True}
