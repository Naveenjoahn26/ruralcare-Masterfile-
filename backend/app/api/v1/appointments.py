from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import AppointmentBookRequest, ReferralResponse
from app.services.appointment_service import AppointmentService
from app.services.referral_service import ReferralService
from app.models.models import User
from app.core.security import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/book", response_model=ReferralResponse)
def book_appointment(
    payload: AppointmentBookRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Atomically book an appointment slot for a MEDIUM referral.
    Validates slot availability and prevents double booking.
    Updates referral status to APPOINTMENT_BOOKED.
    """
    try:
        referral = AppointmentService.book_slot(
            db,
            referral_id=payload.referral_id,
            hospital_id=payload.hospital_id,
            slot_id=payload.slot_id,
        )
        return ReferralService.get_referral_detail(db, referral.referral_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
