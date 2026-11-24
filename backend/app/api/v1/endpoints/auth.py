from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.schemas.user import UserCreate, UserLogin, TokenResponse, UserResponse
from app.services import auth_service
from app.api.v1.deps import get_current_user
from app.models.user import User

router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account and return an access token.

    - **email**: valid email address (must be unique)
    - **full_name**: display name
    - **password**: minimum 8 characters
    """
    user = auth_service.create_user(db, user_data)
    result = auth_service.login_user(db, user_data.email, user_data.password)
    return result


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive an access token",
)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate with email and password. Returns a JWT bearer token.
    """
    return auth_service.login_user(db, credentials.email, credentials.password)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the profile of the currently authenticated user.
    """
    return current_user
