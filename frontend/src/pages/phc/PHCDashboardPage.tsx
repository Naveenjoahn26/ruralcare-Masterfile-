import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  CalendarCheck,
  Ambulance,
  AlertTriangle,
  Search,
  ArrowRight,
  Phone,
  Clock,
  Activity,
  CheckCircle2,
  RefreshCw,
  Building2,
  Stethoscope,
  HeartPulse,
  GitPullRequest,
  Eye,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { PHC, Referral, PatientRecordReference, NotificationItem } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const PHCDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { phcId } = useAuth();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<PatientRecordReference[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Outreach Modal state for missed appointments
  const [contactModalPatient, setContactModalPatient] = useState<{
    name: string;
    phone: string;
    referralId: string;
  } | null>(null);

  const loadData = async (targetPhcId: string) => {
    try {
      setLoading(true);
      const [refList, patList, notifList] = await Promise.all([
        api.getPHCReferrals(targetPhcId),
        api.listPatients({ phc_id: targetPhcId, limit: 100 }),
        api.getPHCNotifications(targetPhcId, { unread_only: false, limit: 10 }),
      ]);
      setReferrals(refList);
      setPatients(patList);
      setNotifications(notifList);
    } catch (e) {
      console.error("Failed to load PHC dashboard data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(phcId);
  }, [phcId]);

  const missedReferrals = referrals.filter(
    (r) => r.referral_status === "NOT_ATTENDED" || r.referral_status === "PHC_NOTIFIED"
  );
  const activeReferralsCount = referrals.filter(
    (r) => !["COMPLETED", "CASE_CLOSED"].includes(r.referral_status)
  ).length;
  const upcomingAppointmentsCount = referrals.filter(
    (r) => r.referral_status === "APPOINTMENT_BOOKED" || r.referral_status === "REFERRAL_ACCEPTED"
  ).length;
  const completedReferralsCount = referrals.filter(
    (r) => r.referral_status === "COMPLETED" || r.referral_status === "CASE_CLOSED"
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Primary Health Center Portal • {phcId}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            PHC Clinical Dashboard
          </h1>
          <p className="text-xs text-emerald-100/80 mt-1 max-w-xl">
            Register rural patients, triage care severity, coordinate secondary hospital referrals, and ensure continuity of care.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/phc/patient/new"
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-500/30 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            New Patient Registration & Triage
          </Link>
        </div>
      </div>

      {/* Missed Appointment Alert Banner (Section 4 & 11) */}
      {missedReferrals.length > 0 && (
        <div className="bg-amber-500/10 border-2 border-amber-400 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-black text-amber-900 uppercase tracking-wide">
                Patient Missed Appointment Alert ({missedReferrals.length} Cases)
              </h2>
              <p className="text-xs text-amber-800 mt-0.5">
                Higher hospitals reported patient no-show. ASHA outreach is recommended to verify patient transport and reschedule.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {missedReferrals.slice(0, 2).map((mr) => (
              <button
                key={mr.referral_id}
                onClick={() =>
                  setContactModalPatient({
                    name: `Patient ${mr.patient_id}`,
                    phone: "+91 98421-00000",
                    referralId: mr.referral_id,
                  })
                }
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
              >
                <Phone className="w-3 h-3" /> Outreach {mr.patient_id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Four KPI Cards Grid (Section 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Patients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total Patients</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {patients.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Registered at this PHC
          </div>
        </div>

        {/* Active Referrals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Active Referrals</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GitPullRequest className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {activeReferralsCount}
          </div>
          <div className="text-[11px] text-blue-600/70 mt-1">
            Referred to higher hospital
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Upcoming Appointments</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            {upcomingAppointmentsCount}
          </div>
          <div className="text-[11px] text-indigo-600/70 mt-1">
            Confirmed doctor slots
          </div>
        </div>

        {/* Completed Referrals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-teal-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Completed Referrals</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 mt-2">
            {completedReferralsCount}
          </div>
          <div className="text-[11px] text-teal-600/70 mt-1">
            Treated & Closed cases
          </div>
        </div>
      </div>

      {/* "My Referrals" Table (Section 4 Requirements) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              My Referrals Tracker ({referrals.length} Cases)
            </h2>
          </div>
          <Link
            to="/phc/referrals"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
          >
            View All Referrals <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Hospital</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Appointment</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                    Loading referrals...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No referrals recorded for this PHC yet. Click "New Patient Registration & Triage" to create one.
                  </td>
                </tr>
              ) : (
                referrals.slice(0, 8).map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-emerald-700">
                      <Link to={`/phc/referral/${r.referral_id}`} className="hover:underline">
                        {r.referral_id}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      {r.selected_hospital_name ? (
                        <span className="font-semibold text-slate-800">{r.selected_hospital_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Not Selected</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{r.required_department}</div>
                      {r.required_test && (
                        <div className="text-[10px] text-slate-400">Test: {r.required_test}</div>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-700">
                      {r.appointment_details ? (
                        <span>
                          {r.appointment_details.date} ({r.appointment_details.start_time})
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/phc/referral/${r.referral_id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>

                        {/* If Medium & Hospital selection pending */}
                        {r.severity === "MEDIUM" && r.referral_status === "HOSPITAL_SELECTION_PENDING" && (
                          <Link
                            to={`/phc/referral/${r.referral_id}/hospitals`}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition"
                          >
                            Match Hospital
                          </Link>
                        )}

                        {/* If Medium & Slot booking pending */}
                        {r.severity === "MEDIUM" && r.referral_status === "HOSPITAL_SELECTED" && (
                          <Link
                            to={`/phc/referral/${r.referral_id}/appointment`}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                          >
                            Book Slot
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ASHA Outreach Contact Modal */}
      {contactModalPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">ASHA Worker Outreach Call</h3>
                <p className="text-xs text-slate-500">Missed Appointment Follow-up Protocol</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div>
                Patient: <strong>{contactModalPatient.name}</strong>
              </div>
              <div>
                Phone: <strong className="font-mono text-emerald-700">{contactModalPatient.phone}</strong>
              </div>
              <div>
                Referral ID: <strong className="font-mono text-blue-700">{contactModalPatient.referralId}</strong>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Contact the patient or local village ASHA worker to confirm patient well-being, understand transport barriers, and reschedule the appointment.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setContactModalPatient(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert("Outreach logged! Patient contact notification recorded.");
                  setContactModalPatient(null);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-xs"
              >
                Log Outreach Completed
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PHCDashboardPage;
