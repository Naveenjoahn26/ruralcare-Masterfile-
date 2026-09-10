import axios from "axios";
import {
  Referral,
  MatchingResponse,
  DashboardStats,
  Hospital,
  PHC,
  AppointmentSlot,
  PatientRecordReference,
  NotificationItem,
  NotificationHealth,
  TestEmailResponse,
  ClinicalCare,
  LocalConsultation,
} from "../types";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
// We rely on HttpOnly cookie-based JWT; the browser will send cookies automatically

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't redirect for auth endpoints — AuthContext handles those gracefully
      const requestUrl = error.config?.url || "";
      const isAuthEndpoint =
        requestUrl.includes("/auth/me") || requestUrl.includes("/auth/login");

      if (!isAuthEndpoint) {
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/"
        ) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  login: async (payload: any): Promise<any> => {
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },

  getMe: async (): Promise<any> => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },

  logout: async (): Promise<any> => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get("/dashboard/stats");
    return res.data;
  },

  // Referrals
  getReferrals: async (params?: {
    severity?: string;
    status?: string;
    phc_id?: string;
    hospital_id?: string;
    search?: string;
  }): Promise<Referral[]> => {
    const res = await apiClient.get("/referrals", { params });
    return res.data;
  },

  getReferral: async (referralId: string): Promise<Referral> => {
    const res = await apiClient.get(`/referrals/${referralId}`);
    return res.data;
  },

  createReferral: async (payload: {
    patient_id: string;
    phc_id: string;
    severity: "MEDIUM" | "EMERGENCY";
    required_department: string;
    required_test?: string;
    reason?: string;
  }): Promise<Referral> => {
    const res = await apiClient.post("/referrals", payload);
    return res.data;
  },

  recordHospitalSelection: async (
    referralId: string,
    hospitalId: string
  ): Promise<Referral> => {
    const res = await apiClient.post(
      `/referrals/${referralId}/hospital-selection`,
      { hospital_id: hospitalId }
    );
    return res.data;
  },

  initiateEmergencyTransfer: async (
    referralId: string,
    hospitalId?: string,
    notes?: string
  ): Promise<Referral> => {
    const res = await apiClient.post(
      `/referrals/${referralId}/emergency-transfer`,
      { hospital_id: hospitalId, notes }
    );
    return res.data;
  },

  updateReferralStatus: async (
    referralId: string,
    status: string,
    description?: string
  ): Promise<Referral> => {
    const res = await apiClient.patch(`/referrals/${referralId}/status`, {
      status,
      description,
    });
    return res.data;
  },

  // Higher Hospital Actions
  acceptReferral: async (
    referralId: string,
    notes?: string
  ): Promise<Referral> => {
    const res = await apiClient.post(`/referrals/${referralId}/accept`, {
      notes,
    });
    return res.data;
  },

  markPatientAttended: async (
    referralId: string,
    notes?: string
  ): Promise<Referral> => {
    const res = await apiClient.post(`/referrals/${referralId}/attend`, {
      notes,
    });
    return res.data;
  },

  markPatientNotAttended: async (
    referralId: string,
    reason?: string
  ): Promise<Referral> => {
    const res = await apiClient.post(`/referrals/${referralId}/not-attended`, {
      reason,
    });
    return res.data;
  },

  recordClinicalCare: async (
    referralId: string,
    payload: {
      doctor_name?: string;
      consultation_notes?: string;
      diagnosis: string;
      tests_ordered?: string;
      test_results?: string;
      prescriptions?: string;
      treatment_notes?: string;
      follow_up_required?: boolean;
      follow_up_date?: string;
      follow_up_notes?: string;
      outcome_status: "UNDER_TREATMENT" | "FOLLOW_UP" | "COMPLETED" | "CASE_CLOSED";
    }
  ): Promise<Referral> => {
    const res = await apiClient.post(
      `/referrals/${referralId}/clinical-care`,
      payload
    );
    return res.data;
  },

  // Member 3 Integration Webhook Callback
  updateHospitalStatus: async (
    referralId: string,
    status:
      | "REFERRAL_ACCEPTED"
      | "PATIENT_ATTENDED"
      | "NOT_ATTENDED"
      | "UNDER_TREATMENT"
      | "FOLLOW_UP"
      | "COMPLETED"
      | "CASE_CLOSED",
    notes?: string
  ): Promise<Referral> => {
    const res = await apiClient.patch(
      `/referrals/${referralId}/hospital-status`,
      {
        status,
        notes,
      }
    );
    return res.data;
  },

  // Matching Engines
  matchMedium: async (payload: {
    phc_id: string;
    required_department: string;
    required_test?: string;
    referral_id?: string;
  }): Promise<MatchingResponse> => {
    const res = await apiClient.post("/matching/medium", payload);
    return res.data;
  },

  matchEmergency: async (payload: {
    phc_id: string;
    required_department?: string;
    required_test?: string;
    referral_id?: string;
  }): Promise<MatchingResponse> => {
    const res = await apiClient.post("/matching/emergency", payload);
    return res.data;
  },

  // Hospitals & Slots
  getHospitals: async (params?: {
    district?: string;
    department?: string;
    emergency?: string;
    test?: string;
    search?: string;
  }): Promise<Hospital[]> => {
    const res = await apiClient.get("/hospitals", { params });
    return res.data;
  },

  getHospital: async (hospitalId: string): Promise<Hospital> => {
    const res = await apiClient.get(`/hospitals/${hospitalId}`);
    return res.data;
  },

  getHospitalSlots: async (
    hospitalId: string,
    params?: {
      department_id?: string;
      doctor_id?: string;
      date?: string;
      status?: string;
    }
  ): Promise<AppointmentSlot[]> => {
    const res = await apiClient.get(`/hospitals/${hospitalId}/slots`, {
      params,
    });
    return res.data;
  },

  bookAppointment: async (payload: {
    referral_id: string;
    hospital_id: string;
    slot_id: string;
  }): Promise<Referral> => {
    const res = await apiClient.post("/appointments/book", payload);
    return res.data;
  },

  // PHCs & Patient Records
  getPHCs: async (): Promise<PHC[]> => {
    const res = await apiClient.get("/phcs");
    return res.data;
  },

  getPHCReferrals: async (
    phcId: string,
    params?: {
      status?: string;
      severity?: string;
      search?: string;
    }
  ): Promise<Referral[]> => {
    const res = await apiClient.get(`/phcs/${phcId}/referrals`, { params });
    return res.data;
  },

  getPHCNotifications: async (
    phcId: string,
    params?: {
      unread_only?: boolean;
      limit?: number;
    }
  ): Promise<NotificationItem[]> => {
    const res = await apiClient.get(`/phcs/${phcId}/notifications`, { params });
    return res.data;
  },

  listPatients: async (params?: {
    search?: string;
    phc_id?: string;
    limit?: number;
  }): Promise<PatientRecordReference[]> => {
    const res = await apiClient.get("/patients", { params });
    return res.data;
  },

  getPatient: async (patientId: string): Promise<PatientRecordReference> => {
    const res = await apiClient.get(`/patients/${patientId}`);
    return res.data;
  },

  getPatientRecords: async (
    patientId: string
  ): Promise<PatientRecordReference> => {
    const res = await apiClient.get(`/patients/${patientId}/records`);
    return res.data;
  },

  createPatient: async (payload: {
    patient_id?: string;
    full_name: string;
    age: number;
    gender: string;
    phc_id: string;
    contact_number?: string;
    email?: string;
    address?: string;
    blood_group?: string;
    vitals?: any;
    symptoms?: string;
    preliminary_diagnosis?: string;
    phc_doctor_notes?: string;
    prescriptions_summary?: string;
  }): Promise<PatientRecordReference> => {
    const res = await apiClient.post("/patients", payload);
    return res.data;
  },

  updatePatient: async (
    patientId: string,
    payload: any
  ): Promise<PatientRecordReference> => {
    const res = await apiClient.put(`/patients/${patientId}`, payload);
    return res.data;
  },

  recordLocalConsultation: async (
    patientId: string,
    payload: {
      symptoms?: string;
      diagnosis: string;
      prescriptions?: string;
      doctor_notes?: string;
    }
  ): Promise<LocalConsultation> => {
    const res = await apiClient.post(
      `/patients/${patientId}/consultations/local`,
      payload
    );
    return res.data;
  },

  // Notifications
  getNotifications: async (params?: {
    phc_id?: string;
    channel?: string;
    event_type?: string;
    status?: string;
    unread_only?: boolean;
    limit?: number;
  }): Promise<NotificationItem[]> => {
    const res = await apiClient.get("/notifications", { params });
    return res.data;
  },

  sendNotification: async (payload: {
    phc_id: string;
    referral_id: string;
    patient_id: string;
    event_type: string;
    channel?: string;
    recipient?: string;
    message_type?: string;
    message: string;
    severity?: string;
  }): Promise<NotificationItem> => {
    const res = await apiClient.post("/notifications/send", payload);
    return res.data;
  },

  markNotificationRead: async (
    notificationId: string
  ): Promise<NotificationItem> => {
    const res = await apiClient.patch(`/notifications/${notificationId}/read`);
    return res.data;
  },

  getNotificationHealth: async (): Promise<NotificationHealth> => {
    const res = await apiClient.get("/notifications/health");
    return res.data;
  },

  sendTestEmail: async (recipient: string): Promise<TestEmailResponse> => {
    const res = await apiClient.post("/notifications/test-email", { recipient });
    return res.data;
  },


  // Admin / Demo Reseed
  resetSeedDatabase: async (): Promise<{ status: string; message: string }> => {
    const res = await apiClient.post("/seed/reset");
    return res.data;
  },
};

export default api;

