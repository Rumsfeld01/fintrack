from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime
from decimal import Decimal
from app.models.asset import AssetCategory


class AssetCreate(BaseModel):
    symbol: str
    name: str
    category: AssetCategory = AssetCategory.STOCK
    current_price: Decimal
    currency: str = "USD"
    description: Optional[str] = None

    @field_validator("symbol")
    @classmethod
    def symbol_uppercase(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("current_price")
    @classmethod
    def price_positive(cls, v: Decimal) -> Decimal:
        if v < 0:
            raise ValueError("Price cannot be negative")
        return v


class AssetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[AssetCategory] = None
    current_price: Optional[Decimal] = None
    currency: Optional[str] = None
    description: Optional[str] = None

    @field_validator("current_price")
    @classmethod
    def price_positive(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v < 0:
            raise ValueError("Price cannot be negative")
        return v


class AssetResponse(BaseModel):
    id: int
    symbol: str
    name: str
    category: AssetCategory
    current_price: Decimal
    currency: str
    description: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
