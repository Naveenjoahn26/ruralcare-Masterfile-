import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Public Pages
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { ProtectedRoute } from "../components/ProtectedRoute";

// Layouts
import { PHCLayout } from "../layouts/PHCLayout";
import { AdminLayout } from "../layouts/AdminLayout";
import { HospitalLayout } from "../layouts/HospitalLayout";

// PHC Pages
import { PHCDashboardPage } from "../pages/phc/PHCDashboardPage";
import { PHCPatientRegistration } from "../pages/phc/PHCPatientRegistration";
import { PHCPatientsPage } from "../pages/phc/PHCPatientsPage";
import { PHCReferralsPage } from "../pages/phc/PHCReferralsPage";
import { PHCReferralDetailPage } from "../pages/phc/PHCReferralDetailPage";
import { PHCHospitalMatchingPage } from "../pages/phc/PHCHospitalMatchingPage";
import { PHCAppointmentBookingPage } from "../pages/phc/PHCAppointmentBookingPage";
import { PHCEmergencyPage } from "../pages/phc/PHCEmergencyPage";
import { PHCNotificationsPage } from "../pages/phc/PHCNotificationsPage";

// Higher Hospital Pages
import { HospitalDashboardPage } from "../pages/hospital/HospitalDashboardPage";
import { HospitalReferralsPage } from "../pages/hospital/HospitalReferralsPage";
import { HospitalReferralDetailPage } from "../pages/hospital/HospitalReferralDetailPage";
import { HospitalPatientsPage } from "../pages/hospital/HospitalPatientsPage";
import { HospitalFollowupsPage } from "../pages/hospital/HospitalFollowupsPage";

// Central Admin Pages
import { AdminDashboardPage } from "../pages/admin/AdminDashboardPage";
import { AdminReferralMonitor } from "../pages/admin/AdminReferralMonitor";
import { AdminPHCsPage } from "../pages/admin/AdminPHCsPage";
import { AdminHospitalsPage } from "../pages/admin/AdminHospitalsPage";
import { AdminAppointmentsPage } from "../pages/admin/AdminAppointmentsPage";
import { AdminEmergenciesPage } from "../pages/admin/AdminEmergenciesPage";
import { AdminNotificationPage } from "../pages/admin/AdminNotificationPage";

const HospitalRootRedirect = () => {
  const { hospitalId } = useAuth();
  return <Navigate to={`/hospital/${hospitalId || 'H001'}/dashboard`} replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* 1. Public Landing Page */}
      <Route path="/" element={<LandingPage />} />

      {/* 2. Authentication / Role Selection Page */}
      <Route path="/login" element={<LoginPage />} />

      {/* 3. PHC Worker Dedicated Portal */}
      <Route path="/phc" element={<ProtectedRoute requiredRole="PHC"><PHCLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/phc/dashboard" replace />} />
        <Route path="dashboard" element={<PHCDashboardPage />} />
        <Route path="patient/new" element={<PHCPatientRegistration />} />
        <Route path="patient/:patientId" element={<PHCPatientRegistration />} />
        <Route path="patients" element={<PHCPatientsPage />} />
        <Route path="referrals" element={<PHCReferralsPage />} />
        <Route path="referral/:referralId" element={<PHCReferralDetailPage />} />
        <Route path="referral/:referralId/hospitals" element={<PHCHospitalMatchingPage />} />
        <Route path="referral/:referralId/appointment" element={<PHCAppointmentBookingPage />} />
        <Route path="referral/:referralId/emergency" element={<PHCEmergencyPage />} />
        <Route path="appointments" element={<PHCAppointmentBookingPage />} />
        <Route path="notifications" element={<PHCNotificationsPage />} />
      </Route>

      {/* 4. Higher Hospital Dedicated Portal */}
      <Route path="/hospital" element={<HospitalRootRedirect />} />
      <Route path="/hospital/:hospitalId" element={<ProtectedRoute requiredRole="HOSPITAL"><HospitalLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<HospitalDashboardPage />} />
        <Route path="referrals" element={<HospitalReferralsPage />} />
        <Route path="referral/:referralId" element={<HospitalReferralDetailPage />} />
        <Route path="patients" element={<HospitalPatientsPage />} />
        <Route path="followups" element={<HospitalFollowupsPage />} />
      </Route>

      {/* 5. Central Admin Dedicated Portal */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="referrals" element={<AdminReferralMonitor />} />
        <Route path="phcs" element={<AdminPHCsPage />} />
        <Route path="hospitals" element={<AdminHospitalsPage />} />
        <Route path="appointments" element={<AdminAppointmentsPage />} />
        <Route path="emergencies" element={<AdminEmergenciesPage />} />
        <Route path="notifications" element={<AdminNotificationPage />} />
      </Route>

      {/* Fallback to Landing Page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
