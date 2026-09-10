from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database.session import get_db
from app.schemas.schemas import (
    ReferralCreate,
    ReferralResponse,
    ReferralStatusUpdate,
    HospitalStatusUpdate,
    HospitalPreferenceCreate,
    EmergencyTransferRequest,
    AcceptReferralRequest,
    MarkAttendedRequest,
)
from app.services.referral_service import ReferralService
from app.models.models import User
from app.core.security import get_current_user


# ---------------------------------------------------------
# Request models that were missing from the imports
# ---------------------------------------------------------

class MarkNotAttendedRequest(BaseModel):
    reason: Optional[str] = None


class ClinicalCareCreate(BaseModel):
    """
    Flexible clinical-care payload.
    Allows the frontend to send diagnosis, tests,
    medicines, follow-up details, etc.
    """
    data: Dict[str, Any] = {}


router = APIRouter(prefix="/referrals", tags=["Referrals"])


# ---------------------------------------------------------
# CREATE REFERRAL
# ---------------------------------------------------------

@router.post(
    "",
    response_model=ReferralResponse,
    status_code=status.HTTP_201_CREATED
)
def create_referral(
    payload: ReferralCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Integration point for Member 1 (PHC Portal)
    to submit new patient referrals.
    Supports MEDIUM and EMERGENCY severity.
    """
    try:
        referral = ReferralService.create_referral(db, payload)

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


# ---------------------------------------------------------
# LIST REFERRALS
# ---------------------------------------------------------

@router.get(
    "",
    response_model=List[ReferralResponse]
)
def list_referrals(
    severity: Optional[str] = Query(
        None,
        description="Filter by severity: MEDIUM, EMERGENCY"
    ),
    status: Optional[str] = Query(
        None,
        description="Filter by referral status"
    ),
    phc_id: Optional[str] = Query(
        None,
        description="Filter by originating PHC"
    ),
    hospital_id: Optional[str] = Query(
        None,
        description="Filter by assigned hospital"
    ),
    search: Optional[str] = Query(
        None,
        description="Search by Referral ID, Patient ID, or Department"
    ),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve and filter patient referrals
    in the Central Platform.
    """

    return ReferralService.list_referrals(
        db,
        severity=severity,
        status=status,
        phc_id=phc_id,
        hospital_id=hospital_id,
        search=search,
        skip=skip,
        limit=limit,
    )


# ---------------------------------------------------------
# GET SINGLE REFERRAL
# ---------------------------------------------------------

@router.get(
    "/{referral_id}",
    response_model=ReferralResponse
)
def get_referral(
    referral_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get comprehensive referral dossier.
    """
    try:
        return ReferralService.get_referral_detail(
            db,
            referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


# ---------------------------------------------------------
# HOSPITAL SELECTION
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/hospital-selection",
    response_model=ReferralResponse
)
def record_hospital_selection(
    referral_id: str,
    payload: HospitalPreferenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Record patient's chosen higher hospital
    for MEDIUM cases.
    """

    try:
        referral = ReferralService.record_hospital_selection(
            db,
            referral_id=referral_id,
            hospital_id=payload.hospital_id
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# EMERGENCY TRANSFER
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/emergency-transfer",
    response_model=ReferralResponse
)
def initiate_emergency_transfer(
    referral_id: str,
    payload: EmergencyTransferRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Initiate emergency transfer to a higher hospital.
    """

    try:
        h_id = payload.hospital_id

        if not h_id:
            from app.services.matching_service import HospitalMatchingService

            ref = ReferralService.get_referral_detail(
                db,
                referral_id
            )

            match_res = HospitalMatchingService.match_emergency(
                db,
                phc_id=ref.phc_id,
                referral_id=referral_id
            )

            if not match_res.recommended_hospital:
                raise ValueError(
                    "No suitable emergency hospital found in network"
                )

            h_id = match_res.recommended_hospital.hospital_id

        referral = ReferralService.initiate_emergency_transfer(
            db,
            referral_id=referral_id,
            hospital_id=h_id,
            notes=payload.notes
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# GENERIC STATUS UPDATE
# ---------------------------------------------------------

@router.patch(
    "/{referral_id}/status",
    response_model=ReferralResponse
)
def update_status(
    referral_id: str,
    payload: ReferralStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generic referral status updater.
    """

    try:
        referral = ReferralService.update_hospital_status(
            db,
            referral_id=referral_id,
            status=payload.status,
            notes=payload.description
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# HOSPITAL STATUS
# ---------------------------------------------------------

@router.patch(
    "/{referral_id}/hospital-status",
    response_model=ReferralResponse
)
def update_hospital_status(
    referral_id: str,
    payload: HospitalStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Higher Hospital Portal status updates.
    """

    try:
        referral = ReferralService.update_hospital_status(
            db,
            referral_id=referral_id,
            status=payload.status,
            notes=payload.notes
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# ACCEPT REFERRAL
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/accept",
    response_model=ReferralResponse
)
def accept_referral(
    referral_id: str,
    payload: Optional[AcceptReferralRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Higher Hospital accepts incoming referral.
    """

    try:
        notes = payload.notes if payload else None

        referral = ReferralService.accept_referral(
            db,
            referral_id=referral_id,
            notes=notes
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# MARK PATIENT ATTENDED
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/attend",
    response_model=ReferralResponse
)
def mark_patient_attended(
    referral_id: str,
    payload: Optional[MarkAttendedRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Higher Hospital marks patient as attended.
    """

    try:
        notes = payload.notes if payload else None

        referral = ReferralService.mark_patient_attended(
            db,
            referral_id=referral_id,
            notes=notes
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# MARK PATIENT NOT ATTENDED
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/not-attended",
    response_model=ReferralResponse
)
def mark_patient_not_attended(
    referral_id: str,
    payload: Optional[MarkNotAttendedRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Higher Hospital marks patient as NOT_ATTENDED.
    """

    try:
        reason = payload.reason if payload else None

        referral = ReferralService.mark_not_attended(
            db,
            referral_id=referral_id,
            reason=reason
        )

        return ReferralService.get_referral_detail(
            db,
            referral.referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


# ---------------------------------------------------------
# CLINICAL CARE
# ---------------------------------------------------------

@router.post(
    "/{referral_id}/clinical-care",
    response_model=ReferralResponse
)
def record_clinical_care(
    referral_id: str,
    payload: ClinicalCareCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Higher Hospital records clinical care progress.
    """

    try:
        ReferralService.record_clinical_care(
            db,
            referral_id=referral_id,
            care_data=payload
        )

        return ReferralService.get_referral_detail(
            db,
            referral_id
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
