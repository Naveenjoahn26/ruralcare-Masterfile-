import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  GitPullRequest,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  UserCheck,
  UserX,
  Stethoscope,
  Eye,
  AlertCircle,
  Clock,
  CheckCircle2,
  CalendarCheck,
  Ambulance,
} from "lucide-react";
import api from "../../services/api";
import { Referral } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const HospitalReferralsPage: React.FC = () => {
  const { hospitalId = "H001" } = useParams<{ hospitalId: string }>();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "PENDING" | "ACCEPTED" | "ATTENDED" | "EMERGENCY" | "COMPLETED" | "MISSED"
  >("PENDING");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadReferrals = async () => {
    try {
      setLoading(true);
      const data = await api.getReferrals({ hospital_id: hospitalId });
      setReferrals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals();
  }, [hospitalId]);

  const handleAccept = async (referralId: string) => {
    try {
      setActionLoading(referralId);
      await api.acceptReferral(referralId, "Referral accepted by department doctor");
      await loadReferrals();
    } catch (e: any) {
      alert("Failed to accept referral: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAttend = async (referralId: string) => {
    try {
      setActionLoading(referralId);
      await api.markPatientAttended(referralId, "Patient reported at OPD registration desk");
      await loadReferrals();
    } catch (e: any) {
      alert("Failed to mark attended: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(null);
    }
  };

  const handleNotAttended = async (referralId: string) => {
    const reason = window.prompt(
      "Reason for patient absence / no-show:",
      "Patient did not report for scheduled appointment slot"
    );
    if (reason !== null) {
      try {
        setActionLoading(referralId);
        await api.markPatientNotAttended(referralId, reason);
        await loadReferrals();
      } catch (e: any) {
        alert("Failed to mark not attended: " + (e?.response?.data?.detail || e.message));
      } finally {
        setActionLoading(null);
      }
    }
  };

  // Filter referrals by Tab & Search
  const filteredReferrals = referrals.filter((r) => {
    if (activeTab === "PENDING") {
      if (
        !["APPOINTMENT_BOOKED", "EMERGENCY_TRANSFER", "HOSPITAL_SELECTED", "REFERRED"].includes(
          r.referral_status
        )
      )
        return false;
    } else if (activeTab === "ACCEPTED") {
      if (r.referral_status !== "REFERRAL_ACCEPTED") return false;
    } else if (activeTab === "ATTENDED") {
      if (!["PATIENT_ATTENDED", "UNDER_TREATMENT", "FOLLOW_UP"].includes(r.referral_status))
        return false;
    } else if (activeTab === "EMERGENCY") {
      if (r.severity !== "EMERGENCY") return false;
    } else if (activeTab === "COMPLETED") {
      if (!["COMPLETED", "CASE_CLOSED"].includes(r.referral_status)) return false;
    } else if (activeTab === "MISSED") {
      if (!["NOT_ATTENDED", "PHC_NOTIFIED"].includes(r.referral_status)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = r.referral_id.toLowerCase().includes(q);
      const matchPatient = r.patient_id.toLowerCase().includes(q);
      const matchDept = (r.required_department || "").toLowerCase().includes(q);
      const matchPHC = (r.phc_name || r.phc_id).toLowerCase().includes(q);
      if (!matchId && !matchPatient && !matchDept && !matchPHC) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              CLINICAL INFLOW QUEUE
            </span>
            <span className="text-slate-400 text-xs font-mono">Hospital: {hospitalId}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Incoming Referral Management ({referrals.length} Cases)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming cases from rural PHCs, accept appointments, record patient arrivals, and input treatment care notes.
          </p>
        </div>

        <button
          onClick={loadReferrals}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: "All Referrals", count: referrals.length },
            {
              id: "PENDING",
              label: "Pending Acceptance",
              count: referrals.filter((r) =>
                ["APPOINTMENT_BOOKED", "EMERGENCY_TRANSFER", "HOSPITAL_SELECTED"].includes(
                  r.referral_status
                )
              ).length,
            },
            {
              id: "ACCEPTED",
              label: "Accepted",
              count: referrals.filter((r) => r.referral_status === "REFERRAL_ACCEPTED").length,
            },
            {
              id: "ATTENDED",
              label: "Attended / Active",
              count: referrals.filter((r) =>
                ["PATIENT_ATTENDED", "UNDER_TREATMENT", "FOLLOW_UP"].includes(r.referral_status)
              ).length,
            },
            {
              id: "EMERGENCY",
              label: "Emergency 108",
              count: referrals.filter((r) => r.severity === "EMERGENCY").length,
            },
            {
              id: "COMPLETED",
              label: "Completed",
              count: referrals.filter((r) =>
                ["COMPLETED", "CASE_CLOSED"].includes(r.referral_status)
              ).length,
            },
            {
              id: "MISSED",
              label: "Missed",
              count: referrals.filter((r) =>
                ["NOT_ATTENDED", "PHC_NOTIFIED"].includes(r.referral_status)
              ).length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === tab.id ? "bg-indigo-700 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Referral ID, Patient, PHC, Dept..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Referrals Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Required Department</th>
                <th className="p-3.5">Appointment Window</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-600" />
                    Loading queue...
                  </td>
                </tr>
              ) : filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No referrals found for the selected tab.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => {
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
                          <span className="text-slate-400 italic">Open / Urgent</span>
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
                            <>
                              <button
                                onClick={() => handleAttend(r.referral_id)}
                                disabled={isActing}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                              >
                                <UserCheck className="w-3 h-3" /> Mark Received
                              </button>
                              <button
                                onClick={() => handleNotAttended(r.referral_id)}
                                disabled={isActing}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Mark Not Attended"
                              >
                                <UserX className="w-3 h-3" /> No-show
                              </button>
                            </>
                          )}

                          {/* Open Full Clinical Record & Care Form */}
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

export default HospitalReferralsPage;
