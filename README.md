# RURALCARE – Central Platform (Member 2)

**Connected Care from PHC to Higher Hospital**  
**Problem Statement:** SIH26133 – Improving accessibility and quality of public healthcare services in rural/underserved areas.

---

## 1. Project Overview & Boundaries

RURALCARE establishes an interoperable digital healthcare referral and coordination grid connecting rural Primary Health Centres (PHCs) with secondary and tertiary government hospitals.

This repository contains **Member 2: Central Platform Hub**, which provides:
- **Intelligent Hospital Search & Capability Matching Engine** (Haversine geospatial distance calculation, department readiness, doctor availability, diagnostic test readiness, and open appointment slot scoring).
- **MEDIUM Referral Workflow** (Multi-hospital candidate ranking, patient preference recording by PHC worker, atomic slot reservation, double-booking prevention).
- **EMERGENCY Referral Workflow** (Direct triage routing, ICU/Oxygen/Ambulance resource allocation, 1-click rapid transfer dispatch without patient preference or routine slot booking).
- **Interoperability Webhooks & Status Lifecycle Sync** (Tracks referral progression and dispatches immediate notification alerts to Member 1 PHCs when patients miss appointments).
- **Stable Integration APIs** for Member 1 (PHC Portal) and Member 3 (Higher Hospital Portal).

---

## 2. System Architecture

```
                               ┌────────────────────────────────┐
                               │   MEMBER 1: PHC PORTAL         │
                               │   - Patient Registration       │
                               │   - Doctor Consultation        │
                               │   - Severity: MEDIUM / EMERG   │
                               └───────────────┬────────────────┘
                                               │
                                               │ POST /api/v1/referrals
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           MEMBER 2: CENTRAL PLATFORM (THIS HUB)                             │
│                                                                                             │
│   ┌─────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐   │
│   │ Hospital Matching   │    │ Appointment Engine       │    │ Notification Dispatch    │   │
│   │ - Haversine Dist    │    │ - Atomic Slot Booking    │    │ - PHC Alerts on          │   │
│   │ - Capacity Scoring  │    │ - Double-Booking Guard   │    │   Missed Appointments    │   │
│   └─────────────────────┘    └──────────────────────────┘    └──────────────────────────┘   │
│                                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────────────────────┐   │
│   │ Normalized Database Layer: 10 Synthetic Datasets Ingested (SQLite / PostgreSQL)    │   │
│   └─────────────────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               │
                                               │ PATCH /api/v1/referrals/:id/hospital-status
                                               ▼
                               ┌────────────────────────────────┐
                               │ MEMBER 3: HIGHER HOSPITAL      │
                               │ - Referral Reception           │
                               │ - PHC History Review           │
                               │ - Treatment & Follow-up        │
                               │ - Attendance / Status Callback │
                               └────────────────────────────────┘
```

---

## 3. Directory Structure

```
ruralcare-central-platform/
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── dashboard.py         # Dashboard metrics & KPIs
│   │   │   ├── referrals.py         # Referral creation & lifecycle
│   │   │   ├── matching.py          # Medium & Emergency matching algorithms
│   │   │   ├── hospitals.py         # Hospital search, details & slot queries
│   │   │   ├── appointments.py      # Slot booking & conflict guard
│   │   │   ├── phcs.py              # PHC directory
│   │   │   ├── patients.py          # PHC medical record reference
│   │   │   └── notifications.py     # PHC alert stream
│   │   ├── core/
│   │   │   └── config.py            # Settings, CORS, Database URL
│   │   ├── database/
│   │   │   ├── session.py           # Engine & Session generator
│   │   │   └── base.py              # DeclarativeBase
│   │   ├── models/
│   │   │   └── models.py            # SQLAlchemy Normalized Models
│   │   ├── schemas/
│   │   │   └── schemas.py           # Pydantic Schemas
│   │   ├── services/
│   │   │   ├── matching_service.py  # Haversine distance, scoring & ranking
│   │   │   ├── appointment_service.py # Atomic booking & conflict checks
│   │   │   ├── referral_service.py  # Lifecycle transitions & audit events
│   │   │   └── notification_service.py # PHC alerts on NOT_ATTENDED
│   │   ├── utils/
│   │   │   └── geo.py               # Haversine distance utility
│   │   └── main.py                  # FastAPI app & lifespan
│   ├── seed/
│   │   └── import_csv.py            # CSV seed script for all 10 datasets
│   ├── tests/                       # Pytest test suite (17 passed)
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/              # StatusBadge, SeverityBadge, ReferralTimeline, Navbar, ComparisonCard
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx    # Central dashboard metrics & referral stream
│   │   │   ├── ReferralListPage.tsx # Searchable referral directory
│   │   │   ├── ReferralDetailPage.tsx # Referral dossier & PHC vitals
│   │   │   ├── HospitalMatchingPage.tsx # Hospital search & capability matrix
│   │   │   ├── HospitalSelectionPage.tsx # Medium patient preference recording
│   │   │   ├── AppointmentBookingPage.tsx # Interactive slot matrix & print slip
│   │   │   ├── EmergencyTransferPage.tsx # Direct triage & emergency dispatch
│   │   │   ├── ReferralTrackingPage.tsx # Lifecycle stepper & webhook simulator
│   │   │   ├── HospitalDirectoryPage.tsx # Higher hospital directory
│   │   │   └── IntegrationSimulatorPage.tsx # Member 1 & 3 test sandbox
│   │   ├── services/api.ts          # Axios API service
│   │   ├── types/index.ts           # TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
├── data/                            # 10 synthetic CSV datasets
├── docs/
│   └── API_CONTRACT.md              # OpenAPI integration contract
└── README.md
```

---

## 4. Quick Start & Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

---

### Step 1: Backend Setup & Seeding

```bash
cd ruralcare-central-platform/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed all 10 synthetic CSV datasets into database
python -m seed.import_csv

# Start FastAPI backend server (Runs on port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend will be accessible at:
- **API Base:** `http://localhost:8000/api/v1`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **Redoc Docs:** `http://localhost:8000/redoc`

---

### Step 2: Frontend Setup

```bash
cd ruralcare-central-platform/frontend

# Install dependencies
npm install

# Start Vite development server (Runs on port 5173)
npm run dev
```

Frontend application will be accessible at:
- **Web Portal:** `http://localhost:5173`

---

## 5. Running Automated Backend Tests

The test suite validates distance calculations, matching logic, atomic booking, double-booking prevention, and lifecycle webhooks:

```bash
cd ruralcare-central-platform/backend
source venv/bin/activate
PYTHONPATH=. pytest tests/ -v
```

Output:
```
17 passed in 0.15s
```

---

## 6. Demonstrated SIH Scenarios

### Scenario 1: MEDIUM Referral Workflow
1. PHC doctor consults **PAT001** at **PHC001** and refers for `Cardiology` + `ECG`.
2. Central Platform matches and ranks candidate hospitals by distance and readiness.
3. PHC worker consults patient and selects preferred hospital (**H001 - Tiruppur District GH**).
4. Available time slots are displayed; slot **S003 (10:00 - 10:30)** is booked.
5. Referral status transitions to `APPOINTMENT_BOOKED` and confirmed slip is generated.

### Scenario 2: MEDIUM Case Pending Selection
1. Referral created for **PAT002** at **PHC002** (`Orthopedics` + `X-Ray`).
2. Central Platform computes matches. No choice has been recorded yet.
3. Referral status remains `HOSPITAL_SELECTION_PENDING` in queue until PHC worker records choice.

### Scenario 3: EMERGENCY Workflow (Auto-Triage)
1. PHC doctor identifies critical patient **PAT003** at **PHC003** (`EMERGENCY`).
2. Patient preference and routine appointment booking are completely bypassed.
3. Emergency matching evaluates 24x7 ER, ICU beds, oxygen, ambulance, and wait time.
4. Top hospital (**H002**) is auto-recommended.
5. One-click "Initiate Emergency Transfer" dispatches case $\to$ status becomes `EMERGENCY_TRANSFER`.

### Scenario 4: Patient No-Show (`NOT_ATTENDED` $\to$ `PHC_NOTIFIED`)
1. Patient booked for higher hospital does not arrive for consultation.
2. Member 3 Higher Hospital sends status update: `status = "NOT_ATTENDED"`.
3. Central Platform updates referral, logs `PHC_NOTIFIED` event, and generates high-priority notification for Member 1 PHC portal for patient outreach.

---

## 7. How Member 1 & Member 3 Connect

### Member 1 (PHC Portal)
- Send new referrals: `POST /api/v1/referrals`
- Retrieve PHC alerts on missed appointments: `GET /api/v1/notifications?phc_id=PHC001`
- Query hospital matching: `POST /api/v1/matching/medium`

### Member 3 (Higher Hospital Portal)
- Fetch incoming referral dossier: `GET /api/v1/referrals/{referral_id}`
- Fetch PHC medical record summary: `GET /api/v1/patients/{patient_id}/records`
- Send attendance & treatment updates: `PATCH /api/v1/referrals/{referral_id}/hospital-status`

Refer to [docs/API_CONTRACT.md](docs/API_CONTRACT.md) for full request/response schemas.
