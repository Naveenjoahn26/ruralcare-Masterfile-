import pytest
from app.services.notification_service import (
    NotificationService,
    EmailNotificationProvider,
    SMSNotificationProvider,
    is_valid_email,
)
from app.services.appointment_service import AppointmentService
from app.services.referral_service import ReferralService
from app.schemas.schemas import ClinicalCareCreate
from app.models.models import (
    Notification,
    PatientRecordReference,
    Referral,
    AppointmentSlot,
)


def test_email_validation_logic():
    assert is_valid_email("priya.devi@example.com") is True
    assert is_valid_email("arun.kumar@gmail.com") is True
    assert is_valid_email("invalid-email") is False
    assert is_valid_email("no_domain@") is False
    assert is_valid_email("") is False
    assert is_valid_email(None) is False


def test_sms_adapter_unconfigured_does_not_falsely_claim_sent():
    provider = SMSNotificationProvider()
    # Unconfigured provider returns False and does not falsely claim SENT
    result = provider.send(
        recipient="+919876543210",
        subject="Test Alert",
        message="Test SMS message",
    )
    assert result is False


def test_appointment_booking_sends_email_notification_with_valid_email(db_session):
    # 1. Create a patient with a valid email
    patient = PatientRecordReference(
        patient_id="P_NOTIF_001",
        full_name="Kavitha Raman",
        age=34,
        gender="FEMALE",
        phc_id="PHC001",
        contact_number="9876500001",
        email="kavitha.raman@example.com",
        registered_date="2026-09-06",
    )
    db_session.merge(patient)

    # 2. Create a dedicated available slot
    slot = AppointmentSlot(
        slot_id="SLOT_NOTIF_TEST_01",
        hospital_id="H001",
        doctor_id="DOC001",
        date="2026-09-15",
        start_time="09:00",
        end_time="10:00",
        status="AVAILABLE",
    )
    db_session.merge(slot)

    # 3. Create a MEDIUM referral
    referral = Referral(
        referral_id="REF_NOTIF_001",
        patient_id="P_NOTIF_001",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
        referral_status="REFERRAL_CREATED",
        created_date="2026-09-06",
    )
    db_session.merge(referral)
    db_session.commit()

    # 4. Book appointment
    updated_ref = AppointmentService.book_slot(
        db_session,
        referral_id="REF_NOTIF_001",
        hospital_id="H001",
        slot_id="SLOT_NOTIF_TEST_01",
    )

    # 5. Verify appointment is successfully booked
    assert updated_ref.referral_status == "APPOINTMENT_BOOKED"
    assert updated_ref.appointment_slot_id == "SLOT_NOTIF_TEST_01"

    # 6. Verify EMAIL notification record created and marked SENT
    notif = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_001",
        Notification.event_type == "APPOINTMENT_CONFIRMED",
        Notification.channel == "EMAIL",
    ).first()

    assert notif is not None
    assert notif.status == "SENT"
    assert notif.recipient == "kavitha.raman@example.com"
    assert "RURALCARE — Appointment Confirmed" in notif.message
    assert "Kavitha Raman" in notif.message
    assert "REF_NOTIF_001" in notif.message
    assert "SLOT_NOTIF_TEST_01" in notif.message


def test_appointment_booking_with_missing_email_does_not_break_booking(db_session):
    # 1. Create a patient WITHOUT an email
    patient = PatientRecordReference(
        patient_id="P_NOTIF_NO_EMAIL",
        full_name="Murugan Velu",
        age=52,
        gender="MALE",
        phc_id="PHC002",
        contact_number="9876500002",
        email="",  # Missing email
        registered_date="2026-09-06",
    )
    db_session.merge(patient)

    # 2. Create a dedicated available slot
    slot = AppointmentSlot(
        slot_id="SLOT_NOTIF_TEST_02",
        hospital_id="H001",
        doctor_id="DOC001",
        date="2026-09-16",
        start_time="10:00",
        end_time="11:00",
        status="AVAILABLE",
    )
    db_session.merge(slot)

    # 3. Create referral
    referral = Referral(
        referral_id="REF_NOTIF_NO_EMAIL",
        patient_id="P_NOTIF_NO_EMAIL",
        phc_id="PHC002",
        severity="MEDIUM",
        required_department="Cardiology",
        referral_status="REFERRAL_CREATED",
        created_date="2026-09-06",
    )
    db_session.merge(referral)
    db_session.commit()

    # 4. Book slot -> must succeed independently!
    updated_ref = AppointmentService.book_slot(
        db_session,
        referral_id="REF_NOTIF_NO_EMAIL",
        hospital_id="H001",
        slot_id="SLOT_NOTIF_TEST_02",
    )

    # 5. Verify booking succeeded
    assert updated_ref.referral_status == "APPOINTMENT_BOOKED"
    assert updated_ref.appointment_slot_id == "SLOT_NOTIF_TEST_02"

    # 6. Verify notification is recorded as FAILED
    notif = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_NO_EMAIL",
        Notification.event_type == "APPOINTMENT_CONFIRMED",
        Notification.channel == "EMAIL",
    ).first()

    assert notif is not None
    assert notif.status == "FAILED"


def test_all_notification_lifecycle_events(db_session):
    # Setup patient & referral
    patient = PatientRecordReference(
        patient_id="P_NOTIF_LIFECYCLE",
        full_name="Ananya Sharma",
        age=28,
        gender="FEMALE",
        phc_id="PHC001",
        contact_number="9876500003",
        email="ananya.sharma@example.com",
        registered_date="2026-09-06",
    )
    db_session.merge(patient)

    referral = Referral(
        referral_id="REF_NOTIF_LIFECYCLE",
        patient_id="P_NOTIF_LIFECYCLE",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
        selected_hospital_id="H001",
        referral_status="APPOINTMENT_BOOKED",
        created_date="2026-09-06",
    )
    db_session.merge(referral)
    db_session.commit()

    # 1. REFERRAL_ACCEPTED
    ReferralService.accept_referral(db_session, "REF_NOTIF_LIFECYCLE", notes="Accepted by OPD")
    notif_acc = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_LIFECYCLE",
        Notification.event_type == "REFERRAL_ACCEPTED",
    ).first()
    assert notif_acc is not None

    # 2. PATIENT_ATTENDED
    ReferralService.mark_patient_attended(db_session, "REF_NOTIF_LIFECYCLE", notes="Reported at desk")
    notif_att = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_LIFECYCLE",
        Notification.event_type == "PATIENT_ATTENDED",
    ).first()
    assert notif_att is not None

    # 3. NOT_ATTENDED
    ReferralService.mark_not_attended(db_session, "REF_NOTIF_LIFECYCLE", reason="Patient did not show up")
    notif_no_show = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_LIFECYCLE",
        Notification.event_type == "PATIENT_NOT_ATTENDED",
    ).first()
    assert notif_no_show is not None
    assert notif_no_show.severity == "HIGH"

    # 4. FOLLOW_UP_REMINDER & TREATMENT_COMPLETED
    care_input = ClinicalCareCreate(
        doctor_name="Dr. Vikram Sen",
        diagnosis="Mild Hypertension",
        treatment_notes="Prescribed antihypertensive medication",
        follow_up_required=True,
        follow_up_date="2026-09-20",
        follow_up_notes="Bring BP log chart",
        outcome_status="COMPLETED",
    )
    ReferralService.record_clinical_care(db_session, "REF_NOTIF_LIFECYCLE", care_input)

    notif_fu = db_session.query(Notification).filter(
        Notification.referral_id == "REF_NOTIF_LIFECYCLE",
        Notification.event_type == "FOLLOW_UP_REMINDER",
    ).first()
    assert notif_fu is not None
    assert "2026-09-20" in notif_fu.message


def test_admin_notifications_api_filtering(client):
    # 1. Get all notifications
    res_all = client.get("/api/v1/notifications")
    assert res_all.status_code == 200
    assert isinstance(res_all.json(), list)

    # 2. Filter by status=SENT
    res_sent = client.get("/api/v1/notifications?status=SENT")
    assert res_sent.status_code == 200
    for item in res_sent.json():
        assert item["status"] == "SENT"

    # 3. Filter by channel=EMAIL
    res_email = client.get("/api/v1/notifications?channel=EMAIL")
    assert res_email.status_code == 200
    for item in res_email.json():
        assert item["channel"] == "EMAIL"


def test_notification_health_endpoint(client):
    res = client.get("/api/v1/notifications/health")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "mode" in data
    assert "smtp_host_configured" in data
    assert "smtp_port" in data
    assert "smtp_tls" in data
    assert "from_email" in data
    assert "auth_configured" in data
    assert "status" in data


def test_test_email_endpoint_dev_mode(client):
    # 1. Invalid email format
    res_invalid = client.post("/api/v1/notifications/test-email", json={"recipient": "invalid-email-format"})
    assert res_invalid.status_code == 200
    data_inv = res_invalid.json()
    assert data_inv["success"] is False
    assert "Invalid" in data_inv["message"]

    # 2. Valid email in dev mode (unconfigured SMTP)
    res_valid = client.post("/api/v1/notifications/test-email", json={"recipient": "test.patient@example.com"})
    assert res_valid.status_code == 200
    data_val = res_valid.json()
    assert data_val["recipient"] == "test.patient@example.com"


def test_direct_smtp_live_mock_success(monkeypatch, client):
    from app.core.config import settings
    import smtplib

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USER", "test_user@ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "secret123")
    monkeypatch.setattr(settings, "SMTP_FROM", "notifications@ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_TLS", True)

    class MockSMTP:
        def __init__(self, host, port, timeout=None):
            self.host = host
            self.port = port
            self.timeout = timeout

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def starttls(self):
            pass

        def login(self, user, password):
            pass

        def send_message(self, msg):
            pass

    monkeypatch.setattr(smtplib, "SMTP", MockSMTP)

    res = client.post("/api/v1/notifications/test-email", json={"recipient": "doctor@ruralcare.gov.in"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["mode"] == "smtp"
    assert "accepted" in data["message"].lower()


def test_direct_smtp_auth_failure_mock(monkeypatch, client):
    from app.core.config import settings
    import smtplib

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USER", "wrong_user@ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "wrong_password")

    class MockSMTPAuthFail:
        def __init__(self, host, port, timeout=None):
            pass

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc_val, exc_tb):
            pass

        def starttls(self):
            pass

        def login(self, user, password):
            raise smtplib.SMTPAuthenticationError(535, b"5.7.8 Authentication credentials invalid")

    monkeypatch.setattr(smtplib, "SMTP", MockSMTPAuthFail)

    res = client.post("/api/v1/notifications/test-email", json={"recipient": "doctor@ruralcare.gov.in"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["mode"] == "smtp"
    assert "authentication failed" in data["message"].lower()


def test_direct_smtp_timeout_mock(monkeypatch, client):
    from app.core.config import settings
    import smtplib

    monkeypatch.setattr(settings, "SMTP_HOST", "smtp.ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PORT", 587)
    monkeypatch.setattr(settings, "SMTP_USER", "user@ruralcare.gov.in")
    monkeypatch.setattr(settings, "SMTP_PASSWORD", "password")

    class MockSMTPTimeout:
        def __init__(self, host, port, timeout=None):
            raise TimeoutError("Connection timed out")

    monkeypatch.setattr(smtplib, "SMTP", MockSMTPTimeout)

    res = client.post("/api/v1/notifications/test-email", json={"recipient": "doctor@ruralcare.gov.in"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is False
    assert data["mode"] == "smtp"
    assert "timed out" in data["message"].lower()


def test_appointment_booking_succeeds_even_if_smtp_crashes(monkeypatch, db_session):
    # Force email_provider.send to raise an unhandled exception
    def crash_send(*args, **kwargs):
        raise ConnectionError("SMTP network link down")

    monkeypatch.setattr(NotificationService.email_provider, "send", crash_send)

    # 1. Create a patient
    patient = PatientRecordReference(
        patient_id="P_CRASH_TEST",
        full_name="Ravi Shankar",
        age=45,
        gender="MALE",
        phc_id="PHC001",
        contact_number="9876500009",
        email="ravi.shankar@example.com",
        registered_date="2026-09-06",
    )
    db_session.merge(patient)

    # 2. Create slot
    slot = AppointmentSlot(
        slot_id="SLOT_CRASH_TEST",
        hospital_id="H001",
        doctor_id="DOC001",
        date="2026-09-22",
        start_time="11:00",
        end_time="12:00",
        status="AVAILABLE",
    )
    db_session.merge(slot)

    # 3. Create referral
    referral = Referral(
        referral_id="REF_CRASH_TEST",
        patient_id="P_CRASH_TEST",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
        referral_status="REFERRAL_CREATED",
        created_date="2026-09-06",
    )
    db_session.merge(referral)
    db_session.commit()

    # 4. Book appointment -> MUST SUCCEED despite email crash
    updated_ref = AppointmentService.book_slot(
        db_session,
        referral_id="REF_CRASH_TEST",
        hospital_id="H001",
        slot_id="SLOT_CRASH_TEST",
    )

    assert updated_ref.referral_status == "APPOINTMENT_BOOKED"
    assert updated_ref.appointment_slot_id == "SLOT_CRASH_TEST"

    # 5. Check notification recorded as FAILED
    notif = db_session.query(Notification).filter(
        Notification.referral_id == "REF_CRASH_TEST",
        Notification.event_type == "APPOINTMENT_CONFIRMED",
    ).first()
    assert notif is not None
    assert notif.status == "FAILED"

