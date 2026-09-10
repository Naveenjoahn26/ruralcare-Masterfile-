import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  Activity,
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  BellRing,
  Building2,
  CalendarCheck,
  Ambulance,
  RefreshCw,
  Send,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import api from "../services/api";
import { Referral } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";
import { ReferralTimeline } from "../components/ReferralTimeline";

export const ReferralTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const referralIdParam = searchParams.get("referral_id") || "";

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferralId, setSelectedReferralId] = useState<string>(referralIdParam);
  const [referral, setReferral] = useState<Referral | null>(null);

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simNote, setSimNote] = useState<string>("");
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Load all referrals for selector
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const list = await api.getReferrals();
        setReferrals(list);
        if (!selectedReferralId && list.length > 0) {
          setSelectedReferralId(list[0].referral_id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadRefs();
  }, []);

  // Fetch referral details & lifecycle events
  const fetchReferralDetail = async (id: string) => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getReferral(id);
      setReferral(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedReferralId) {
      fetchReferralDetail(selectedReferralId);
    }
  }, [selectedReferralId]);

  // Simulate status update from Member 3 Higher Hospital
  const handleSimulateStatus = async (
    status:
      | "PATIENT_ATTENDED"
      | "NOT_ATTENDED"
      | "UNDER_TREATMENT"
      | "FOLLOW_UP"
      | "COMPLETED"
      | "CASE_CLOSED"
  ) => {
    if (!referral) return;
    try {
      setSimulating(true);
      setFeedbackMsg(null);
      const updated = await api.updateHospitalStatus(
        referral.referral_id,
        status,
        simNote || `Updated status by Higher Hospital Doctor: ${status}`
      );
      setReferral(updated);
      setSimNote("");

      if (status === "NOT_ATTENDED") {
        setFeedbackMsg(
          "⚠️ Status updated to NOT_ATTENDED! Central Platform automatically generated an alert notification for Member 1 PHC portal and appended PHC_NOTIFIED to the timeline."
        );
      } else {
        setFeedbackMsg(`✓ Successfully transitioned status to ${status}.`);
      }
    } catch (err: any) {
      console.error(err);
      alert("Simulation failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setSimulating(false);
    }
  };

  // Steps in standard lifecycle
  const standardSteps = [
    { key: "REFERRAL_CREATED", label: "Created at PHC" },
    { key: "HOSPITAL_SELECTED", label: "Hospital Chosen" },
    { key: "APPOINTMENT_BOOKED", label: "Slot Booked" },
    { key: "PATIENT_ATTENDED", label: "Patient Attended" },
    { key: "UNDER_TREATMENT", label: "Under Treatment" },
    { key: "COMPLETED", label: "Case Completed" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded w-fit mb-2 border border-indigo-200">
            <Activity className="w-3.5 h-3.5" /> End-to-End Referral Lifecycle
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Referral Status Tracking & Lifecycle Audit
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Visual progression monitoring and Member 3 (Higher Hospital) status synchronization hub.
          </p>
        </div>

        {referral && (
          <div className="flex items-center gap-2">
            <SeverityBadge severity={referral.severity} />
            <StatusBadge status={referral.referral_status} />
          </div>
        )}
      </div>

      {/* Referral Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700 shrink-0">Track Referral:</span>
          <select
            value={selectedReferralId}
            onChange={(e) => setSelectedReferralId(e.target.value)}
            className="w-full sm:w-80 p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
          >
            {referrals.map((r) => (
              <option key={r.referral_id} value={r.referral_id}>
                {r.referral_id} • Patient {r.patient_id} ({r.severity} - {r.referral_status})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => selectedReferralId && fetchReferralDetail(selectedReferralId)}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Visual Stepper Progression Tracker */}
      {referral && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="font-bold text-slate-900 text-sm">Lifecycle Stage Progression:</h2>

          {/* Stepper Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {standardSteps.map((step, idx) => {
              const hasOccurred = referral.events?.some(
                (e) => e.to_status === step.key || e.from_status === step.key
              );
              const isCurrent = referral.referral_status === step.key;

              return (
                <div
                  key={step.key}
                  className={`p-3 rounded-xl border flex flex-col justify-between gap-1 text-xs transition ${
                    isCurrent
                      ? "bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-200"
                      : hasOccurred
                      ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold opacity-75">STEP 0{idx + 1}</span>
                    {hasOccurred ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 opacity-50" />
                    )}
                  </div>
                  <div className="font-bold">{step.label}</div>
                  <div className="text-[10px] font-mono opacity-80">{step.key}</div>
                </div>
              );
            })}
          </div>

          {/* Exception indicators (NOT_ATTENDED / EMERGENCY) */}
          {(referral.referral_status === "NOT_ATTENDED" ||
            referral.referral_status === "PHC_NOTIFIED" ||
            referral.referral_status === "EMERGENCY_TRANSFER") && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
              <span className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Active Special State: {referral.referral_status}
              </span>
              <span className="text-[11px] text-rose-600">
                Out-of-band workflow active (PHC outreach / Emergency triage)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Member 3 Simulation / Status Update Control Panel */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sliders className="w-3.5 h-3.5" /> Higher Hospital Portal Simulation (Member 3 Webhook)
            </div>
            <h3 className="text-base font-bold">
              Simulate Clinical Status Callbacks from Receiving Hospital
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            PATCH /api/v1/referrals/:id/hospital-status
          </span>
        </div>

        <p className="text-xs text-slate-300">
          Click any of the action buttons below to test how the Central Platform processes real-time clinical events submitted by Member 3 doctors:
        </p>

        {/* Optional clinical note */}
        <input
          type="text"
          placeholder="Optional doctor/clinical progress notes for this transition..."
          value={simNote}
          onChange={(e) => setSimNote(e.target.value)}
          className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleSimulateStatus("PATIENT_ATTENDED")}
            disabled={simulating}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5" /> Patient Attended
          </button>

          <button
            onClick={() => handleSimulateStatus("NOT_ATTENDED")}
            disabled={simulating}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <UserX className="w-3.5 h-3.5" /> Patient Did NOT Attend (Triggers PHC Alert!)
          </button>

          <button
            onClick={() => handleSimulateStatus("UNDER_TREATMENT")}
            disabled={simulating}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Activity className="w-3.5 h-3.5" /> Under Treatment
          </button>

          <button
            onClick={() => handleSimulateStatus("COMPLETED")}
            disabled={simulating}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed / Discharged
          </button>
        </div>

        {feedbackMsg && (
          <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-emerald-300 font-medium">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* Comprehensive Audit Trail Timeline */}
      {referral && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">
            Detailed Lifecycle Audit Log ({referral.events?.length || 0} Events)
          </h3>
          <ReferralTimeline events={referral.events} />
        </div>
      )}
    </div>
  );
};
