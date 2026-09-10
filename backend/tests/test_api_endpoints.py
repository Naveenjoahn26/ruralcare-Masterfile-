def test_dashboard_stats_endpoint(client):
    response = client.get("/api/v1/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_referrals" in data
    assert "medium_referrals" in data
    assert "emergency_referrals" in data


def test_create_referral_api(client):
    payload = {
        "patient_id": "PAT999",
        "phc_id": "PHC001",
        "severity": "MEDIUM",
        "required_department": "Cardiology",
        "required_test": "ECG",
        "reason": "Chest pressure on exertion",
    }
    response = client.post("/api/v1/referrals", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["patient_id"] == "PAT999"
    assert data["referral_status"] == "REFERRAL_CREATED"


def test_matching_medium_api(client):
    payload = {
        "phc_id": "PHC001",
        "required_department": "Cardiology",
        "required_test": "ECG",
    }
    response = client.post("/api/v1/matching/medium", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == "MEDIUM"
    assert len(data["hospitals"]) > 0


def test_matching_emergency_api(client):
    payload = {
        "phc_id": "PHC003",
        "required_department": "General Medicine",
        "required_test": "ECG",
    }
    response = client.post("/api/v1/matching/emergency", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["severity"] == "EMERGENCY"
    assert data["recommended_hospital"] is not None


def test_patient_records_endpoint(client):
    response = client.get("/api/v1/patients/PAT001/records")
    assert response.status_code == 200
    data = response.json()
    assert data["patient_id"] == "PAT001"
    assert "vitals" in data
    assert "blood_pressure" in data["vitals"]


def test_hospitals_list_api(client):
    response = client.get("/api/v1/hospitals")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 10


def test_invalid_referral_validation(client):
    # Unknown PHC
    payload = {
        "patient_id": "PAT_BAD",
        "phc_id": "PHC_UNKNOWN_999",
        "severity": "MEDIUM",
        "required_department": "Cardiology",
    }
    response = client.post("/api/v1/referrals", json=payload)
    assert response.status_code == 400
