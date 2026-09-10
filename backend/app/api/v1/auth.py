"""
Authentication API router — login, register, and current-user endpoints.
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.models import User
from app.schemas.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)
from app.core.config import settings

logger = logging.getLogger("ruralcare.auth")

router = APIRouter(prefix="/auth", tags=["Authentication"])


# --------------------------------------------------------------------------
# POST /auth/login
# --------------------------------------------------------------------------
@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Authenticate a user with username + password and return a JWT access token.
    """
    user = db.query(User).filter(User.username == body.username).first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been deactivated.",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
            "facility_id": user.facility_id,
        }
    )
    # Set HttpOnly cookie so browser sends it automatically on subsequent requests
    response.set_cookie(
        key="ruralcare_access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.JWT_EXPIRATION_MINUTES * 60,
    )

    logger.info(f"User '{user.username}' (role={user.role}) logged in successfully.")

    # Return token in body for backwards compatibility (frontend will rely on cookie)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            role=user.role,
            facility_id=user.facility_id,
            is_active=user.is_active,
        ),
    )



@router.post("/logout")
def logout(response: Response):
    """Clear the authentication cookie on logout."""
    response.delete_cookie("ruralcare_access_token")
    return {"status": "ok", "message": "Logged out"}


# --------------------------------------------------------------------------
# POST /auth/register
# --------------------------------------------------------------------------
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account.
    """
    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Username '{body.username}' is already taken.",
        )

    if body.role not in ("PHC", "HOSPITAL", "ADMIN"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Role must be one of: PHC, HOSPITAL, ADMIN.",
        )

    new_user = User(
        username=body.username,
        hashed_password=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        facility_id=body.facility_id,
        is_active=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"New user registered: '{new_user.username}' (role={new_user.role})")

    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        full_name=new_user.full_name,
        role=new_user.role,
        facility_id=new_user.facility_id,
        is_active=new_user.is_active,
    )


# --------------------------------------------------------------------------
# GET /auth/me — validate token and return current user profile
# --------------------------------------------------------------------------
@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Return the profile of the currently authenticated user.
    Used by the frontend on page refresh to validate stored tokens.
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        role=current_user.role,
        facility_id=current_user.facility_id,
        is_active=current_user.is_active,
    )
