import os
import re
import uuid
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Notification, PatientRecordReference, PHC, Hospital
from app.core.config import settings

logger = logging.getLogger("ruralcare.notifications")


def is_valid_email(email: Optional[str]) -> bool:
    """Validates email format using standard syntax check."""
    if not email or not isinstance(email, str):
        return False
    cleaned = email.strip()
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, cleaned))


class BaseNotificationProvider(ABC):
    """Abstract notification provider interface"""

    @abstractmethod
    def send(
        self,
        recipient: str,
        subject: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        pass


class EmailNotificationProvider(BaseNotificationProvider):
    """
    Working Email Notification Provider for RURALCARE Prototype.
    - If SMTP credentials are provided in environment variables, dispatches real email via direct SMTP.
    - If SMTP is unconfigured in development/prototype mode:
      * For valid email addresses: Simulates delivery with clear developer/admin logging.
      * For invalid/missing email addresses: Rejects delivery and returns False.
    """

    @property
    def smtp_host(self) -> str:
        return settings.SMTP_HOST.strip()

    @property
    def smtp_port(self) -> int:
        return settings.SMTP_PORT

    @property
    def smtp_user(self) -> str:
        return settings.SMTP_USER.strip()

    @property
    def smtp_password(self) -> str:
        return settings.SMTP_PASSWORD.strip()

    @property
    def from_email(self) -> str:
        return settings.SMTP_FROM.strip() or "notifications@ruralcare.gov.in"

    @property
    def smtp_tls(self) -> bool:
        return settings.SMTP_TLS

    @property
    def smtp_timeout(self) -> int:
        return settings.SMTP_TIMEOUT

    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def get_health_status(self) -> Dict[str, Any]:
        configured = self.is_configured()
        return {
            "configured": configured,
            "mode": "SMTP" if configured else "DEVELOPMENT",
            "smtp_host_configured": bool(self.smtp_host),
            "smtp_port": self.smtp_port,
            "smtp_tls": self.smtp_tls,
            "from_email": self.from_email,
            "auth_configured": bool(self.smtp_user and self.smtp_password),
            "status": "HEALTHY" if configured else "DEVELOPMENT_SIMULATION",
        }

    def send_with_details(
        self,
        recipient: str,
        subject: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        recipient_clean = (recipient or "").strip()
        if not is_valid_email(recipient_clean):
            logger.warning(
                f"[EmailNotificationProvider] Invalid or missing recipient email address: '{recipient}'"
            )
            return {
                "success": False,
                "mode": "smtp" if self.is_configured() else "development",
                "recipient": recipient_clean,
                "message": "Invalid recipient email address",
            }

        if self.is_configured():
            try:
                import smtplib
                from email.mime.text import MIMEText
                from email.mime.multipart import MIMEMultipart

                msg = MIMEMultipart()
                msg["From"] = self.from_email
                msg["To"] = recipient_clean
                msg["Subject"] = f"[RURALCARE] {subject}"
                msg.attach(MIMEText(message, "plain"))

                timeout = self.smtp_timeout
                if self.smtp_port == 465:
                    # Direct SSL
                    with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, timeout=timeout) as server:
                        if self.smtp_user and self.smtp_password:
                            server.login(self.smtp_user, self.smtp_password)
                        server.send_message(msg)
                else:
                    # Standard SMTP with optional STARTTLS
                    with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=timeout) as server:
                        if self.smtp_tls:
                            server.starttls()
                        if self.smtp_user and self.smtp_password:
                            server.login(self.smtp_user, self.smtp_password)
                        server.send_message(msg)

                logger.info(
                    f"[EmailNotificationProvider LIVE SMTP] Email sent successfully to {recipient_clean} (Subject: {subject})"
                )
                return {
                    "success": True,
                    "mode": "smtp",
                    "recipient": recipient_clean,
                    "message": "Test email accepted by SMTP provider",
                }
            except smtplib.SMTPAuthenticationError:
                err_msg = "SMTP authentication failed (invalid username or password)"
                logger.error(f"[EmailNotificationProvider LIVE SMTP AUTH ERROR] {err_msg}")
                return {
                    "success": False,
                    "mode": "smtp",
                    "recipient": recipient_clean,
                    "message": f"SMTP delivery failed: {err_msg}",
                }
            except (smtplib.SMTPConnectError, ConnectionRefusedError):
                err_msg = "Could not connect to SMTP host"
                logger.error(f"[EmailNotificationProvider LIVE SMTP CONNECT ERROR] {err_msg}")
                return {
                    "success": False,
                    "mode": "smtp",
                    "recipient": recipient_clean,
                    "message": f"SMTP delivery failed: {err_msg}",
                }
            except TimeoutError:
                err_msg = "Connection to SMTP server timed out"
                logger.error(f"[EmailNotificationProvider LIVE SMTP TIMEOUT] {err_msg}")
                return {
                    "success": False,
                    "mode": "smtp",
                    "recipient": recipient_clean,
                    "message": f"SMTP delivery failed: {err_msg}",
                }
            except Exception as e:
                safe_err = f"{type(e).__name__}: {str(e)}"
                logger.error(
                    f"[EmailNotificationProvider LIVE SMTP FAILED] Error sending email to {recipient_clean}: {safe_err}"
                )
                return {
                    "success": False,
                    "mode": "smtp",
                    "recipient": recipient_clean,
                    "message": f"SMTP delivery failed: {safe_err}",
                }

        # Development / Prototype simulated delivery mode
        logger.info(
            f"[EmailNotificationProvider SIMULATED DISPATCH] Delivered to: {recipient_clean} | Subject: {subject}\n--- MESSAGE CONTENT ---\n{message}\n-------------------------"
        )
        return {
            "success": False,
            "mode": "development",
            "recipient": recipient_clean,
            "message": "SMTP is not configured",
        }

    def send(
        self,
        recipient: str,
        subject: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        recipient_clean = (recipient or "").strip()
        if not is_valid_email(recipient_clean):
            logger.warning(
                f"[EmailNotificationProvider] Invalid or missing recipient email address: '{recipient}'"
            )
            return False

        if self.is_configured():
            res = self.send_with_details(recipient=recipient_clean, subject=subject, message=message, metadata=metadata)
            return bool(res.get("success", False))

        # In dev mode, return True for valid email simulation so prototype runs smoothly
        logger.info(
            f"[EmailNotificationProvider SIMULATED DISPATCH] Delivered to: {recipient_clean} | Subject: {subject}\n--- MESSAGE CONTENT ---\n{message}\n-------------------------"
        )
        return True


class SMSNotificationProvider(BaseNotificationProvider):
    """
    SMS Notification Provider Adapter.
    Ready for integration with CDAC / NIC / Twilio SMS gateways via environment variables.
    Does NOT falsely report delivery unless gateway is configured and confirms delivery.
    """

    @property
    def gateway_url(self) -> str:
        return settings.SMS_GATEWAY_URL.strip()

    @property
    def api_key(self) -> str:
        return settings.SMS_API_KEY.strip()

    @property
    def sender_id(self) -> str:
        return settings.SMS_SENDER_ID.strip() or "RURLCR"

    def is_configured(self) -> bool:
        return bool(self.gateway_url and self.api_key)

    def send(
        self,
        recipient: str,
        subject: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> bool:
        phone_clean = (recipient or "").strip()
        if not phone_clean:
            logger.warning("[SMSNotificationProvider] Missing recipient phone number")
            return False

        if self.is_configured():
            try:
                import requests

                sms_text = f"RURALCARE: {message}"
                response = requests.post(
                    self.gateway_url,
                    json={
                        "apiKey": self.api_key,
                        "sender": self.sender_id,
                        "phone": phone_clean,
                        "message": sms_text,
                    },
                    timeout=5,
                )
                if response.status_code in [200, 201, 202]:
                    logger.info(f"[SMSNotificationProvider LIVE] Sent SMS to {phone_clean}")
                    return True
                else:
                    logger.warning(
                        f"[SMSNotificationProvider LIVE] Gateway error {response.status_code}: {response.text}"
                    )
                    return False
            except Exception as e:
                logger.error(f"[SMSNotificationProvider LIVE FAILED] {e}")
                return False

        # Unconfigured SMS adapter - do not falsely claim SENT
        logger.info(
            f"[SMSNotificationProvider ADAPTER UNCONFIGURED] SMS Gateway unconfigured. Adapter logged target: {phone_clean}"
        )
        return False


class NotificationService:
    email_provider = EmailNotificationProvider()
    sms_provider = SMSNotificationProvider()

    @classmethod
    def send_appointment_confirmation(
        cls,
        db: Session,
        referral_id: str,
        phc_id: str,
        patient_id: str,
        hospital_name: str,
        department_name: str,
        doctor_name: str,
        appointment_date: str,
        appointment_time: str,
        appointment_id: str,
    ) -> Notification:
        """
        Sends the patient appointment confirmation email and records channel-specific delivery status.
        Follows the exact SIH template requirements.
        Safe and non-blocking.
        """
        now = datetime.now(timezone.utc)
        patient = (
            db.query(PatientRecordReference)
            .filter(PatientRecordReference.patient_id == patient_id)
            .first()
        )
        patient_name = patient.full_name if patient else f"Patient {patient_id}"
        patient_email = patient.email.strip() if (patient and patient.email) else ""

        # Construct required template message
        message_body = (
            f"RURALCARE — Appointment Confirmed\n\n"
            f"Dear {patient_name},\n\n"
            f"Your appointment has been confirmed.\n\n"
            f"Hospital: {hospital_name}\n"
            f"Department: {department_name}\n"
            f"Doctor: {doctor_name}\n"
            f"Date: {appointment_date}\n"
            f"Time: {appointment_time}\n"
            f"Appointment ID: {appointment_id}\n"
            f"Referral ID: {referral_id}\n\n"
            f"Please visit the hospital at the scheduled time.\n\n"
            f"Thank you,\n"
            f"RURALCARE"
        )

        subject = "Appointment Confirmed"
        has_valid_email = is_valid_email(patient_email)
        sent_success = False

        if has_valid_email:
            try:
                sent_success = cls.email_provider.send(
                    recipient=patient_email,
                    subject=subject,
                    message=message_body,
                )
            except Exception as e:
                logger.error(f"Error dispatching appointment email: {e}")
                sent_success = False
        else:
            logger.warning(
                f"Cannot dispatch appointment email for Patient '{patient_id}': No valid email address."
            )
            sent_success = False

        recipient_display = patient_email if has_valid_email else (patient_email or "NO_EMAIL_ON_FILE")
        notif_status = "SENT" if sent_success else "FAILED"

        notif = Notification(
            notification_id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            phc_id=phc_id,
            referral_id=referral_id,
            patient_id=patient_id,
            event_type="APPOINTMENT_CONFIRMED",
            channel="EMAIL",
            recipient=recipient_display,
            message_type="APPOINTMENT_CONFIRMED",
            message=message_body,
            severity="MEDIUM",
            status=notif_status,
            is_read=False,
            sent_at=now if sent_success else None,
            created_at=now,
        )

        try:
            db.add(notif)
            db.commit()
            db.refresh(notif)
        except Exception as db_err:
            logger.error(f"Failed to record notification in DB: {db_err}")
            db.rollback()

        return notif

    @classmethod
    def create_and_dispatch(
        cls,
        db: Session,
        phc_id: str,
        referral_id: str,
        patient_id: str,
        event_type: str,
        message: str,
        severity: str = "MEDIUM",
        channel: str = "EMAIL",
        recipient: Optional[str] = None,
        message_type: Optional[str] = None,
    ) -> Notification:
        notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now(timezone.utc)
        channel_upper = (channel or "EMAIL").upper()
        event_upper = (event_type or "GENERAL_ALERT").upper()
        msg_type_upper = (message_type or event_upper).upper()

        # Lookup recipient if not provided
        if not recipient:
            patient = (
                db.query(PatientRecordReference)
                .filter(PatientRecordReference.patient_id == patient_id)
                .first()
            )
            if patient and patient.email and channel_upper == "EMAIL":
                recipient = patient.email
            elif patient and patient.contact_number and channel_upper == "SMS":
                recipient = patient.contact_number
            else:
                phc = db.query(PHC).filter(PHC.phc_id == phc_id).first()
                recipient = f"phc_{phc_id.lower()}@ruralcare.gov.in" if phc else "desk@ruralcare.gov.in"

        subject_map = {
            "APPOINTMENT_CONFIRMED": "Appointment Confirmed",
            "APPOINTMENT_BOOKED": "Appointment Confirmed",
            "REFERRAL_ACCEPTED": "Referral Accepted by Higher Hospital",
            "PATIENT_ATTENDED": "Patient Visited Higher Hospital",
            "PATIENT_NOT_ATTENDED": "URGENT: Patient Missed Higher Hospital Appointment",
            "APPOINTMENT_NOT_ATTENDED": "URGENT: Patient Missed Higher Hospital Appointment",
            "FOLLOW_UP_REMINDER": "Follow-up Appointment Reminder",
            "EMERGENCY_TRANSFER": "EMERGENCY: Immediate Hospital Transfer Dispatched",
            "TREATMENT_COMPLETED": "Treatment Completed & Case Closed",
        }
        subject = subject_map.get(event_upper, f"Update for Referral {referral_id}")

        success = False
        try:
            if channel_upper == "SMS":
                success = cls.sms_provider.send(recipient=recipient, subject=subject, message=message)
            else:
                success = cls.email_provider.send(recipient=recipient, subject=subject, message=message)
        except Exception as e:
            logger.error(f"Error dispatching notification via {channel_upper}: {e}")
            success = False

        status = "SENT" if success else "FAILED"

        notif = Notification(
            notification_id=notification_id,
            phc_id=phc_id,
            referral_id=referral_id,
            patient_id=patient_id,
            event_type=event_upper,
            channel=channel_upper,
            recipient=recipient,
            message_type=msg_type_upper,
            message=message,
            severity=severity,
            status=status,
            is_read=False,
            sent_at=now if success else None,
            created_at=now,
        )

        try:
            db.add(notif)
            db.commit()
            db.refresh(notif)
        except Exception as db_err:
            logger.error(f"Failed to record notification: {db_err}")
            db.rollback()

        return notif

    @classmethod
    def create_notification(
        cls,
        db: Session,
        phc_id: str,
        referral_id: str,
        patient_id: str,
        event_type: str,
        message: str,
        severity: str = "MEDIUM",
        channel: str = "EMAIL",
        recipient: Optional[str] = None,
    ) -> Notification:
        return cls.create_and_dispatch(
            db=db,
            phc_id=phc_id,
            referral_id=referral_id,
            patient_id=patient_id,
            event_type=event_type,
            message=message,
            severity=severity,
            channel=channel,
            recipient=recipient,
        )

    @staticmethod
    def get_phc_notifications(
        db: Session,
        phc_id: Optional[str] = None,
        unread_only: bool = False,
        limit: int = 50,
    ) -> List[Notification]:
        query = db.query(Notification)
        if phc_id:
            query = query.filter(Notification.phc_id == phc_id)
        if unread_only:
            query = query.filter(Notification.is_read == False)
        notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()

        for n in notifs:
            patient = (
                db.query(PatientRecordReference)
                .filter(PatientRecordReference.patient_id == n.patient_id)
                .first()
            )
            n.patient_name = patient.full_name if patient else None

        return notifs

    @staticmethod
    def list_all_notifications(
        db: Session,
        channel: Optional[str] = None,
        event_type: Optional[str] = None,
        status: Optional[str] = None,
        phc_id: Optional[str] = None,
        limit: int = 100,
    ) -> List[Notification]:
        query = db.query(Notification)
        if channel and channel.upper() != "ALL":
            query = query.filter(Notification.channel == channel.upper())
        if event_type and event_type.upper() != "ALL":
            query = query.filter(Notification.event_type == event_type.upper())
        if status and status.upper() != "ALL":
            query = query.filter(Notification.status == status.upper())
        if phc_id:
            query = query.filter(Notification.phc_id == phc_id)

        notifs = query.order_by(Notification.created_at.desc()).limit(limit).all()

        for n in notifs:
            patient = (
                db.query(PatientRecordReference)
                .filter(PatientRecordReference.patient_id == n.patient_id)
                .first()
            )
            n.patient_name = patient.full_name if patient else None

        return notifs

    @staticmethod
    def mark_as_read(db: Session, notification_id: str) -> Optional[Notification]:
        notif = db.query(Notification).filter(Notification.notification_id == notification_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
        return notif
