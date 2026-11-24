from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, PortfolioResponse
from app.services import portfolio_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.get("", response_model=List[PortfolioResponse], summary="List all portfolios for the current user")
def list_portfolios(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.get_portfolios(db, current_user.id)


@router.post(
    "",
    response_model=PortfolioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new portfolio",
)
def create_portfolio(
    data: PortfolioCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.create_portfolio(db, data, current_user.id)


@router.get("/{portfolio_id}", response_model=PortfolioResponse, summary="Get portfolio with holdings")
def get_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.get_portfolio(db, portfolio_id, current_user.id)


@router.patch("/{portfolio_id}", response_model=PortfolioResponse, summary="Update portfolio name or description")
def update_portfolio(
    portfolio_id: int,
    data: PortfolioUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return portfolio_service.update_portfolio(db, portfolio_id, data, current_user.id)


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a portfolio")
def delete_portfolio(
    portfolio_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    portfolio_service.delete_portfolio(db, portfolio_id, current_user.id)
