import uuid
from datetime import datetime, timezone, timezone, date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.models import (
    Referral,
    HospitalPreference,
    ReferralEvent,
    PHC,
    Hospital,
    AppointmentSlot,
    Doctor,
    Department,
    ClinicalCare,
    Notification,
    PatientRecordReference,
)
from app.schemas.schemas import (
    ReferralCreate,
    ReferralResponse,
    AppointmentSlotBase,
    ReferralEventResponse,
    ClinicalCareCreate,
    ClinicalCareResponse,
)
from app.services.notification_service import NotificationService


class ReferralService:
    @staticmethod
    def create_referral(db: Session, data: ReferralCreate) -> Referral:
        # Validate PHC
        phc = db.query(PHC).filter(PHC.phc_id == data.phc_id).first()
        if not phc:
            raise ValueError(f"PHC with id '{data.phc_id}' does not exist")

        # Validate severity
        sev = data.severity.upper()
        if sev not in ["MEDIUM", "EMERGENCY"]:
            raise ValueError(f"Invalid severity '{data.severity}'. Must be 'MEDIUM' or 'EMERGENCY'")

        # Generate referral ID
        ref_id = f"REF{uuid.uuid4().hex[:6].upper()}"
        initial_status = "REFERRAL_CREATED" if sev == "MEDIUM" else "EMERGENCY_TRANSFER_PENDING"

        today_str = date.today().isoformat()
        referral = Referral(
            referral_id=ref_id,
            patient_id=data.patient_id,
            phc_id=data.phc_id,
            severity=sev,
            required_department=data.required_department,
            required_test=data.required_test,
            reason=data.reason,
            referral_status=initial_status,
            created_date=today_str,
            updated_at=datetime.now(timezone.utc),
        )
        db.add(referral)

        # Create initial lifecycle event
        event = ReferralEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            referral_id=ref_id,
            from_status=None,
            to_status=initial_status,
            actor_role="PHC_WORKER",
            description=f"Referral initiated at {phc.phc_name} with severity '{sev}' for '{data.required_department}'",
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        # Create initial preference entry for medium cases
        if sev == "MEDIUM":
            pref = HospitalPreference(
                preference_id=f"PREF-{uuid.uuid4().hex[:6].upper()}",
                referral_id=ref_id,
                hospital_id=None,
                selection_status="SELECTION_PENDING",
                created_at=datetime.now(timezone.utc),
            )
            db.add(pref)

        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def record_hospital_selection(
        db: Session,
        referral_id: str,
        hospital_id: str,
    ) -> Referral:
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
        if not hospital:
            raise ValueError(f"Hospital '{hospital_id}' not found")

        old_status = referral.referral_status
        referral.selected_hospital_id = hospital_id
        referral.referral_status = "HOSPITAL_SELECTED"
        referral.updated_at = datetime.now(timezone.utc)

        # Update or create preference
        pref = (
            db.query(HospitalPreference)
            .filter(HospitalPreference.referral_id == referral_id)
            .first()
        )
        if pref:
            pref.hospital_id = hospital_id
            pref.selection_status = "PATIENT_SELECTED"
        else:
            pref = HospitalPreference(
                preference_id=f"PREF-{uuid.uuid4().hex[:6].upper()}",
                referral_id=referral_id,
                hospital_id=hospital_id,
                selection_status="PATIENT_SELECTED",
                created_at=datetime.now(timezone.utc),
            )
            db.add(pref)

        # Log event
        event = ReferralEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            referral_id=referral_id,
            from_status=old_status,
            to_status="HOSPITAL_SELECTED",
            actor_role="PHC_WORKER",
            description=f"Patient selected preferred hospital: {hospital.hospital_name} ({hospital.district})",
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)
        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def initiate_emergency_transfer(
        db: Session,
        referral_id: str,
        hospital_id: str,
        notes: Optional[str] = None,
    ) -> Referral:
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        hospital = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
        if not hospital:
            raise ValueError(f"Hospital '{hospital_id}' not found")

        old_status = referral.referral_status
        referral.selected_hospital_id = hospital_id
        referral.referral_status = "EMERGENCY_TRANSFER"
        referral.updated_at = datetime.now(timezone.utc)

        notes_str = f" - Notes: {notes}" if notes else ""
        event = ReferralEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            referral_id=referral_id,
            from_status=old_status,
            to_status="EMERGENCY_TRANSFER",
            actor_role="CENTRAL_OPERATOR",
            description=f"Emergency transfer initiated directly to {hospital.hospital_name}. Ambulance/triage notified.{notes_str}",
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        # Generate notification for PHC and tracking
        NotificationService.create_notification(
            db=db,
            phc_id=referral.phc_id,
            referral_id=referral.referral_id,
            patient_id=referral.patient_id,
            event_type="EMERGENCY_TRANSFER",
            message=f"Emergency transfer initiated for Patient {referral.patient_id} to {hospital.hospital_name}.",
            severity="HIGH",
        )

        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def update_hospital_status(
        db: Session,
        referral_id: str,
        status: str,
        notes: Optional[str] = None,
    ) -> Referral:
        """
        API endpoint for Member 3 (Higher Hospital) to report patient progress/status.
        Handles PATIENT_ATTENDED, NOT_ATTENDED, UNDER_TREATMENT, FOLLOW_UP, COMPLETED, CASE_CLOSED.
        When NOT_ATTENDED: creates a notification for Member 1 (PHC Portal).
        """
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        valid_statuses = [
            "REFERRAL_ACCEPTED",
            "PATIENT_ATTENDED",
            "NOT_ATTENDED",
            "UNDER_TREATMENT",
            "FOLLOW_UP",
            "COMPLETED",
            "CASE_CLOSED",
        ]
        status_upper = status.upper()
        if status_upper not in valid_statuses:
            raise ValueError(f"Invalid status '{status}'. Must be one of {valid_statuses}")

        old_status = referral.referral_status
        referral.referral_status = status_upper
        referral.updated_at = datetime.now(timezone.utc)

        notes_str = f" - {notes}" if notes else ""
        event = ReferralEvent(
            event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
            referral_id=referral_id,
            from_status=old_status,
            to_status=status_upper,
            actor_role="HIGHER_HOSPITAL_DOCTOR",
            description=f"Status updated by Higher Hospital: {status_upper}{notes_str}",
            created_at=datetime.now(timezone.utc),
        )
        db.add(event)

        # Trigger notification if NOT_ATTENDED
        if status_upper == "NOT_ATTENDED":
            NotificationService.create_notification(
                db=db,
                phc_id=referral.phc_id,
                referral_id=referral.referral_id,
                patient_id=referral.patient_id,
                event_type="PATIENT_NOT_ATTENDED",
                message=f"Patient {referral.patient_id} did not attend scheduled appointment at hospital. Please initiate PHC patient outreach.",
                severity="HIGH",
            )
            # Also append PHC_NOTIFIED event to timeline
            notif_event = ReferralEvent(
                event_id=f"EVT-{uuid.uuid4().hex[:8].upper()}",
                referral_id=referral_id,
                from_status="NOT_ATTENDED",
                to_status="PHC_NOTIFIED",
                actor_role="CENTRAL_PLATFORM_INTEGRATION",
                description="Integration notice dispatched to Member 1 PHC Portal for patient outreach.",
                created_at=datetime.now(timezone.utc),
            )
            db.add(notif_event)
        elif status_upper == "REFERRAL_ACCEPTED":
            NotificationService.create_notification(
                db=db,
                phc_id=referral.phc_id,
                referral_id=referral.referral_id,
                patient_id=referral.patient_id,
                event_type="REFERRAL_ACCEPTED",
                message=f"Referral {referral.referral_id} has been ACCEPTED by higher hospital.",
                severity="MEDIUM",
            )
        elif status_upper == "PATIENT_ATTENDED":
            NotificationService.create_notification(
                db=db,
                phc_id=referral.phc_id,
                referral_id=referral.referral_id,
                patient_id=referral.patient_id,
                event_type="PATIENT_ATTENDED",
                message=f"Patient {referral.patient_id} has arrived and attended consultation at higher hospital.",
                severity="MEDIUM",
            )
        elif status_upper in ["COMPLETED", "CASE_CLOSED"]:
            NotificationService.create_notification(
                db=db,
                phc_id=referral.phc_id,
                referral_id=referral.referral_id,
                patient_id=referral.patient_id,
                event_type="TREATMENT_COMPLETED",
                message=f"Treatment completed for Patient {referral.patient_id} (Referral {referral.referral_id}). Case closed.",
                severity="LOW",
            )

        db.commit()
        db.refresh(referral)
        return referral

    @staticmethod
    def accept_referral(
        db: Session,
        referral_id: str,
        notes: Optional[str] = None,
    ) -> Referral:
        return ReferralService.update_hospital_status(
            db=db,
            referral_id=referral_id,
            status="REFERRAL_ACCEPTED",
            notes=notes or "Referral reviewed and accepted by Higher Hospital department.",
        )

    @staticmethod
    def mark_patient_attended(
        db: Session,
        referral_id: str,
        notes: Optional[str] = None,
    ) -> Referral:
        return ReferralService.update_hospital_status(
            db=db,
            referral_id=referral_id,
            status="PATIENT_ATTENDED",
            notes=notes or "Patient reported at Higher Hospital reception / OPD registration desk.",
        )

    @staticmethod
    def mark_not_attended(
        db: Session,
        referral_id: str,
        reason: Optional[str] = None,
    ) -> Referral:
        return ReferralService.update_hospital_status(
            db=db,
            referral_id=referral_id,
            status="NOT_ATTENDED",
            notes=reason or "Patient did not show up for scheduled appointment slot.",
        )

    @staticmethod
    def record_clinical_care(
        db: Session,
        referral_id: str,
        care_data: ClinicalCareCreate,
    ) -> ClinicalCare:
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        hospital_id = referral.selected_hospital_id or "H001"
        care_id = f"CARE-{uuid.uuid4().hex[:8].upper()}"

        clinical_care = ClinicalCare(
            care_id=care_id,
            referral_id=referral_id,
            hospital_id=hospital_id,
            patient_id=referral.patient_id,
            doctor_name=care_data.doctor_name,
            consultation_notes=care_data.consultation_notes,
            diagnosis=care_data.diagnosis,
            tests_ordered=care_data.tests_ordered,
            test_results=care_data.test_results,
            prescriptions=care_data.prescriptions,
            treatment_notes=care_data.treatment_notes,
            follow_up_required=care_data.follow_up_required,
            follow_up_date=care_data.follow_up_date,
            follow_up_notes=care_data.follow_up_notes,
            outcome_status=care_data.outcome_status.upper(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(clinical_care)

        # Update referral status based on clinical outcome
        new_status = care_data.outcome_status.upper()
        ReferralService.update_hospital_status(
            db=db,
            referral_id=referral_id,
            status=new_status,
            notes=f"Clinical care recorded by Dr. {care_data.doctor_name or 'Specialist'}: Diagnosis: {care_data.diagnosis}",
        )

        # Dispatch follow-up reminder if scheduled
        if care_data.follow_up_required and care_data.follow_up_date:
            try:
                hosp = db.query(Hospital).filter(Hospital.hospital_id == hospital_id).first()
                hosp_name = hosp.hospital_name if hosp else hospital_id
                patient = db.query(PatientRecordReference).filter(PatientRecordReference.patient_id == referral.patient_id).first()
                patient_name = patient.full_name if patient else f"Patient {referral.patient_id}"

                follow_up_msg = (
                    f"RURALCARE — Follow-up Reminder\n\n"
                    f"Dear {patient_name},\n\n"
                    f"Your follow-up consultation has been scheduled.\n\n"
                    f"Hospital: {hosp_name}\n"
                    f"Follow-up Date: {care_data.follow_up_date}\n"
                    f"Doctor: {care_data.doctor_name or 'Specialist'}\n"
                    f"Notes: {care_data.follow_up_notes or 'Please carry your previous prescription and discharge summary.'}\n\n"
                    f"Thank you,\n"
                    f"RURALCARE"
                )
                NotificationService.create_and_dispatch(
                    db=db,
                    phc_id=referral.phc_id,
                    referral_id=referral.referral_id,
                    patient_id=referral.patient_id,
                    event_type="FOLLOW_UP_REMINDER",
                    message=follow_up_msg,
                    severity="MEDIUM",
                    channel="EMAIL",
                )
            except Exception as fe:
                import logging
                logging.getLogger("ruralcare.referrals").warning(f"Follow-up notification dispatch skipped/failed: {fe}")

        db.commit()
        db.refresh(clinical_care)
        return clinical_care

    @staticmethod
    def get_referral_detail(db: Session, referral_id: str) -> ReferralResponse:
        referral = db.query(Referral).filter(Referral.referral_id == referral_id).first()
        if not referral:
            raise ValueError(f"Referral '{referral_id}' not found")

        phc = db.query(PHC).filter(PHC.phc_id == referral.phc_id).first()
        hospital = None
        if referral.selected_hospital_id:
            hospital = db.query(Hospital).filter(Hospital.hospital_id == referral.selected_hospital_id).first()

        appointment_details = None
        if referral.appointment_slot_id:
            slot = db.query(AppointmentSlot).filter(AppointmentSlot.slot_id == referral.appointment_slot_id).first()
            if slot:
                doc = db.query(Doctor).filter(Doctor.doctor_id == slot.doctor_id).first()
                dept = None
                if doc:
                    dept = db.query(Department).filter(Department.department_id == doc.department_id).first()
                appointment_details = AppointmentSlotBase(
                    slot_id=slot.slot_id,
                    hospital_id=slot.hospital_id,
                    doctor_id=slot.doctor_id,
                    date=slot.date,
                    start_time=slot.start_time,
                    end_time=slot.end_time,
                    status=slot.status,
                    doctor_name=doc.doctor_name if doc else None,
                    department_name=dept.department_name if dept else None,
                )

        events_response = [
            ReferralEventResponse(
                id=e.id,
                event_id=e.event_id,
                referral_id=e.referral_id,
                from_status=e.from_status,
                to_status=e.to_status,
                actor_role=e.actor_role,
                description=e.description,
                created_at=e.created_at,
            )
            for e in referral.events
        ]

        clinical_cares_response = [
            ClinicalCareResponse(
                care_id=c.care_id,
                referral_id=c.referral_id,
                hospital_id=c.hospital_id,
                patient_id=c.patient_id,
                doctor_name=c.doctor_name,
                consultation_notes=c.consultation_notes,
                diagnosis=c.diagnosis,
                tests_ordered=c.tests_ordered,
                test_results=c.test_results,
                prescriptions=c.prescriptions,
                treatment_notes=c.treatment_notes,
                follow_up_required=c.follow_up_required,
                follow_up_date=c.follow_up_date,
                follow_up_notes=c.follow_up_notes,
                outcome_status=c.outcome_status,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in referral.clinical_cares
        ]

        # Retrieve latest notification status for this referral
        latest_notif = (
            db.query(Notification)
            .filter(Notification.referral_id == referral.referral_id)
            .order_by(Notification.created_at.desc())
            .first()
        )

        notification_sent = (latest_notif.status == "SENT") if latest_notif else None
        notification_status = latest_notif.status if latest_notif else None
        notification_channel = latest_notif.channel if latest_notif else "EMAIL"
        notification_recipient = latest_notif.recipient if latest_notif else None
        notification_message = latest_notif.message if latest_notif else None

        return ReferralResponse(
            referral_id=referral.referral_id,
            patient_id=referral.patient_id,
            phc_id=referral.phc_id,
            phc_name=phc.phc_name if phc else None,
            phc_district=phc.district if phc else None,
            severity=referral.severity,
            required_department=referral.required_department,
            required_test=referral.required_test,
            reason=referral.reason,
            selected_hospital_id=referral.selected_hospital_id,
            selected_hospital_name=hospital.hospital_name if hospital else None,
            appointment_slot_id=referral.appointment_slot_id,
            appointment_details=appointment_details,
            referral_status=referral.referral_status,
            created_date=referral.created_date,
            updated_at=referral.updated_at,
            events=events_response,
            clinical_cares=clinical_cares_response,
            notification_sent=notification_sent,
            notification_status=notification_status,
            notification_channel=notification_channel,
            notification_recipient=notification_recipient,
            notification_message=notification_message,
        )

    @staticmethod
    def list_referrals(
        db: Session,
        severity: Optional[str] = None,
        status: Optional[str] = None,
        phc_id: Optional[str] = None,
        hospital_id: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[ReferralResponse]:
        query = db.query(Referral)

        if severity:
            query = query.filter(Referral.severity == severity.upper())
        if status:
            query = query.filter(Referral.referral_status == status.upper())
        if phc_id:
            query = query.filter(Referral.phc_id == phc_id)
        if hospital_id:
            query = query.filter(Referral.selected_hospital_id == hospital_id)
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Referral.referral_id.ilike(search_pattern))
                | (Referral.patient_id.ilike(search_pattern))
                | (Referral.required_department.ilike(search_pattern))
            )

        referrals = query.order_by(Referral.updated_at.desc()).offset(skip).limit(limit).all()

        results = []
        for r in referrals:
            results.append(ReferralService.get_referral_detail(db, r.referral_id))
        return results
