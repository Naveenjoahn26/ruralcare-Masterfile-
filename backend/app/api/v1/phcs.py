from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import PHC, User
from app.core.security import get_current_user
from app.schemas.schemas import PHCBase, ReferralResponse, NotificationResponse
from app.services.referral_service import ReferralService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/phcs", tags=["PHCs"])


@router.get("", response_model=List[PHCBase])
def list_phcs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    List all registered Primary Health Centres (PHCs).
    """
    return db.query(PHC).all()


@router.get("/{phc_id}", response_model=PHCBase)
def get_phc(phc_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get details of a specific Primary Health Centre.
    """
    phc = db.query(PHC).filter(PHC.phc_id == phc_id).first()
    if not phc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"PHC '{phc_id}' not found")
    return phc


@router.get("/{phc_id}/referrals", response_model=List[ReferralResponse])
def get_phc_referrals(
    phc_id: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all referrals originating from this PHC ("My Referrals").
    """
    return ReferralService.list_referrals(
        db=db,
        phc_id=phc_id,
        status=status,
        severity=severity,
        search=search,
    )


@router.get("/{phc_id}/notifications", response_model=List[NotificationResponse])
def get_phc_notifications(
    phc_id: str,
    unread_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all notifications and alerts for this PHC.
    """
    return NotificationService.get_phc_notifications(
        db=db,
        phc_id=phc_id,
        unread_only=unread_only,
        limit=limit,
    )
