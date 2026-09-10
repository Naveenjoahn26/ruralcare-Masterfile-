# RURALCARE API Integration Contract (Member 2 - Central Platform)

**Problem Statement:** SIH26133 – Improving accessibility and quality of public healthcare services in rural/underserved areas.  
**Module:** Member 2 (Central Platform Hub)  
**Base URL:** `http://localhost:8000/api/v1` (Configurable via `API_BASE_URL` or `FRONTEND_URL`)  
**Interactive OpenAPI Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI JSON Spec:** `http://localhost:8000/openapi.json`  

---

## 1. System Integration Overview

The RURALCARE architecture integrates three autonomous modules:

```
┌─────────────────────────┐
│        MEMBER 1         │
│       PHC PORTAL        │
│  - Patient Registration │
│  - Vitals/Health Record │
│  - Doctor Consultation  │
│  - Severity Assessment  │
└────────────┬────────────┘
             │
             │ 1. POST /api/v1/referrals (MEDIUM / EMERGENCY)
             ▼
┌─────────────────────────────────────────────────────────────┐
│                          MEMBER 2                           │
│                 CENTRAL PLATFORM (THIS MODULE)              │
│  - Haversine Distance & Facility Capability Matching        │
│  - Patient Hospital Preference Recording (MEDIUM)           │
│  - Atomic Doctor Slot Reservation & Double-Booking Guard    │
│  - Rapid Emergency Auto-Triage & 1-Click Dispatch (EMERG)   │
│  - PHC Notification Dispatch on Patient No-Show             │
└────────────┬────────────────────────────────────────────────┘
             │
             │ 2. GET /api/v1/referrals/:id
             │ 3. PATCH /api/v1/referrals/:id/hospital-status
             ▼
┌─────────────────────────┐
│        MEMBER 3         │
│ HIGHER HOSPITAL PORTAL  │
│  - Referral Reception   │
│  - PHC Record Review    │
│  - Doctor Consultation  │
│  - Clinical Treatment   │
│  - Attendance / Status  │
└─────────────────────────┘
```

---

## 2. Standard Universal Identifiers

To ensure clean merging across all three members, all records use stable identifiers:

| Identifier | Format / Example | Description |
| :--- | :--- | :--- |
| `patient_id` | `PAT001`, `PAT002` | Rural patient universal health ID |
| `phc_id` | `PHC001`, `PHC002` | Primary Health Centre ID |
| `hospital_id` | `H001`, `H002` | Higher Hospital ID |
| `department_id` | `DEP001`, `DEP002` | Hospital specialty department ID |
| `doctor_id` | `DOC001`, `DOC002` | Specialist doctor ID |
| `slot_id` | `S001`, `S002` | Appointment time slot ID |
| `referral_id` | `REF001`, `REF_A1B2C3` | Central referral routing record ID |
| `notification_id`| `NOTIF-A1B2C3D4` | PHC alert event ID |

---

## 3. Referral Lifecycle Status Enum

The central platform maintains the single source of truth for referral progression:

```
REFERRAL_CREATED
       │
       ▼
HOSPITAL_SELECTION_PENDING  (For MEDIUM cases)
       │
       ▼
HOSPITAL_SELECTED
       │
       ▼
APPOINTMENT_BOOKED
       │
       ▼
   REFERRED ───────────────► PATIENT_ATTENDED
       │                            │
       │                            ▼
       │                    UNDER_TREATMENT
       │                            │
       │                            ▼
       │                        FOLLOW_UP
       │                            │
       │                            ▼
       │                        COMPLETED
       │                            │
       │                            ▼
       │                       CASE_CLOSED
       ▼
NOT_ATTENDED ───► PHC_NOTIFIED ───► RESCHEDULED / CLOSED
```

### Emergency Workflow Status:
```
EMERGENCY_TRANSFER_PENDING ───► EMERGENCY_TRANSFER ───► PATIENT_ATTENDED ───► UNDER_TREATMENT ───► COMPLETED
```

---

## 4. API Endpoint Specifications

### 4.1. Member 1 (PHC) $\to$ Central Platform

#### `POST /api/v1/referrals`
Submit a new referral from PHC after doctor consultation.

**Request Payload:**
```json
{
  "patient_id": "PAT001",
  "phc_id": "PHC001",
  "severity": "MEDIUM",
  "required_department": "Cardiology",
  "required_test": "ECG",
  "reason": "Exertional retrosternal chest pain for 3 days"
}
```

**Emergency Request Example:**
```json
{
  "patient_id": "PAT003",
  "phc_id": "PHC003",
  "severity": "EMERGENCY",
  "required_department": "General Medicine",
  "required_test": "ECG",
  "reason": "Acute STEMI. Oxygen given."
}
```

**Success Response (`201 Created`):**
```json
{
  "referral_id": "REF7C1B2A",
  "patient_id": "PAT001",
  "phc_id": "PHC001",
  "phc_name": "Government PHC Tiruppur Rural",
  "phc_district": "Tiruppur",
  "severity": "MEDIUM",
  "required_department": "Cardiology",
  "required_test": "ECG",
  "reason": "Exertional retrosternal chest pain for 3 days",
  "selected_hospital_id": null,
  "selected_hospital_name": null,
  "appointment_slot_id": null,
  "appointment_details": null,
  "referral_status": "REFERRAL_CREATED",
  "created_date": "2026-09-04",
  "updated_at": "2026-09-04T12:30:00Z",
  "events": [
    {
      "id": 1,
      "event_id": "EVT-8F9E1A2B",
      "referral_id": "REF7C1B2A",
      "from_status": null,
      "to_status": "REFERRAL_CREATED",
      "actor_role": "PHC_WORKER",
      "description": "Referral initiated at Government PHC Tiruppur Rural with severity 'MEDIUM' for 'Cardiology'",
      "created_at": "2026-09-04T12:30:00Z"
    }
  ]
}
```

---

### 4.2. Hospital Search & Matching Engine

#### `POST /api/v1/matching/medium`
Calculate Haversine distances, department/doctor availability, test availability, and open appointment slots to rank suitable hospitals for patient choice.

**Request:**
```json
{
  "phc_id": "PHC001",
  "required_department": "Cardiology",
  "required_test": "ECG",
  "referral_id": "REF001"
}
```

**Response (`200 OK`):**
```json
{
  "severity": "MEDIUM",
  "phc_id": "PHC001",
  "phc_name": "Government PHC Tiruppur Rural",
  "required_department": "Cardiology",
  "required_test": "ECG",
  "referral_id": "REF001",
  "recommended_hospital": {
    "hospital_id": "H001",
    "hospital_name": "Tiruppur District Government Hospital",
    "hospital_type": "District Hospital",
    "district": "Tiruppur",
    "state": "Tamil Nadu",
    "distance_km": 4.72,
    "latitude": 11.1085,
    "longitude": 77.3411,
    "department_available": true,
    "doctor_available": true,
    "available_doctors": ["Dr. Meena Ravi"],
    "test_available": true,
    "test_status": "AVAILABLE",
    "appointment_available": true,
    "available_slots_count": 3,
    "emergency_available": true,
    "emergency_beds": 8,
    "icu_beds_available": 2,
    "oxygen_available": true,
    "ambulance_available": true,
    "estimated_wait_minutes": 15,
    "contact_number": "0421-2200001",
    "ambulance_number": "0421-2200099",
    "score": 93.8,
    "match_reasons": [
      "Department 'Cardiology' available",
      "1 specialist(s) on duty",
      "Test 'ECG' fully available",
      "3 appointment slot(s) available",
      "Distance: 4.72 km from Government PHC Tiruppur Rural"
    ],
    "is_recommended": true
  },
  "hospitals": [ /* Ranked list of all evaluated candidate facilities */ ],
  "total_candidates": 10
}
```

#### `POST /api/v1/matching/emergency`
Auto-triage matching based on 24x7 trauma capability, ICU beds, oxygen supply, ambulance standby, and wait time.

---

### 4.3. Patient Hospital Selection (MEDIUM Cases)

#### `POST /api/v1/referrals/{referral_id}/hospital-selection`
Record the patient's chosen facility as submitted by the PHC worker.

**Request:**
```json
{
  "hospital_id": "H001"
}
```

**Response (`200 OK`):**
Returns updated `ReferralResponse` with `referral_status = "HOSPITAL_SELECTED"`.

---

### 4.4. Appointment Slots & Atomic Booking

#### `GET /api/v1/hospitals/{hospital_id}/slots`
Query appointment slots. Optional query params: `doctor_id`, `department_id`, `date`, `status` (`AVAILABLE`/`BOOKED`).

#### `POST /api/v1/appointments/book`
Atomically reserve an appointment slot with double-booking prevention.

**Request:**
```json
{
  "referral_id": "REF001",
  "hospital_id": "H001",
  "slot_id": "S003"
}
```

**Response (`200 OK`):**
Returns updated `ReferralResponse` with `referral_status = "APPOINTMENT_BOOKED"`.

**Error Response (`400 Bad Request`):**
```json
{
  "detail": "Appointment slot 'S003' is already booked or unavailable"
}
```

---

### 4.5. Emergency Transfer Dispatch

#### `POST /api/v1/referrals/{referral_id}/emergency-transfer`
Dispatch emergency transfer directly without patient preference selection.

**Request:**
```json
{
  "hospital_id": "H002",
  "notes": "Patient transit initiated with Oxygen and IV access."
}
```

---

### 4.6. Member 3 (Higher Hospital) Clinical Webhook

#### `PATCH /api/v1/referrals/{referral_id}/hospital-status`
Member 3 Higher Hospital Portal updates patient progress.

**Supported Status Values:**
- `PATIENT_ATTENDED`
- `NOT_ATTENDED`
- `UNDER_TREATMENT`
- `FOLLOW_UP`
- `COMPLETED`
- `CASE_CLOSED`

**Request:**
```json
{
  "status": "NOT_ATTENDED",
  "notes": "Patient did not arrive for cardiology slot."
}
```

**Triggered Side Effect:**
When `NOT_ATTENDED` is reported:
1. Status becomes `NOT_ATTENDED`.
2. A high-priority notification is dispatched for Member 1 PHC portal.
3. A `PHC_NOTIFIED` event is logged in the referral timeline.

---

### 4.7. Notifications for Member 1 (PHC Outreach)

#### `GET /api/v1/notifications`
Retrieve pending alerts for PHCs (e.g. patients who missed appointments).

**Query Parameters:**
- `phc_id`: (optional) Filter by PHC
- `unread_only`: (default `false`) `true` or `false`
- `limit`: (default `50`)

**Response:**
```json
[
  {
    "id": 1,
    "notification_id": "NOTIF-A1B2C3D4",
    "phc_id": "PHC001",
    "referral_id": "REF001",
    "patient_id": "PAT001",
    "event_type": "PATIENT_NOT_ATTENDED",
    "message": "Patient PAT001 did not attend appointment at hospital. Please initiate PHC follow-up.",
    "severity": "HIGH",
    "is_read": false,
    "created_at": "2026-09-04T12:45:00Z"
  }
]
```

---

### 4.8. Patient Medical Record Reference (Member 1 Integration Point)

#### `GET /api/v1/patients/{patient_id}/records`
Retrieve PHC vitals, diagnosis, and doctor notes for the referenced patient.

**Response:**
```json
{
  "patient_id": "PAT001",
  "full_name": "Ramu Selvam",
  "age": 54,
  "gender": "Male",
  "phc_id": "PHC001",
  "contact_number": "+91 98421-12345",
  "blood_group": "B+",
  "vitals": {
    "blood_pressure": "148/94 mmHg",
    "pulse_rate": "88 bpm",
    "spo2": "97%",
    "temperature": "98.4 F",
    "weight_kg": 68,
    "blood_glucose_random": "164 mg/dL"
  },
  "symptoms": "Exertional chest tightness, mild shortness of breath on climbing stairs for 3 days.",
  "preliminary_diagnosis": "Suspected Angina / Ischemic Heart Disease. Needs ECG and specialist evaluation.",
  "phc_doctor_notes": "Prescribed Tab. Sorbitrate 5mg SOS and Tab. Aspirin 75mg. Advised immediate higher hospital cardiology consult.",
  "prescriptions_summary": "Tab. Aspirin 75mg OD, Tab. Atorvastatin 20mg HS, Tab. Sorbitrate 5mg PRN.",
  "registered_date": "2026-09-04"
}
```
