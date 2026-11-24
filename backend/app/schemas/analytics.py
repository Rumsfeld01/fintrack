from pydantic import BaseModel
from typing import List
from decimal import Decimal
from datetime import datetime


class AllocationItem(BaseModel):
    category: str
    value: Decimal
    percentage: Decimal


class PerformancePoint(BaseModel):
    date: str
    value: Decimal


class DashboardSummary(BaseModel):
    total_portfolio_value: Decimal
    total_invested: Decimal
    total_gain_loss: Decimal
    total_gain_loss_percent: Decimal
    portfolio_count: int
    holdings_count: int
    allocation: List[AllocationItem]
    recent_performance: List[PerformancePoint]
