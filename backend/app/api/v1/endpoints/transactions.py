from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services import transaction_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.delete(
    "/{transaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a transaction and reverse its holding impact",
)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes the transaction and reverses its effect on the portfolio holding.
    Only the owning analyst can delete a transaction.
    """
    transaction_service.delete_transaction(db, transaction_id, current_user.id)
