from app.services.referral_service import ReferralService
from app.schemas.schemas import ReferralCreate
from app.models.models import Notification


def test_create_medium_referral(db_session):
    payload = ReferralCreate(
        patient_id="PAT_NEW_001",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
        required_test="ECG",
        reason="Exertional palpitations",
    )
    ref = ReferralService.create_referral(db_session, payload)
    assert ref.referral_id.startswith("REF")
    assert ref.referral_status == "REFERRAL_CREATED"
    assert ref.severity == "MEDIUM"


def test_create_emergency_referral(db_session):
    payload = ReferralCreate(
        patient_id="PAT_EMERG_001",
        phc_id="PHC003",
        severity="EMERGENCY",
        required_department="General Medicine",
        reason="Acute trauma",
    )
    ref = ReferralService.create_referral(db_session, payload)
    assert ref.referral_id.startswith("REF")
    assert ref.severity == "EMERGENCY"
    assert ref.referral_status == "EMERGENCY_TRANSFER_PENDING"


def test_hospital_selection(db_session):
    payload = ReferralCreate(
        patient_id="PAT_SEL_001",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
    )
    ref = ReferralService.create_referral(db_session, payload)

    updated = ReferralService.record_hospital_selection(
        db_session, referral_id=ref.referral_id, hospital_id="H001"
    )
    assert updated.selected_hospital_id == "H001"
    assert updated.referral_status == "HOSPITAL_SELECTED"


def test_member3_not_attended_triggers_phc_notification(db_session):
    payload = ReferralCreate(
        patient_id="PAT_NO_SHOW",
        phc_id="PHC001",
        severity="MEDIUM",
        required_department="Cardiology",
    )
    ref = ReferralService.create_referral(db_session, payload)

    # Member 3 reports NOT_ATTENDED
    updated = ReferralService.update_hospital_status(
        db_session, referral_id=ref.referral_id, status="NOT_ATTENDED", notes="Patient did not arrive for appointment"
    )
    assert updated.referral_status == "NOT_ATTENDED"

    # Verify notification created for PHC001
    notifs = (
        db_session.query(Notification)
        .filter(Notification.phc_id == "PHC001", Notification.event_type == "PATIENT_NOT_ATTENDED")
        .all()
    )
    assert len(notifs) > 0
    assert "did not attend" in notifs[-1].message
