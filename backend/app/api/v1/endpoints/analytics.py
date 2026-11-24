from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.analytics import DashboardSummary
from app.services import analytics_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get(
    "/dashboard",
    response_model=DashboardSummary,
    summary="Get aggregated dashboard metrics for the current user",
)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns aggregated portfolio metrics:
    - Total portfolio value (all holdings at current prices)
    - Total invested (cost basis)
    - Total gain/loss and percentage
    - Asset allocation by category
    - 30-day portfolio value performance series
    """
    return analytics_service.get_dashboard_summary(db, current_user.id)
