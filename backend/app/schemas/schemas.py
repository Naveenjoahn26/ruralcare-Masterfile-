from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


# ----------------------------------------------------
# PHC & Hospital Schemas
# ----------------------------------------------------
class PHCBase(BaseModel):
    phc_id: str
    phc_name: str
    district: str
    state: str
    latitude: float
    longitude: float

    model_config = ConfigDict(from_attributes=True)


class DepartmentBase(BaseModel):
    department_id: str
    hospital_id: str
    department_name: str
    available: str

    model_config = ConfigDict(from_attributes=True)


class DoctorBase(BaseModel):
    doctor_id: str
    hospital_id: str
    department_id: str
    doctor_name: str
    specialization: str
    status: str

    model_config = ConfigDict(from_attributes=True)


class AppointmentSlotBase(BaseModel):
    slot_id: str
    hospital_id: str
    doctor_id: str
    date: str
    start_time: str
    end_time: str
    status: str
    doctor_name: Optional[str] = None
    department_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class TestItemBase(BaseModel):
    test_id: str
    hospital_id: str
    test_name: str
    availability: str

    model_config = ConfigDict(from_attributes=True)


class MedicineItemBase(BaseModel):
    medicine_id: str
    hospital_id: str
    medicine_name: str
    stock_status: str

    model_config = ConfigDict(from_attributes=True)


class EmergencyResourceBase(BaseModel):
    hospital_id: str
    emergency_available: str
    icu_available: str
    oxygen_available: str
    ambulance_available: str
    emergency_beds: int
    icu_beds_available: int
    estimated_wait_minutes: int

    model_config = ConfigDict(from_attributes=True)


class HospitalBase(BaseModel):
    hospital_id: str
    hospital_name: str
    district: str
    state: str
    latitude: float
    longitude: float
    hospital_type: str
    emergency_service: str
    contact_number: Optional[str] = None
    ambulance_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HospitalDetailResponse(HospitalBase):
    departments: List[DepartmentBase] = []
    doctors: List[DoctorBase] = []
    tests: List[TestItemBase] = []
    medicines: List[MedicineItemBase] = []
    emergency_resource: Optional[EmergencyResourceBase] = None
    available_slots: List[AppointmentSlotBase] = []


# ----------------------------------------------------
# Matching Schemas
# ----------------------------------------------------
class MediumMatchingRequest(BaseModel):
    phc_id: str
    required_department: str
    required_test: Optional[str] = None
    referral_id: Optional[str] = None


class EmergencyMatchingRequest(BaseModel):
    phc_id: str
    required_department: Optional[str] = None
    required_test: Optional[str] = None
    referral_id: Optional[str] = None


class MatchingHospitalResult(BaseModel):
    hospital_id: str
    hospital_name: str
    hospital_type: str
    district: str
    state: str
    distance_km: float
    latitude: float
    longitude: float
    department_available: bool
    doctor_available: bool
    available_doctors: List[str] = []
    test_available: bool
    test_status: str  # AVAILABLE, LIMITED, NOT_AVAILABLE, NOT_REQUIRED
    appointment_available: bool
    available_slots_count: int
    emergency_available: bool
    emergency_beds: int
    icu_beds_available: int
    oxygen_available: bool
    ambulance_available: bool
    estimated_wait_minutes: int
    contact_number: Optional[str] = None
    ambulance_number: Optional[str] = None
    score: float
    match_reasons: List[str] = []
    is_recommended: bool = False


class MatchingResponse(BaseModel):
    severity: str
    phc_id: str
    phc_name: str
    required_department: Optional[str] = None
    required_test: Optional[str] = None
    referral_id: Optional[str] = None
    recommended_hospital: Optional[MatchingHospitalResult] = None
    hospitals: List[MatchingHospitalResult] = []
    total_candidates: int


# ----------------------------------------------------
# Referral & Preference Schemas
# ----------------------------------------------------
class ReferralCreate(BaseModel):
    patient_id: str
    phc_id: str
    severity: str = Field(..., description="MEDIUM or EMERGENCY")
    required_department: str
    required_test: Optional[str] = None
    reason: Optional[str] = None


class HospitalPreferenceCreate(BaseModel):
    hospital_id: str


class AppointmentBookRequest(BaseModel):
    referral_id: str
    hospital_id: str
    slot_id: str


class EmergencyTransferRequest(BaseModel):
    hospital_id: Optional[str] = None
    notes: Optional[str] = None


class ReferralStatusUpdate(BaseModel):
    status: str
    actor_role: Optional[str] = "CENTRAL_OPERATOR"
    description: Optional[str] = None


class HospitalStatusUpdate(BaseModel):
    status: str = Field(
        ...,
        description="REFERRAL_ACCEPTED, PATIENT_ATTENDED, NOT_ATTENDED, UNDER_TREATMENT, FOLLOW_UP, COMPLETED, CASE_CLOSED",
    )
    notes: Optional[str] = None


class AcceptReferralRequest(BaseModel):
    notes: Optional[str] = None


class MarkAttendedRequest(BaseModel):
    notes: Optional[str] = None


class MarkNotAttendedRequest(BaseModel):
    reason: Optional[str] = None


class ClinicalCareCreate(BaseModel):
    doctor_name: Optional[str] = None
    consultation_notes: Optional[str] = None
    diagnosis: str
    tests_ordered: Optional[str] = None
    test_results: Optional[str] = None
    prescriptions: Optional[str] = None
    treatment_notes: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    outcome_status: str = Field(
        default="UNDER_TREATMENT",
        description="UNDER_TREATMENT, FOLLOW_UP, COMPLETED, CASE_CLOSED",
    )


class ClinicalCareResponse(BaseModel):
    care_id: str
    referral_id: str
    hospital_id: str
    patient_id: str
    doctor_name: Optional[str] = None
    consultation_notes: Optional[str] = None
    diagnosis: str
    tests_ordered: Optional[str] = None
    test_results: Optional[str] = None
    prescriptions: Optional[str] = None
    treatment_notes: Optional[str] = None
    follow_up_required: bool = False
    follow_up_date: Optional[str] = None
    follow_up_notes: Optional[str] = None
    outcome_status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LocalConsultationCreate(BaseModel):
    symptoms: Optional[str] = None
    diagnosis: str
    prescriptions: Optional[str] = None
    doctor_notes: Optional[str] = None


class LocalConsultationResponse(BaseModel):
    consultation_id: str
    patient_id: str
    phc_id: str
    symptoms: Optional[str] = None
    diagnosis: str
    prescriptions: Optional[str] = None
    doctor_notes: Optional[str] = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReferralEventResponse(BaseModel):
    id: int
    event_id: str
    referral_id: str
    from_status: Optional[str] = None
    to_status: str
    actor_role: str
    description: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReferralResponse(BaseModel):
    referral_id: str
    patient_id: str
    phc_id: str
    phc_name: Optional[str] = None
    phc_district: Optional[str] = None
    severity: str
    required_department: str
    required_test: Optional[str] = None
    reason: Optional[str] = None
    selected_hospital_id: Optional[str] = None
    selected_hospital_name: Optional[str] = None
    appointment_slot_id: Optional[str] = None
    appointment_details: Optional[AppointmentSlotBase] = None
    referral_status: str
    created_date: str
    updated_at: Optional[datetime] = None
    events: List[ReferralEventResponse] = []
    clinical_cares: List[ClinicalCareResponse] = []
    notification_sent: Optional[bool] = None
    notification_status: Optional[str] = None
    notification_channel: Optional[str] = None
    notification_recipient: Optional[str] = None
    notification_message: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Notification & Patient Record Schemas
# ----------------------------------------------------
class NotificationResponse(BaseModel):
    id: int
    notification_id: str
    phc_id: str
    referral_id: str
    patient_id: str
    patient_name: Optional[str] = None
    event_type: str
    channel: str = "EMAIL"
    recipient: Optional[str] = None
    message_type: Optional[str] = None
    message: str
    severity: str
    status: str = "SENT"
    is_read: bool
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationCreateRequest(BaseModel):
    phc_id: str
    referral_id: str
    patient_id: str
    event_type: str
    channel: Optional[str] = "EMAIL"
    recipient: Optional[str] = None
    message_type: Optional[str] = None
    message: str
    severity: Optional[str] = "MEDIUM"


class TestEmailRequest(BaseModel):
    recipient: str


class TestEmailResponse(BaseModel):
    success: bool
    mode: str
    recipient: Optional[str] = None
    message: str


class NotificationHealthResponse(BaseModel):
    configured: bool
    mode: str
    smtp_host_configured: bool
    smtp_port: int
    smtp_tls: bool
    from_email: str
    auth_configured: bool
    status: str


class PatientCreate(BaseModel):
    patient_id: Optional[str] = None
    full_name: str
    age: int
    gender: str
    phc_id: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    symptoms: Optional[str] = None
    preliminary_diagnosis: Optional[str] = None
    phc_doctor_notes: Optional[str] = None
    prescriptions_summary: Optional[str] = None


class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    symptoms: Optional[str] = None
    preliminary_diagnosis: Optional[str] = None
    phc_doctor_notes: Optional[str] = None
    prescriptions_summary: Optional[str] = None


class PatientRecordReferenceResponse(BaseModel):
    patient_id: str
    full_name: str
    age: int
    gender: str
    phc_id: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    blood_group: Optional[str] = None
    vitals: Optional[Dict[str, Any]] = None
    symptoms: Optional[str] = None
    preliminary_diagnosis: Optional[str] = None
    phc_doctor_notes: Optional[str] = None
    prescriptions_summary: Optional[str] = None
    registered_date: str

    model_config = ConfigDict(from_attributes=True)


# ----------------------------------------------------
# Dashboard & Analytics Schemas
# ----------------------------------------------------
class DashboardStats(BaseModel):
    total_referrals: int
    medium_referrals: int
    emergency_referrals: int
    pending_selection: int
    appointments_booked: int
    emergency_transfers: int
    completed_referrals: int
    not_attended_count: int
    active_hospitals_count: int
    active_phcs_count: int
    recent_referrals: List[ReferralResponse] = []
    unread_notifications: List[NotificationResponse] = []


# ----------------------------------------------------
# Authentication Schemas
# ----------------------------------------------------
class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str
    role: str  # PHC, HOSPITAL, ADMIN
    facility_id: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    role: str
    facility_id: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

