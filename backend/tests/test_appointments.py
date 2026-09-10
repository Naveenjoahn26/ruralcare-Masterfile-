import pytest
from app.services.appointment_service import AppointmentService
from app.models.models import AppointmentSlot, Referral


def test_get_available_slots(db_session):
    slots = AppointmentService.get_slots(db_session, hospital_id="H001", status="AVAILABLE")
    assert len(slots) > 0
    for s in slots:
        assert s.status == "AVAILABLE"


def test_book_slot_and_prevent_double_booking(db_session):
    # Find an available slot
    slot = db_session.query(AppointmentSlot).filter(
        AppointmentSlot.hospital_id == "H001",
        AppointmentSlot.status == "AVAILABLE",
    ).first()
    assert slot is not None

    ref = db_session.query(Referral).filter(Referral.referral_status == "REFERRAL_CREATED").first()
    if not ref:
        ref = Referral(
            referral_id="TEST_REF_001",
            patient_id="TEST_PAT",
            phc_id="PHC001",
            severity="MEDIUM",
            required_department="Cardiology",
            referral_status="REFERRAL_CREATED",
            created_date="2026-09-04",
        )
        db_session.add(ref)
        db_session.commit()

    # Book slot
    updated_ref = AppointmentService.book_slot(
        db_session,
        referral_id=ref.referral_id,
        hospital_id="H001",
        slot_id=slot.slot_id,
    )
    assert updated_ref.referral_status == "APPOINTMENT_BOOKED"
    assert updated_ref.appointment_slot_id == slot.slot_id

    # Verify slot is now BOOKED
    db_session.refresh(slot)
    assert slot.status == "BOOKED"

    # Attempt double-booking same slot should raise ValueError
    with pytest.raises(ValueError, match="already booked or unavailable"):
        AppointmentService.book_slot(
            db_session,
            referral_id=ref.referral_id,
            hospital_id="H001",
            slot_id=slot.slot_id,
        )
