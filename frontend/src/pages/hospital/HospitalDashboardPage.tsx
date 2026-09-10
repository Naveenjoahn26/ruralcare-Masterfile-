import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  Users,
  CheckCircle,
  UserCheck,
  UserX,
  Stethoscope,
  Activity,
  Ambulance,
  Calendar,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  FileCheck,
  AlertCircle,
  Eye,
  GitPullRequest,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Hospital, Referral } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const HospitalDashboardPage: React.FC = () => {
  const { hospitalId = "H001" } = useParams<{ hospitalId: string }>();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async (hospId: string) => {
    try {
      setLoading(true);
      const [hospList, refList] = await Promise.all([
        api.getHospitals(),
        api.getReferrals({ hospital_id: hospId }),
      ]);
      setHospitals(hospList);
      const found = hospList.find((h) => h.hospital_id === hospId) || hospList[0];
      setCurrentHospital(found);
      setReferrals(refList);
    } catch (e) {
      console.error("Failed to load hospital dashboard", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(hospitalId);
  }, [hospitalId]);

  // Actions
  const handleAccept = async (referralId: string) => {
    try {
      setActionLoading(referralId);
      await api.acceptReferral(referralId, "Referral reviewed and accepted by specialty department");
      await loadData(hospitalId);
    } catch (e: any) {
      alert("Failed to accept referral: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttend = async (referralId: string) => {
    try {
      setActionLoading(referralId);
      await api.markPatientAttended(referralId, "Patient arrived at OPD desk");
      await loadData(hospitalId);
    } catch (e: any) {
      alert("Failed to mark attended: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  // KPI Calculations (Section 11)
  const incomingCount = referrals.length;
  const pendingCount = referrals.filter(
    (r) =>
      r.referral_status === "APPOINTMENT_BOOKED" ||
      r.referral_status === "EMERGENCY_TRANSFER" ||
      r.referral_status === "HOSPITAL_SELECTED"
  ).length;
  const todaysAppointmentsCount = referrals.filter(
    (r) => r.referral_status === "APPOINTMENT_BOOKED" || r.referral_status === "REFERRAL_ACCEPTED"
  ).length;
  const attendedCount = referrals.filter(
    (r) =>
      r.referral_status === "PATIENT_ATTENDED" ||
      r.referral_status === "UNDER_TREATMENT" ||
      r.referral_status === "COMPLETED"
  ).length;
  const underTreatmentCount = referrals.filter(
    (r) => r.referral_status === "UNDER_TREATMENT"
  ).length;
  const followupsCount = referrals.filter((r) =>
    r.clinical_cares?.some((c) => c.follow_up_required)
  ).length;

  return (
    <div className="space-y-6">
      {/* Hospital Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            Secondary & Tertiary Clinical Hub • {hospitalId}
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            {currentHospital?.hospital_name || "District Hospital"}
          </h1>
          <p className="text-xs text-indigo-200/80 mt-1 max-w-xl">
            {currentHospital?.district}, {currentHospital?.state} • {currentHospital?.hospital_type} • Member 3 Integration Portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/hospital/${hospitalId}/referrals`}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
          >
            <GitPullRequest className="w-4 h-4" />
            Full Clinical Inflow Queue
          </Link>
        </div>
      </div>

      {/* 6 Metric Cards Grid (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Incoming Referrals */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Incoming Total</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{incomingCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Assigned cases</div>
        </div>

        {/* Pending Acceptance */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <span className="text-[10px] font-bold text-amber-600 uppercase block">Pending Acceptance</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">Awaiting triage</div>
        </div>

        {/* Today's Appointments */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <span className="text-[10px] font-bold text-blue-600 uppercase block">Booked Slots</span>
          <div className="text-2xl font-black text-blue-600 mt-1">{todaysAppointmentsCount}</div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Scheduled slots</div>
        </div>

        {/* Patients Attended */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <span className="text-[10px] font-bold text-emerald-600 uppercase block">Patients Attended</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{attendedCount}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">Reported to OPD</div>
        </div>

        {/* Under Treatment */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200 shadow-xs bg-purple-50/20">
          <span className="text-[10px] font-bold text-purple-600 uppercase block">Under Treatment</span>
          <div className="text-2xl font-black text-purple-600 mt-1">{underTreatmentCount}</div>
          <div className="text-[10px] text-purple-600/70 mt-0.5">Active therapy</div>
        </div>

        {/* Follow-ups */}
        <div className="bg-white p-4 rounded-2xl border border-teal-200 shadow-xs bg-teal-50/20">
          <span className="text-[10px] font-bold text-teal-600 uppercase block">Follow-ups</span>
          <div className="text-2xl font-black text-teal-600 mt-1">{followupsCount}</div>
          <div className="text-[10px] text-teal-600/70 mt-0.5">Review required</div>
        </div>
      </div>

      {/* Incoming Referrals Table (Section 11) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Incoming Patient Referrals Queue ({referrals.length})
            </h2>
          </div>
          <Link
            to={`/hospital/${hospitalId}/referrals`}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            View Filtered Queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Appointment</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-600" />
                    Loading hospital queue...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No incoming referrals currently routed to this hospital.
                  </td>
                </tr>
              ) : (
                referrals.map((r) => {
                  const isActing = actionLoading === r.referral_id;

                  return (
                    <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">
                        <Link to={`/hospital/${hospitalId}/referral/${r.referral_id}`} className="hover:underline">
                          {r.referral_id}
                        </Link>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 font-mono">
                        {r.patient_id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{r.phc_name || r.phc_id}</div>
                        <div className="text-[10px] text-slate-400">{r.phc_district}</div>
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
                          <span className="text-slate-400 italic">Emergency / Open</span>
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
                          {/* 1-Click Accept */}
                          {(r.referral_status === "APPOINTMENT_BOOKED" ||
                            r.referral_status === "EMERGENCY_TRANSFER") && (
                            <button
                              onClick={() => handleAccept(r.referral_id)}
                              disabled={isActing}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle className="w-3 h-3" /> Accept
                            </button>
                          )}

                          {/* 1-Click Mark Received */}
                          {r.referral_status === "REFERRAL_ACCEPTED" && (
                            <button
                              onClick={() => handleAttend(r.referral_id)}
                              disabled={isActing}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <UserCheck className="w-3 h-3" /> Mark Received
                            </button>
                          )}

                          {/* Open Clinical Detail */}
                          <Link
                            to={`/hospital/${hospitalId}/referral/${r.referral_id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                          >
                            <Stethoscope className="w-3 h-3" /> Clinical Care &rarr;
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboardPage;
