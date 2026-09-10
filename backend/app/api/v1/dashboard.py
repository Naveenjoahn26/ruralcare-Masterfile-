from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import Referral, Hospital, PHC, Notification, User
from app.core.security import get_current_user
from app.schemas.schemas import DashboardStats
from app.services.referral_service import ReferralService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Get aggregated real-time statistics and metrics for the Central Platform Dashboard.
    """
    total_referrals = db.query(Referral).count()
    medium_referrals = db.query(Referral).filter(Referral.severity == "MEDIUM").count()
    emergency_referrals = db.query(Referral).filter(Referral.severity == "EMERGENCY").count()

    pending_selection = (
        db.query(Referral)
        .filter(
            Referral.referral_status.in_(["REFERRAL_CREATED", "HOSPITAL_SELECTION_PENDING"])
        )
        .count()
    )

    appointments_booked = (
        db.query(Referral).filter(Referral.referral_status == "APPOINTMENT_BOOKED").count()
    )

    emergency_transfers = (
        db.query(Referral)
        .filter(Referral.referral_status.in_(["EMERGENCY_TRANSFER", "EMERGENCY_TRANSFER_PENDING"]))
        .count()
    )

    completed_referrals = (
        db.query(Referral)
        .filter(Referral.referral_status.in_(["COMPLETED", "CASE_CLOSED"]))
        .count()
    )

    not_attended_count = (
        db.query(Referral)
        .filter(Referral.referral_status.in_(["NOT_ATTENDED", "PHC_NOTIFIED"]))
        .count()
    )

    active_hospitals_count = db.query(Hospital).count()
    active_phcs_count = db.query(PHC).count()

    recent_referrals = ReferralService.list_referrals(db, limit=10)
    unread_notifications = NotificationService.get_phc_notifications(db, unread_only=True, limit=10)

    return DashboardStats(
        total_referrals=total_referrals,
        medium_referrals=medium_referrals,
        emergency_referrals=emergency_referrals,
        pending_selection=pending_selection,
        appointments_booked=appointments_booked,
        emergency_transfers=emergency_transfers,
        completed_referrals=completed_referrals,
        not_attended_count=not_attended_count,
        active_hospitals_count=active_hospitals_count,
        active_phcs_count=active_phcs_count,
        recent_referrals=recent_referrals,
        unread_notifications=unread_notifications,
    )
