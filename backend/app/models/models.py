from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
)
from sqlalchemy.orm import relationship
from app.database.base import Base


class Hospital(Base):
    __tablename__ = "hospitals"

    hospital_id = Column(String(50), primary_key=True, index=True)
    hospital_name = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    hospital_type = Column(String(100), nullable=False)
    emergency_service = Column(String(10), default="YES")
    contact_number = Column(String(50), nullable=True)
    ambulance_number = Column(String(50), nullable=True)

    departments = relationship("Department", back_populates="hospital", cascade="all, delete-orphan")
    doctors = relationship("Doctor", back_populates="hospital", cascade="all, delete-orphan")
    appointment_slots = relationship("AppointmentSlot", back_populates="hospital", cascade="all, delete-orphan")
    tests = relationship("TestItem", back_populates="hospital", cascade="all, delete-orphan")
    medicines = relationship("MedicineItem", back_populates="hospital", cascade="all, delete-orphan")
    emergency_resource = relationship("EmergencyResource", back_populates="hospital", uselist=False, cascade="all, delete-orphan")
    referrals = relationship("Referral", back_populates="selected_hospital")


class Department(Base):
    __tablename__ = "departments"

    department_id = Column(String(50), primary_key=True, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    department_name = Column(String(100), nullable=False)
    available = Column(String(10), default="YES")

    hospital = relationship("Hospital", back_populates="departments")
    doctors = relationship("Doctor", back_populates="department", cascade="all, delete-orphan")


class Doctor(Base):
    __tablename__ = "doctors"

    doctor_id = Column(String(50), primary_key=True, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    department_id = Column(String(50), ForeignKey("departments.department_id"), nullable=False, index=True)
    doctor_name = Column(String(150), nullable=False)
    specialization = Column(String(150), nullable=False)
    status = Column(String(50), default="AVAILABLE")

    hospital = relationship("Hospital", back_populates="doctors")
    department = relationship("Department", back_populates="doctors")
    appointment_slots = relationship("AppointmentSlot", back_populates="doctor", cascade="all, delete-orphan")


class AppointmentSlot(Base):
    __tablename__ = "appointment_slots"

    slot_id = Column(String(50), primary_key=True, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    doctor_id = Column(String(50), ForeignKey("doctors.doctor_id"), nullable=False, index=True)
    date = Column(String(20), nullable=False)
    start_time = Column(String(20), nullable=False)
    end_time = Column(String(20), nullable=False)
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, BOOKED, CANCELLED

    hospital = relationship("Hospital", back_populates="appointment_slots")
    doctor = relationship("Doctor", back_populates="appointment_slots")


class TestItem(Base):
    __tablename__ = "tests"

    test_id = Column(String(50), primary_key=True, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    test_name = Column(String(100), nullable=False)
    availability = Column(String(50), default="AVAILABLE")  # AVAILABLE, LIMITED, NOT_AVAILABLE

    hospital = relationship("Hospital", back_populates="tests")


class MedicineItem(Base):
    __tablename__ = "medicines"

    medicine_id = Column(String(50), primary_key=True, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    medicine_name = Column(String(100), nullable=False)
    stock_status = Column(String(50), default="IN_STOCK")  # IN_STOCK, LOW_STOCK, NOT_IN_STOCK

    hospital = relationship("Hospital", back_populates="medicines")


class EmergencyResource(Base):
    __tablename__ = "emergency_resources"

    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), primary_key=True, index=True)
    emergency_available = Column(String(10), default="YES")
    icu_available = Column(String(10), default="YES")
    oxygen_available = Column(String(10), default="YES")
    ambulance_available = Column(String(10), default="YES")
    emergency_beds = Column(Integer, default=0)
    icu_beds_available = Column(Integer, default=0)
    estimated_wait_minutes = Column(Integer, default=0)

    hospital = relationship("Hospital", back_populates="emergency_resource")


class PHC(Base):
    __tablename__ = "phcs"

    phc_id = Column(String(50), primary_key=True, index=True)
    phc_name = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    referrals = relationship("Referral", back_populates="phc")


class Referral(Base):
    __tablename__ = "referrals"

    referral_id = Column(String(50), primary_key=True, index=True)
    patient_id = Column(String(50), nullable=False, index=True)
    phc_id = Column(String(50), ForeignKey("phcs.phc_id"), nullable=False, index=True)
    severity = Column(String(20), nullable=False)  # MEDIUM, EMERGENCY
    required_department = Column(String(100), nullable=False)
    required_test = Column(String(100), nullable=True)
    reason = Column(Text, nullable=True)
    selected_hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=True, index=True)
    appointment_slot_id = Column(String(50), ForeignKey("appointment_slots.slot_id"), nullable=True)
    referral_status = Column(String(50), default="REFERRAL_CREATED")
    created_date = Column(String(20), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    phc = relationship("PHC", back_populates="referrals")
    selected_hospital = relationship("Hospital", back_populates="referrals")
    appointment_slot = relationship("AppointmentSlot")
    preferences = relationship("HospitalPreference", back_populates="referral", cascade="all, delete-orphan")
    events = relationship("ReferralEvent", back_populates="referral", cascade="all, delete-orphan", order_by="ReferralEvent.created_at")
    clinical_cares = relationship("ClinicalCare", back_populates="referral", cascade="all, delete-orphan", order_by="ClinicalCare.created_at.desc()")


class HospitalPreference(Base):
    __tablename__ = "hospital_preferences"

    preference_id = Column(String(50), primary_key=True, index=True)
    referral_id = Column(String(50), ForeignKey("referrals.referral_id"), nullable=False, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=True, index=True)
    selection_status = Column(String(50), default="SELECTION_PENDING")  # PATIENT_SELECTED, SELECTION_PENDING, REJECTED
    created_at = Column(DateTime, default=datetime.utcnow)

    referral = relationship("Referral", back_populates="preferences")
    hospital = relationship("Hospital")


class ReferralEvent(Base):
    __tablename__ = "referral_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String(50), unique=True, index=True)
    referral_id = Column(String(50), ForeignKey("referrals.referral_id"), nullable=False, index=True)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    actor_role = Column(String(50), default="SYSTEM")  # CENTRAL_OPERATOR, PHC_WORKER, HIGHER_HOSPITAL_DOCTOR, SYSTEM
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    referral = relationship("Referral", back_populates="events")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    notification_id = Column(String(50), unique=True, index=True)
    phc_id = Column(String(50), nullable=False, index=True)
    referral_id = Column(String(50), nullable=False, index=True)
    patient_id = Column(String(50), nullable=False)
    event_type = Column(String(50), nullable=False)  # PATIENT_NOT_ATTENDED, EMERGENCY_TRANSFER, APPOINTMENT_BOOKED, REFERRAL_ACCEPTED, PATIENT_ATTENDED, TREATMENT_COMPLETED
    channel = Column(String(50), default="EMAIL")  # EMAIL, SMS
    recipient = Column(String(100), nullable=True)
    message_type = Column(String(50), nullable=True)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM")  # HIGH, MEDIUM, LOW
    status = Column(String(50), default="SENT")  # SENT, PENDING, FAILED
    is_read = Column(Boolean, default=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientRecordReference(Base):
    __tablename__ = "patient_record_references"

    patient_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    phc_id = Column(String(50), nullable=False, index=True)
    contact_number = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(Text, nullable=True)
    blood_group = Column(String(10), nullable=True)
    vitals = Column(Text, nullable=True)  # JSON formatted vitals: bp, pulse, spo2, temp, weight
    symptoms = Column(Text, nullable=True)
    preliminary_diagnosis = Column(Text, nullable=True)
    phc_doctor_notes = Column(Text, nullable=True)
    prescriptions_summary = Column(Text, nullable=True)
    registered_date = Column(String(20), nullable=False)


class ClinicalCare(Base):
    __tablename__ = "clinical_cares"

    care_id = Column(String(50), primary_key=True, index=True)
    referral_id = Column(String(50), ForeignKey("referrals.referral_id"), nullable=False, index=True)
    hospital_id = Column(String(50), ForeignKey("hospitals.hospital_id"), nullable=False, index=True)
    patient_id = Column(String(50), nullable=False, index=True)
    doctor_name = Column(String(150), nullable=True)
    consultation_notes = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    tests_ordered = Column(Text, nullable=True)  # JSON array string or notes
    test_results = Column(Text, nullable=True)  # JSON or notes
    prescriptions = Column(Text, nullable=True)  # JSON array string or notes
    treatment_notes = Column(Text, nullable=True)
    follow_up_required = Column(Boolean, default=False)
    follow_up_date = Column(String(20), nullable=True)
    follow_up_notes = Column(Text, nullable=True)
    outcome_status = Column(String(50), default="UNDER_TREATMENT")  # UNDER_TREATMENT, FOLLOW_UP, COMPLETED, CASE_CLOSED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    referral = relationship("Referral", back_populates="clinical_cares")
    hospital = relationship("Hospital")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200), nullable=False)
    role = Column(String(20), nullable=False)  # PHC, HOSPITAL, ADMIN
    facility_id = Column(String(50), nullable=True)  # phc_id or hospital_id
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class LocalConsultation(Base):
    __tablename__ = "local_consultations"

    consultation_id = Column(String(50), primary_key=True, index=True)
    patient_id = Column(String(50), nullable=False, index=True)
    phc_id = Column(String(50), ForeignKey("phcs.phc_id"), nullable=False, index=True)
    symptoms = Column(Text, nullable=True)
    diagnosis = Column(Text, nullable=False)
    prescriptions = Column(Text, nullable=True)
    doctor_notes = Column(Text, nullable=True)
    status = Column(String(50), default="COMPLETED_LOCAL")
    created_at = Column(DateTime, default=datetime.utcnow)

    phc = relationship("PHC")
