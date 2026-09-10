from app.services.matching_service import HospitalMatchingService


def test_medium_matching_cardiology_ecg(db_session):
    # Match for PHC001, Cardiology department, ECG test
    res = HospitalMatchingService.match_medium(
        db=db_session,
        phc_id="PHC001",
        required_department="Cardiology",
        required_test="ECG",
    )

    assert res.severity == "MEDIUM"
    assert res.phc_id == "PHC001"
    assert len(res.hospitals) > 0

    # First hospital should have Cardiology and ECG available
    top = res.hospitals[0]
    assert top.department_available is True
    assert top.test_available is True
    assert top.score > 70


def test_emergency_matching_prioritizes_resources(db_session):
    # Match for PHC003 emergency
    res = HospitalMatchingService.match_emergency(
        db=db_session,
        phc_id="PHC003",
        required_department="General Medicine",
        required_test="ECG",
    )

    assert res.severity == "EMERGENCY"
    assert res.recommended_hospital is not None
    assert res.recommended_hospital.emergency_available is True
    assert res.recommended_hospital.icu_beds_available > 0
    assert res.recommended_hospital.ambulance_available is True
