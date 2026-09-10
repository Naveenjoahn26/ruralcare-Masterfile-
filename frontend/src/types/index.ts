export type Severity = "NORMAL" | "MEDIUM" | "EMERGENCY";

export type ReferralStatus =
  | "REFERRAL_CREATED"
  | "HOSPITAL_SELECTION_PENDING"
  | "HOSPITAL_SELECTED"
  | "APPOINTMENT_BOOKED"
  | "EMERGENCY_TRANSFER_PENDING"
  | "EMERGENCY_TRANSFER"
  | "REFERRED"
  | "REFERRAL_ACCEPTED"
  | "PATIENT_ATTENDED"
  | "NOT_ATTENDED"
  | "PHC_NOTIFIED"
  | "UNDER_TREATMENT"
  | "FOLLOW_UP"
  | "COMPLETED"
  | "CASE_CLOSED"
  | "RESCHEDULED";

export interface PHC {
  phc_id: string;
  phc_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
}

export interface Department {
  department_id: string;
  hospital_id: string;
  department_name: string;
  available: "YES" | "NO";
}

export interface Doctor {
  doctor_id: string;
  hospital_id: string;
  department_id: string;
  doctor_name: string;
  specialization: string;
  status: "AVAILABLE" | "BUSY" | "ON_LEAVE";
}

export interface AppointmentSlot {
  slot_id: string;
  hospital_id: string;
  doctor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "CANCELLED";
  doctor_name?: string;
  department_name?: string;
}

export interface TestItem {
  test_id: string;
  hospital_id: string;
  test_name: string;
  availability: "AVAILABLE" | "LIMITED" | "NOT_AVAILABLE";
}

export interface MedicineItem {
  medicine_id: string;
  hospital_id: string;
  medicine_name: string;
  stock_status: "IN_STOCK" | "LOW_STOCK" | "NOT_IN_STOCK";
}

export interface EmergencyResource {
  hospital_id: string;
  emergency_available: "YES" | "NO";
  icu_available: "YES" | "NO";
  oxygen_available: "YES" | "NO";
  ambulance_available: "YES" | "NO";
  emergency_beds: number;
  icu_beds_available: number;
  estimated_wait_minutes: number;
}

export interface Hospital {
  hospital_id: string;
  hospital_name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  hospital_type: string;
  emergency_service: "YES" | "NO";
  contact_number?: string;
  ambulance_number?: string;
  departments?: Department[];
  doctors?: Doctor[];
  tests?: TestItem[];
  medicines?: MedicineItem[];
  emergency_resource?: EmergencyResource;
  available_slots?: AppointmentSlot[];
}

export interface ReferralEvent {
  id: number;
  event_id: string;
  referral_id: string;
  from_status?: string;
  to_status: ReferralStatus;
  actor_role: string;
  description: string;
  created_at: string;
}

export interface ClinicalCare {
  care_id: string;
  referral_id: string;
  hospital_id: string;
  patient_id: string;
  doctor_name?: string;
  consultation_notes?: string;
  diagnosis: string;
  tests_ordered?: string;
  test_results?: string;
  prescriptions?: string;
  treatment_notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  follow_up_notes?: string;
  outcome_status: string;
  created_at: string;
  updated_at?: string;
}

export interface LocalConsultation {
  consultation_id: string;
  patient_id: string;
  phc_id: string;
  symptoms?: string;
  diagnosis: string;
  prescriptions?: string;
  doctor_notes?: string;
  status: string;
  created_at: string;
}

export interface Referral {
  referral_id: string;
  patient_id: string;
  phc_id: string;
  phc_name?: string;
  phc_district?: string;
  severity: Severity;
  required_department: string;
  required_test?: string;
  reason?: string;
  selected_hospital_id?: string;
  selected_hospital_name?: string;
  appointment_slot_id?: string;
  appointment_details?: AppointmentSlot;
  referral_status: ReferralStatus;
  created_date: string;
  updated_at?: string;
  events: ReferralEvent[];
  clinical_cares?: ClinicalCare[];
  notification_sent?: boolean;
  notification_status?: string;
  notification_channel?: string;
  notification_recipient?: string;
  notification_message?: string;
}

export interface MatchingHospitalResult {
  hospital_id: string;
  hospital_name: string;
  hospital_type: string;
  district: string;
  state: string;
  distance_km: number;
  latitude: number;
  longitude: number;
  department_available: boolean;
  doctor_available: boolean;
  available_doctors: string[];
  test_available: boolean;
  test_status: string;
  appointment_available: boolean;
  available_slots_count: number;
  emergency_available: boolean;
  emergency_beds: number;
  icu_beds_available: number;
  oxygen_available: boolean;
  ambulance_available: boolean;
  estimated_wait_minutes: number;
  contact_number?: string;
  ambulance_number?: string;
  score: number;
  match_reasons: string[];
  is_recommended: boolean;
}

export interface MatchingResponse {
  severity: Severity;
  phc_id: string;
  phc_name: string;
  required_department?: string;
  required_test?: string;
  referral_id?: string;
  recommended_hospital?: MatchingHospitalResult;
  hospitals: MatchingHospitalResult[];
  total_candidates: number;
}

export interface NotificationItem {
  id: number;
  notification_id: string;
  phc_id: string;
  referral_id: string;
  patient_id: string;
  patient_name?: string;
  event_type: string;
  channel?: string;
  recipient?: string;
  message_type?: string;
  message: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  status?: string;
  is_read: boolean;
  sent_at?: string;
  created_at: string;
}

export interface NotificationHealth {
  configured: boolean;
  mode: string;
  smtp_host_configured: boolean;
  smtp_port: number;
  smtp_tls: boolean;
  from_email: string;
  auth_configured: boolean;
  status: string;
}

export interface TestEmailResponse {
  success: boolean;
  mode: string;
  recipient?: string;
  message: string;
}


export interface PatientVitals {
  blood_pressure?: string;
  pulse_rate?: string;
  spo2?: string;
  temperature?: string;
  weight_kg?: number;
  blood_glucose_random?: string;
  [key: string]: any;
}

export interface PatientRecordReference {
  patient_id: string;
  full_name: string;
  age: number;
  gender: string;
  phc_id: string;
  contact_number?: string;
  email?: string;
  address?: string;
  blood_group?: string;
  vitals?: PatientVitals;
  symptoms?: string;
  preliminary_diagnosis?: string;
  phc_doctor_notes?: string;
  prescriptions_summary?: string;
  registered_date: string;
}

export interface DashboardStats {
  total_referrals: number;
  medium_referrals: number;
  emergency_referrals: number;
  pending_selection: number;
  appointments_booked: number;
  emergency_transfers: number;
  completed_referrals: number;
  not_attended_count: number;
  active_hospitals_count: number;
  active_phcs_count: number;
  recent_referrals: Referral[];
  unread_notifications: NotificationItem[];
}
