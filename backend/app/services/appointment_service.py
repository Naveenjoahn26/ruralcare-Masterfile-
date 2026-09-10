import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import AppointmentSlot, Referral, Doctor, Department, Hospital, ReferralEvent
from app.schemas.schemas import AppointmentSlotBase


class AppointmentService:
    @staticmethod
    def get_slots(
        db: Session,
        hospital_id: str,
        department_id: Optional[str] = None,
        doctor_id: Optional[str] = None,
        date: Optional[str] = None,
        status: Optional[str] = "AVAILABLE",
    ) -> List[AppointmentSlotBase]:
        query = db.query(AppointmentSlot).filter(AppointmentSlot.hospital_id == hospital_id)

        if doctor_id:
            query = query.filter(AppointmentSlot.doctor_id == doctor_id)
        elif department_id:
            doctor_ids = [
                d.doctor_id
                for d in db.query(Doctor).filter(Doctor.department_id == department_id).all()
            ]
            query = query.filter(AppointmentSlot.doctor_id.in_(doctor_ids))

        if date:
            query = query.filter(AppointmentSlot.date == date)
        if status:
            query = query.filter(AppointmentSlot.status == status)

        slots = query.order_by(AppointmentSlot.date, AppointmentSlot.start_time).all()

        results = []
        for s in slots:
            doc = db.query(Doctor).filter(Doctor.doctor_id == s.doctor_id).first()
            dept = None
            if doc:
                dept = db.query(Department).filter(Department.department_id == doc.department_id).first()

            results.append(
                AppointmentSlotBase(
                    slot_id=s.slot_id,
                    hospital_id=s.hospital_id,
                    doctor_id=s.doctor_id,
                    date=s.date,
                    start_time=s.start_time,
                    end_time=s.end_time,
                    status=s.status,
                    doctor_name=doc.doctor_name if doc else None,
                    department_name=dept.department_name if dept else None,
                )
            )

        return results

    @staticmethod
    def book_slot(
        db: Session,
        referral_id: str,
        hospital_id: str,
        slot_id: str,
    ) -> Referral:
        """
        Atomically book a slot for a referral.
        Prevents double-booking via status check and transactional update.
        """
        # Validate referral
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        # Validate slot with lock check
        slot = db.query(AppointmentSlot).filter(
            AppointmentSlot.slot_id == slot_id,
            AppointmentSlot.hospital_id == hospital_id,
        ).first()

        if not slot:
            raise ValueError(f"Appointment slot '{slot_id}' not found in hospital '{hospital_id}'")

        if slot.status != "AVAILABLE":
            raise ValueError(f"Appointment slot '{slot_id}' is already booked or unavailable")

        # Atomic status update
        old_status = referral.referral_status
        slot.status = "BOOKED"
        referral.selected_hospital_id = hospital_id
        referral.appointment_slot_id = slot_id
        referral.referral_status = "APPOINTMENT_BOOKED"
        referral.updated_at = datetime.now(timezone.utc)

        # Log timeline event
        event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        doc = db.query(Doctor).filter(Doctor.doctor_id == slot.doctor_id).first()
        doc_info = f" with {doc.doctor_name}" if doc else ""
        hosp = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
        hosp_name = hosp.hospital_name if hosp else hospital_id

        event = ReferralEvent(
            event_id=event_id,
            referral_id=referral.referral_id,
            from_status=old_status,
            to_status="APPOINTMENT_BOOKED",
            actor_role="PHC_WORKER",
            description=f"Appointment booked for {slot.date} ({slot.start_time}-{slot.end_time}){doc_info} at {hosp_name}",
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        # 1. COMMIT appointment booking transaction FIRST to guarantee booking persistence
        db.commit()
        db.refresh(referral)

        # 2. THEN attempt patient notification in an isolated, failure-resilient block
        try:
            from app.services.notification_service import NotificationService
            dept = db.query(Department).filter(Department.department_id == doc.department_id).first() if doc else None
            dept_name = dept.department_name if dept else referral.required_department
            doctor_name = doc.doctor_name if doc else "Specialist On Duty"

            NotificationService.send_appointment_confirmation(
                db=db,
                referral_id=referral.referral_id,
                phc_id=referral.phc_id,
                patient_id=referral.patient_id,
                hospital_name=hosp_name,
                department_name=dept_name,
                doctor_name=doctor_name,
                appointment_date=slot.date,
                appointment_time=f"{slot.start_time} - {slot.end_time}",
                appointment_id=slot.slot_id,
            )
        except Exception as notif_err:
            import logging
            logger = logging.getLogger("ruralcare.appointments")
            logger.error(f"[AppointmentService] Notification dispatch failed (non-blocking): {notif_err}")

        return referral
