import pytest
from app.services.referral_service import ReferralService
from app.services.matching_service import HospitalMatchingService
from app.services.appointment_service import AppointmentService
from app.services.notification_service import NotificationService
from app.schemas.schemas import (
    ReferralCreate,
    ClinicalCareCreate,
    PatientCreate,
    LocalConsultationCreate,
)
from app.models.models import PatientRecordReference, Notification, LocalConsultation, ClinicalCare


def test_e2e_medium_referral_workflow(db_session):
    # 1. Register Patient at PHC001
    patient = PatientRecordReference(
        patient_id="PAT_TEST_E2E_01",
        full_name="Sundar Raman",
        age=50,
        gender="Male",
        phc_id="PHC001",
        contact_number="+91 98400-11223",
        email="sundar.raman@example.com",
        address="Village 1, Taluka A",
        blood_group="O+",
        symptoms="Persistent chest heaviness on exertion",
        preliminary_diagnosis="Suspected Ischemic Heart Disease",
        registered_date="2026-09-06",
    )
    db_session.add(patient)
    db_session.commit()

    # 2. PHC creates MEDIUM referral
    ref_payload = ReferralCreate(
        patient_id="PAT_TEST_E2E_01",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
        required_test="ECG",
        reason="Specialist cardiac workup needed",
    )
    referral = ReferralService.create_referral(db_session, ref_payload)
    assert referral.referral_status == "REFERRAL_CREATED"

    # 3. Match hospitals
    match_result = HospitalMatchingService.match_medium(
        db_session, phc_id="PHC001", required_department="Cardiology", required_test="ECG"
    )
    assert len(match_result.hospitals) > 0
    assert any(h.hospital_id == "H001" for h in match_result.hospitals)

    # 4. Patient selects hospital H001
    referral = ReferralService.record_hospital_selection(
        db_session, referral_id=referral.referral_id, hospital_id="H001"
    )
    assert referral.referral_status == "HOSPITAL_SELECTED"

    slots = AppointmentService.get_slots(db_session, hospital_id="H001", status="AVAILABLE")
    assert len(slots) > 0
    booked_slot_id = slots[0].slot_id
    # 5. Book appointment slot
    referral = AppointmentService.book_slot(
        db_session, referral_id=referral.referral_id, hospital_id="H001", slot_id=slots[0].slot_id
    )
    assert referral.referral_status == "APPOINTMENT_BOOKED"
    from app.models.models import AppointmentSlot
    slot = db_session.query(AppointmentSlot).filter(AppointmentSlot.slot_id == booked_slot_id).first()
    assert slot.status == "BOOKED"

    # 6. Higher Hospital accepts referral
    referral = ReferralService.accept_referral(
        db_session, referral_id=referral.referral_id, notes="Cardiology OPD slot confirmed"
    )
    assert referral.referral_status == "REFERRAL_ACCEPTED"

    # 7. Higher Hospital marks patient attended
    referral = ReferralService.mark_patient_attended(
        db_session, referral_id=referral.referral_id, notes="Patient checked in at OPD desk"
    )
    assert referral.referral_status == "PATIENT_ATTENDED"

    # 8. Higher Hospital records Clinical Care & Treatment
    care_payload = ClinicalCareCreate(
        doctor_name="Dr. Rajesh Sharma",
        consultation_notes="ECG shows normal sinus rhythm. Stress test planned. Prescribed Beta blockers.",
        diagnosis="Stable Angina Pectoris - Class II",
        tests_ordered="TMT (Treadmill Test), 2D Echo",
        test_results="2D Echo: Normal LV function, EF 60%",
        prescriptions="Tab. Metoprolol 25mg OD, Tab. Aspirin 75mg OD",
        treatment_notes="Lifestyle counseling provided. Low salt, low fat diet advised.",
        follow_up_required=True,
        follow_up_date="2026-10-15",
        follow_up_notes="Review with TMT report",
        outcome_status="COMPLETED",
    )
    care_record = ReferralService.record_clinical_care(
        db_session, referral_id=referral.referral_id, care_data=care_payload
    )
    assert care_record.diagnosis == "Stable Angina Pectoris - Class II"
    assert care_record.outcome_status == "COMPLETED"

    # 9. Verify single source of truth across all views
    ref_detail = ReferralService.get_referral_detail(db_session, referral.referral_id)
    assert ref_detail.referral_status == "COMPLETED"
    assert len(ref_detail.clinical_cares) == 1
    assert ref_detail.clinical_cares[0].doctor_name == "Dr. Rajesh Sharma"


def test_e2e_emergency_workflow(db_session):
    # 1. Emergency referral creation
    ref_payload = ReferralCreate(
        patient_id="PAT_TEST_EMERG_99",
        phc_id="PHC003",
        severity="EMERGENCY",
        required_department="General Medicine",
        required_test="ECG",
        reason="Acute myocardial infarction symptoms",
    )
    referral = ReferralService.create_referral(db_session, ref_payload)
    assert referral.referral_status == "EMERGENCY_TRANSFER_PENDING"

    # 2. Emergency matching auto-evaluates resources
    em_match = HospitalMatchingService.match_emergency(
        db_session, phc_id="PHC003", required_department="General Medicine", required_test="ECG"
    )
    assert em_match.recommended_hospital is not None
    rec_hospital_id = em_match.recommended_hospital.hospital_id

    # 3. Direct emergency transfer dispatch without slot booking
    referral = ReferralService.initiate_emergency_transfer(
        db_session, referral_id=referral.referral_id, hospital_id=rec_hospital_id, notes="108 Ambulance en route"
    )
    assert referral.referral_status == "EMERGENCY_TRANSFER"
    assert referral.selected_hospital_id == rec_hospital_id

    # 4. Verify notification generated for PHC
    notifs = (
        db_session.query(Notification)
        .filter(Notification.referral_id == referral.referral_id, Notification.event_type == "EMERGENCY_TRANSFER")
        .all()
    )
    assert len(notifs) > 0


def test_missed_appointment_workflow(db_session):
    # 1. Setup booked referral
    ref_payload = ReferralCreate(
        patient_id="PAT_TEST_NOSHOW_88",
        phc_id="PHC002",
        severity="MEDIUM",
        required_department="Orthopedics",
    )
    referral = ReferralService.create_referral(db_session, ref_payload)
    referral = ReferralService.record_hospital_selection(db_session, referral.referral_id, "H002")

    # 2. Mark NOT_ATTENDED
    referral = ReferralService.mark_not_attended(
        db_session, referral_id=referral.referral_id, reason="Patient unable to arrange transport"
    )
    assert referral.referral_status == "NOT_ATTENDED"

    # 3. Check PHC notification
    phc_notifs = NotificationService.get_phc_notifications(db_session, phc_id="PHC002")
    assert any(n.event_type == "PATIENT_NOT_ATTENDED" for n in phc_notifs)


def test_local_normal_consultation_workflow(db_session):
    # 1. Register patient
    patient = PatientRecordReference(
        patient_id="PAT_TEST_NORMAL_01",
        full_name="Ananya Sharma",
        age=28,
        gender="Female",
        phc_id="PHC001",
        registered_date="2026-09-06",
    )
    db_session.add(patient)
    db_session.commit()

    # 2. Record local consultation (NORMAL severity)
    consult = LocalConsultation(
        consultation_id="LC-TEST-001",
        patient_id="PAT_TEST_NORMAL_01",
        phc_id="PHC001",
        symptoms="Mild seasonal cough and cold for 2 days",
        diagnosis="Acute Upper Respiratory Tract Infection (URTI)",
        prescriptions="Tab. Paracetamol 500mg TDS x 3 days, Cetirizine 10mg OD x 3 days, Steam inhalation",
        doctor_notes="No secondary referral required. Local recovery expected.",
        status="COMPLETED_LOCAL",
    )
    db_session.add(consult)
    db_session.commit()

    fetched = db_session.query(LocalConsultation).filter(LocalConsultation.consultation_id == "LC-TEST-001").first()
    assert fetched is not None
    assert fetched.diagnosis == "Acute Upper Respiratory Tract Infection (URTI)"
    assert fetched.status == "COMPLETED_LOCAL"


def test_end_to_end_single_patient_data_consistency(db_session):
    """
    Validates Section 13: Data Consistency Test using ONE patient through the complete cycle.
    Verifies that patient_id remains strictly consistent across:
    PHC -> Referral -> Hospital -> Appointment -> Hospital status -> Admin
    """
    TEST_PID = "PAT_UNIFIED_AUDIT_777"
    
    # 1. Register Patient at PHC001
    patient = PatientRecordReference(
        patient_id=TEST_PID,
        full_name="Meenakshi Sundaram",
        age=42,
        gender="Female",
        phc_id="PHC001",
        contact_number="+91 94433-22110",
        email="meenakshi.s@ruralcare.gov.in",
        address="Kavundampalayam, Coimbatore",
        blood_group="B+",
        symptoms="Severe knee joint pain with swelling",
        preliminary_diagnosis="Osteoarthritis Grade III",
        registered_date="2026-09-06",
    )
    db_session.add(patient)
    db_session.commit()

    # 2. PHC creates Medium Referral
    ref_payload = ReferralCreate(
        patient_id=TEST_PID,
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Orthopedics",
        required_test="X-Ray",
        reason="Orthopedic joint evaluation and imaging",
    )
    referral = ReferralService.create_referral(db_session, ref_payload)
    assert referral.patient_id == TEST_PID

    # 3. Match hospitals & Select Hospital H001
    referral = ReferralService.record_hospital_selection(
        db_session, referral_id=referral.referral_id, hospital_id="H001"
    )
    assert referral.patient_id == TEST_PID
    assert referral.selected_hospital_id == "H001"

    # 4. Book Slot
    slots = AppointmentService.get_slots(db_session, hospital_id="H001", status="AVAILABLE")
    assert len(slots) > 0
    booked_slot = slots[0]
    referral = AppointmentService.book_slot(
        db_session, referral_id=referral.referral_id, hospital_id="H001", slot_id=booked_slot.slot_id
    )
    assert referral.patient_id == TEST_PID
    assert referral.referral_status == "APPOINTMENT_BOOKED"

    # Verify notification dispatched for booking
    book_notifs = db_session.query(Notification).filter(
        Notification.referral_id == referral.referral_id,
        Notification.event_type.in_(["APPOINTMENT_CONFIRMED", "APPOINTMENT_BOOKED"]),
    ).all()
    assert len(book_notifs) >= 1

    # 5. Higher Hospital Accepts Referral
    referral = ReferralService.accept_referral(db_session, referral.referral_id)
    assert referral.patient_id == TEST_PID
    assert referral.referral_status == "REFERRAL_ACCEPTED"

    # 6. Higher Hospital Marks Patient Attended
    referral = ReferralService.mark_patient_attended(db_session, referral.referral_id)
    assert referral.patient_id == TEST_PID
    assert referral.referral_status == "PATIENT_ATTENDED"

    # 7. Specialist records Clinical Care
    care_payload = ClinicalCareCreate(
        doctor_name="Dr. K. Annamalai",
        consultation_notes="X-Ray confirmed joint space narrowing. Prescribed physiotherapy & analgesics.",
        diagnosis="Bilateral Osteoarthritis Knee - Grade III",
        tests_ordered="X-Ray Both Knees AP/Lateral",
        test_results="Medial compartment joint narrowing with osteophytes",
        prescriptions="Tab. Aceclofenac 100mg BD x 5 days, Tab. Glucosamine 1500mg OD x 30 days",
        treatment_notes="Quadriceps strengthening exercises demonstrated",
        follow_up_required=True,
        follow_up_date="2026-10-20",
        outcome_status="COMPLETED",
    )
    care_record = ReferralService.record_clinical_care(
        db_session, referral_id=referral.referral_id, care_data=care_payload
    )
    assert care_record.patient_id == TEST_PID
    assert care_record.referral_id == referral.referral_id

    # 8. Admin / PHC Single Source of Truth Detail Verification
    detail = ReferralService.get_referral_detail(db_session, referral.referral_id)
    assert detail.patient_id == TEST_PID
    assert detail.phc_id == "PHC001"
    assert detail.selected_hospital_id == "H001"
    assert detail.referral_status == "COMPLETED"
    assert len(detail.clinical_cares) == 1
    assert detail.clinical_cares[0].patient_id == TEST_PID
    assert detail.events[0].referral_id == referral.referral_id

