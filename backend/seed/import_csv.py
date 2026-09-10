import os
import csv
import json
import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import app.database.session as db_session_module
from app.database.base import Base
from app.models.models import (
    Hospital,
    PHC,
    Department,
    Doctor,
    AppointmentSlot,
    TestItem,
    MedicineItem,
    EmergencyResource,
    Referral,
    HospitalPreference,
    ReferralEvent,
    Notification,
    PatientRecordReference,
    ClinicalCare,
    LocalConsultation,
)
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")


def seed_database(target_engine=None, target_session_local=None, data_dir: str = None, reset: bool = True):
    if not target_engine:
        target_engine = db_session_module.engine
    if not target_session_local:
        target_session_local = db_session_module.SessionLocal
    if not data_dir:
        data_dir = settings.DATA_DIR

    logger.info(f"Using dataset directory: {data_dir}")

    # Ensure tables are created
    if reset:
        logger.info("Dropping all existing tables...")
        Base.metadata.drop_all(bind=target_engine)

    logger.info("Creating tables...")
    Base.metadata.create_all(bind=target_engine)

    db: Session = target_session_local()

    try:
        # 1. Seed Hospitals
        hospitals_file = os.path.join(data_dir, "hospital_master.csv")
        if os.path.exists(hospitals_file):
            logger.info("Importing hospital_master.csv...")
            with open(hospitals_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("hospital_id"):
                        continue
                    hosp = Hospital(
                        hospital_id=row["hospital_id"].strip(),
                        hospital_name=row["hospital_name"].strip(),
                        district=row["district"].strip(),
                        state=row["state"].strip(),
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                        hospital_type=row["hospital_type"].strip(),
                        emergency_service=row["emergency_service"].strip().upper(),
                        contact_number=row.get("contact_number", "").strip(),
                        ambulance_number=row.get("ambulance_number", "").strip(),
                    )
                    db.merge(hosp)
            db.commit()

        # 2. Seed PHCs
        phc_file = os.path.join(data_dir, "phc_master.csv")
        if os.path.exists(phc_file):
            logger.info("Importing phc_master.csv...")
            with open(phc_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("phc_id"):
                        continue
                    phc = PHC(
                        phc_id=row["phc_id"].strip(),
                        phc_name=row["phc_name"].strip(),
                        district=row["district"].strip(),
                        state=row["state"].strip(),
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"]),
                    )
                    db.merge(phc)
            db.commit()

        # 3. Seed Departments
        dept_file = os.path.join(data_dir, "departments.csv")
        if os.path.exists(dept_file):
            logger.info("Importing departments.csv...")
            with open(dept_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("department_id"):
                        continue
                    dept = Department(
                        department_id=row["department_id"].strip(),
                        hospital_id=row["hospital_id"].strip(),
                        department_name=row["department_name"].strip(),
                        available=row["available"].strip().upper(),
                    )
                    db.merge(dept)
            db.commit()

        # 4. Seed Doctors
        doc_file = os.path.join(data_dir, "doctors.csv")
        if os.path.exists(doc_file):
            logger.info("Importing doctors.csv...")
            with open(doc_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("doctor_id"):
                        continue
                    doc = Doctor(
                        doctor_id=row["doctor_id"].strip(),
                        hospital_id=row["hospital_id"].strip(),
                        department_id=row["department_id"].strip(),
                        doctor_name=row["doctor_name"].strip(),
                        specialization=row["specialization"].strip(),
                        status=row["status"].strip().upper(),
                    )
                    db.merge(doc)
            db.commit()

        # 5. Seed Appointment Slots
        slots_file = os.path.join(data_dir, "appointment_slots.csv")
        if os.path.exists(slots_file):
            logger.info("Importing appointment_slots.csv...")
            with open(slots_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("slot_id"):
                        continue
                    slot = AppointmentSlot(
                        slot_id=row["slot_id"].strip(),
                        hospital_id=row["hospital_id"].strip(),
                        doctor_id=row["doctor_id"].strip(),
                        date=row["date"].strip(),
                        start_time=row["start_time"].strip(),
                        end_time=row["end_time"].strip(),
                        status=row["status"].strip().upper(),
                    )
                    db.merge(slot)
            db.commit()

        # 6. Seed Tests
        tests_file = os.path.join(data_dir, "tests.csv")
        if os.path.exists(tests_file):
            logger.info("Importing tests.csv...")
            with open(tests_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("test_id"):
                        continue
                    test = TestItem(
                        test_id=row["test_id"].strip(),
                        hospital_id=row["hospital_id"].strip(),
                        test_name=row["test_name"].strip(),
                        availability=row["availability"].strip().upper(),
                    )
                    db.merge(test)
            db.commit()

        # 7. Seed Medicines
        meds_file = os.path.join(data_dir, "medicines.csv")
        if os.path.exists(meds_file):
            logger.info("Importing medicines.csv...")
            with open(meds_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("medicine_id"):
                        continue
                    med = MedicineItem(
                        medicine_id=row["medicine_id"].strip(),
                        hospital_id=row["hospital_id"].strip(),
                        medicine_name=row["medicine_name"].strip(),
                        stock_status=row["stock_status"].strip().upper(),
                    )
                    db.merge(med)
            db.commit()

        # 8. Seed Emergency Resources
        em_file = os.path.join(data_dir, "emergency_resources.csv")
        if os.path.exists(em_file):
            logger.info("Importing emergency_resources.csv...")
            with open(em_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("hospital_id"):
                        continue
                    em = EmergencyResource(
                        hospital_id=row["hospital_id"].strip(),
                        emergency_available=row["emergency_available"].strip().upper(),
                        icu_available=row["icu_available"].strip().upper(),
                        oxygen_available=row["oxygen_available"].strip().upper(),
                        ambulance_available=row["ambulance_available"].strip().upper(),
                        emergency_beds=int(row.get("emergency_beds", 0)),
                        icu_beds_available=int(row.get("icu_beds_available", 0)),
                        estimated_wait_minutes=int(row.get("estimated_wait_minutes", 0)),
                    )
                    db.merge(em)
            db.commit()

        # 9. Seed Referrals
        ref_file = os.path.join(data_dir, "referrals.csv")
        if os.path.exists(ref_file):
            logger.info("Importing referrals.csv...")
            with open(ref_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("referral_id"):
                        continue
                    sel_hosp = row.get("selected_hospital_id", "").strip() or None
                    slot_id = row.get("appointment_slot_id", "").strip() or None
                    status = row.get("referral_status", "").strip().upper() or "REFERRAL_CREATED"
                    sev = row.get("severity", "").strip().upper()

                    ref = Referral(
                        referral_id=row["referral_id"].strip(),
                        patient_id=row["patient_id"].strip(),
                        phc_id=row["phc_id"].strip(),
                        severity=sev,
                        required_department=row.get("required_department", "").strip(),
                        required_test=row.get("required_test", "").strip() or None,
                        reason=f"Patient referred for specialized {row.get('required_department')} evaluation and management.",
                        selected_hospital_id=sel_hosp,
                        appointment_slot_id=slot_id,
                        referral_status=status,
                        created_date=row.get("created_date", "2026-09-04").strip(),
                        updated_at=datetime.now(timezone.utc),
                    )
                    db.merge(ref)

                    # Create baseline events
                    evt = ReferralEvent(
                        event_id=f"EVT-INIT-{row['referral_id'].strip()}",
                        referral_id=row["referral_id"].strip(),
                        from_status=None,
                        to_status=status,
                        actor_role="SYSTEM_IMPORT",
                        description=f"Initial referral record loaded with status {status}",
                        created_at=datetime.now(timezone.utc),
                    )
                    db.add(evt)
            db.commit()

        # 10. Seed Hospital Preferences
        pref_file = os.path.join(data_dir, "hospital_preferences.csv")
        if os.path.exists(pref_file):
            logger.info("Importing hospital_preferences.csv...")
            with open(pref_file, mode="r", encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    if not row.get("preference_id"):
                        continue
                    h_id = row.get("hospital_id", "").strip() or None
                    pref = HospitalPreference(
                        preference_id=row["preference_id"].strip(),
                        referral_id=row["referral_id"].strip(),
                        hospital_id=h_id,
                        selection_status=row.get("selection_status", "SELECTION_PENDING").strip().upper(),
                        created_at=datetime.now(timezone.utc),
                    )
                    db.merge(pref)
            db.commit()

        # 11. Seed Patient PHC Records Reference (Mock PHC clinical records for Member 1 retrieval)
        patient_records = [
            {
                "patient_id": "PAT001",
                "full_name": "Ramu Selvam",
                "age": 54,
                "gender": "Male",
                "phc_id": "PHC001",
                "contact_number": "+91 98421-12345",
                "blood_group": "B+",
                "vitals": json.dumps({
                    "blood_pressure": "148/94 mmHg",
                    "pulse_rate": "88 bpm",
                    "spo2": "97%",
                    "temperature": "98.4 F",
                    "weight_kg": 68,
                    "blood_glucose_random": "164 mg/dL"
                }),
                "symptoms": "Exertional chest tightness, mild shortness of breath on climbing stairs for 3 days.",
                "preliminary_diagnosis": "Suspected Angina / Ischemic Heart Disease. Needs ECG and specialist evaluation.",
                "phc_doctor_notes": "Prescribed Tab. Sorbitrate 5mg SOS and Tab. Aspirin 75mg. Advised immediate higher hospital cardiology consult.",
                "prescriptions_summary": "Tab. Aspirin 75mg OD, Tab. Atorvastatin 20mg HS, Tab. Sorbitrate 5mg PRN.",
                "registered_date": "2026-09-04",
            },
            {
                "patient_id": "PAT002",
                "full_name": "Kavitha Marimuthu",
                "age": 42,
                "gender": "Female",
                "phc_id": "PHC002",
                "contact_number": "+91 98421-54321",
                "blood_group": "O+",
                "vitals": json.dumps({
                    "blood_pressure": "120/80 mmHg",
                    "pulse_rate": "76 bpm",
                    "spo2": "99%",
                    "temperature": "98.6 F",
                    "weight_kg": 60
                }),
                "symptoms": "Right knee swelling and persistent joint pain following farm work slip 1 week ago.",
                "preliminary_diagnosis": "Suspected Ligament sprain / Meniscal tear. X-Ray needed.",
                "phc_doctor_notes": "Knee brace applied. Analgesic given. Referred to Orthopedics for imaging and conservative management.",
                "prescriptions_summary": "Tab. Paracetamol 650mg TDS, Cap. Omeprazole 20mg OD.",
                "registered_date": "2026-09-04",
            },
            {
                "patient_id": "PAT003",
                "full_name": "Velusamy Natarajan",
                "age": 62,
                "gender": "Male",
                "phc_id": "PHC003",
                "contact_number": "+91 98421-99887",
                "blood_group": "A+",
                "vitals": json.dumps({
                    "blood_pressure": "170/110 mmHg",
                    "pulse_rate": "112 bpm",
                    "spo2": "89%",
                    "temperature": "99.1 F",
                    "weight_kg": 72,
                    "blood_glucose_random": "220 mg/dL"
                }),
                "symptoms": "Severe crushing retrosternal pain radiating to left jaw, diaphoresis, acute breathlessness.",
                "preliminary_diagnosis": "Acute Coronary Syndrome (STEMI). Critical Emergency.",
                "phc_doctor_notes": "Oxygen 4L/min via mask initiated. Loading dose of Aspirin 300mg + Clopidogrel 300mg administered. Emergency 108 transfer initiated.",
                "prescriptions_summary": "Emergency Loading: Aspirin 300mg + Clopidogrel 300mg stat, IV Access established, O2 active.",
                "registered_date": "2026-09-04",
            },
            {
                "patient_id": "PAT004",
                "full_name": "Manimegalai Krishnan",
                "age": 36,
                "gender": "Female",
                "phc_id": "PHC004",
                "contact_number": "+91 98421-77665",
                "blood_group": "AB+",
                "vitals": json.dumps({
                    "blood_pressure": "110/70 mmHg",
                    "pulse_rate": "78 bpm",
                    "spo2": "98%",
                    "temperature": "100.4 F",
                    "weight_kg": 54
                }),
                "symptoms": "Intermittent high fever with chills for 5 days, generalized weakness, loss of appetite.",
                "preliminary_diagnosis": "Pyrexia of Unknown Origin (PUO) / Suspected Enteric Fever.",
                "phc_doctor_notes": "Empirical paracetamol given. Blood sample collection recommended at higher secondary facility.",
                "prescriptions_summary": "Tab. Paracetamol 500mg SOS, ORS sachets.",
                "registered_date": "2026-09-04",
            },
        ]

        logger.info("Seeding patient record references...")
        for p in patient_records:
            prec = PatientRecordReference(
                patient_id=p["patient_id"],
                full_name=p["full_name"],
                age=p["age"],
                gender=p["gender"],
                phc_id=p["phc_id"],
                contact_number=p["contact_number"],
                blood_group=p["blood_group"],
                vitals=p["vitals"],
                symptoms=p["symptoms"],
                preliminary_diagnosis=p["preliminary_diagnosis"],
                phc_doctor_notes=p["phc_doctor_notes"],
                prescriptions_summary=p["prescriptions_summary"],
                registered_date=p["registered_date"],
            )
            db.merge(prec)
        db.commit()

        # 12. Seed Default Demo Users
        from app.models.models import User
        from app.core.security import hash_password

        logger.info("Seeding default demo users...")
        default_users = [
            {"username": "NOLIMITS_PHC", "full_name": "Dr. V. Karthik", "role": "PHC", "facility_id": "PHC001", "password": "Nolimits@2026"},
            {"username": "NOLIMITS_HOSPITAL", "full_name": "Dr. Anjali Krishnan", "role": "HOSPITAL", "facility_id": "H001", "password": "Nolimits@2026"},
            {"username": "NOLIMITS_ADMIN", "full_name": "State Health Director", "role": "ADMIN", "facility_id": None, "password": "Nolimits@2026"},
        ]

        for u in default_users:
            if not db.query(User).filter(User.username == u["username"]).first():
                new_user = User(
                    username=u["username"],
                    hashed_password=hash_password(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    facility_id=u["facility_id"],
                    is_active=True,
                )
                db.add(new_user)
        db.commit()

        logger.info("Database seeding completed successfully!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}", exc_info=True)
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
