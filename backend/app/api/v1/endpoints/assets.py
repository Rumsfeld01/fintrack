from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.base import get_db
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse
from app.models.asset import Asset, AssetCategory
from app.api.v1.deps import get_current_user
from app.models.user import User
from fastapi import HTTPException

router = APIRouter()


@router.get("", response_model=List[AssetResponse], summary="List all available assets")
def list_assets(
    category: Optional[AssetCategory] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Search by symbol or name"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(Asset)
    if category:
        query = query.filter(Asset.category == category)
    if search:
        term = f"%{search.upper()}%"
        query = query.filter(
            (Asset.symbol.ilike(term)) | (Asset.name.ilike(term))
        )
    return query.order_by(Asset.symbol).all()


@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED, summary="Create a new asset")
def create_asset(
    data: AssetCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    existing = db.query(Asset).filter(Asset.symbol == data.symbol).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Asset with symbol '{data.symbol}' already exists")
    asset = Asset(**data.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get("/{asset_id}", response_model=AssetResponse, summary="Get asset by ID")
def get_asset(
    asset_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    return asset


@router.patch("/{asset_id}", response_model=AssetResponse, summary="Update asset price or details")
def update_asset(
    asset_id: int,
    data: AssetUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    asset = db.query(Asset).filter(Asset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(asset, field, value)
    db.commit()
    db.refresh(asset)
    return asset
