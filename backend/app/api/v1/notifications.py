from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.models import User
from app.core.security import get_current_user
from app.schemas.schemas import (
    NotificationResponse,
    NotificationCreateRequest,
    TestEmailRequest,
    TestEmailResponse,
    NotificationHealthResponse,
)
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])


@router.get("/health", response_model=NotificationHealthResponse)
def get_notification_health(current_user: User = Depends(get_current_user)):
    """
    Check notification provider status (SMTP configuration, TLS mode, port, sender).
    Safe to query without exposing credentials.
    """
    return NotificationService.email_provider.get_health_status()


@router.post("/test-email", response_model=TestEmailResponse)
def send_test_email(payload: TestEmailRequest, current_user: User = Depends(get_current_user)):
    """
    Send a test email using configured SMTP provider, or validate format in development mode.
    """
    subject = "Test Email Delivery"
    message = (
        "This is a test notification from the RURALCARE Central Platform.\n\n"
        "If you received this message, direct SMTP email dispatch is working correctly.\n\n"
        "RURALCARE — Connected Care from PHC to Higher Hospital"
    )
    res = NotificationService.email_provider.send_with_details(
        recipient=payload.recipient,
        subject=subject,
        message=message,
    )
    return res



@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    phc_id: Optional[str] = Query(None, description="Filter by PHC ID"),
    channel: Optional[str] = Query(None, description="Filter by channel: EMAIL, SMS"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by status: SENT, FAILED, PENDING"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve integration notifications and alerts (e.g. APPOINTMENT_CONFIRMED, PATIENT_NOT_ATTENDED, EMERGENCY_TRANSFER).
    Supports filtering by PHC, channel (EMAIL/SMS), event type, and status (SENT/FAILED).
    """
    if channel or event_type or status:
        return NotificationService.list_all_notifications(
            db=db,
            channel=channel,
            event_type=event_type,
            status=status,
            phc_id=phc_id,
            limit=limit,
        )
    return NotificationService.get_phc_notifications(
        db, phc_id=phc_id, unread_only=unread_only, limit=limit
    )


@router.post("/send", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def send_notification(
    payload: NotificationCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually dispatch a notification across Email or SMS channel.
    """
    return NotificationService.create_and_dispatch(
        db=db,
        phc_id=payload.phc_id,
        referral_id=payload.referral_id,
        patient_id=payload.patient_id,
        event_type=payload.event_type,
        message=payload.message,
        severity=payload.severity or "MEDIUM",
        channel=payload.channel or "EMAIL",
        recipient=payload.recipient,
        message_type=payload.message_type,
    )


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark a notification as read.
    """
    notif = NotificationService.mark_as_read(db, notification_id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return notif
