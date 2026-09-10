from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.schemas import MediumMatchingRequest, EmergencyMatchingRequest, MatchingResponse
from app.services.matching_service import HospitalMatchingService
from app.models.models import User
from app.core.security import get_current_user

router = APIRouter(prefix="/matching", tags=["Hospital Matching"])


@router.post("/medium", response_model=MatchingResponse)
def match_medium(
    payload: MediumMatchingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hospital Matching Engine for MEDIUM severity cases.
    Evaluates department, doctor, test, and appointment availability and ranks nearby higher hospitals.
    Does NOT auto-select; returns candidates for patient/PHC worker selection.
    """
    try:
        return HospitalMatchingService.match_medium(
            db,
            phc_id=payload.phc_id,
            required_department=payload.required_department,
            required_test=payload.required_test,
            referral_id=payload.referral_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/emergency", response_model=MatchingResponse)
def match_emergency(
    payload: EmergencyMatchingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hospital Matching Engine for EMERGENCY severity cases.
    Evaluates emergency trauma units, ICU beds, oxygen, ambulance standby, wait times, and proximity.
    Auto-selects and highlights the recommended receiving hospital for immediate transfer.
    """
    try:
        return HospitalMatchingService.match_emergency(
            db,
            phc_id=payload.phc_id,
            required_department=payload.required_department,
            required_test=payload.required_test,
            referral_id=payload.referral_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
