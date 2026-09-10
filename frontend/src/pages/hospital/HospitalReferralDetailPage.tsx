import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserX,
  FileText,
  Clock,
  Send,
  Pill,
  FlaskConical,
  CalendarCheck,
  RefreshCw,
  HeartPulse,
  Printer,
  ShieldCheck,
  FileCheck,
} from "lucide-react";
import api from "../../services/api";
import { Referral, PatientRecordReference } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { ReferralTimeline } from "../../components/ReferralTimeline";

export const HospitalReferralDetailPage: React.FC = () => {
  const { hospitalId = "H001", referralId } = useParams<{ hospitalId: string; referralId: string }>();
  const navigate = useNavigate();

  const [referral, setReferral] = useState<Referral | null>(null);
  const [patient, setPatient] = useState<PatientRecordReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCare, setSavingCare] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Clinical Care Form
  const [doctorName, setDoctorName] = useState("Dr. Anjali Krishnan");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [testsOrdered, setTestsOrdered] = useState("");
  const [testResults, setTestResults] = useState("");
  const [prescriptions, setPrescriptions] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("2026-09-20");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [outcomeStatus, setOutcomeStatus] = useState<
    "UNDER_TREATMENT" | "FOLLOW_UP" | "COMPLETED" | "CASE_CLOSED"
  >("UNDER_TREATMENT");

  const loadData = async () => {
    if (!referralId) return;
    try {
      setLoading(true);
      const refData = await api.getReferral(referralId);
      setReferral(refData);
      if (refData.patient_id) {
        const patData = await api.getPatient(refData.patient_id);
        setPatient(patData);
      }

      // Pre-fill latest care if exists
      if (refData.clinical_cares && refData.clinical_cares.length > 0) {
        const latest = refData.clinical_cares[refData.clinical_cares.length - 1];
        setDoctorName(latest.doctor_name || "Dr. Specialist");
        setConsultationNotes(latest.consultation_notes || "");
        setDiagnosis(latest.diagnosis || "");
        setTestsOrdered(latest.tests_ordered || "");
        setTestResults(latest.test_results || "");
        setPrescriptions(latest.prescriptions || "");
        setTreatmentNotes(latest.treatment_notes || "");
        setFollowUpRequired(latest.follow_up_required || false);
        setFollowUpDate(latest.follow_up_date || "");
        setFollowUpNotes(latest.follow_up_notes || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [referralId]);

  const handleAcceptReferral = async () => {
    if (!referralId) return;
    try {
      setActionLoading(true);
      await api.acceptReferral(referralId, "Referral accepted by Higher Hospital department doctor");
      setSuccessMessage("Referral accepted successfully!");
      await loadData();
    } catch (e: any) {
      alert("Failed to accept referral: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAttended = async () => {
    if (!referralId) return;
    try {
      setActionLoading(true);
      await api.markPatientAttended(referralId, "Patient reported at hospital reception / OPD desk");
      setSuccessMessage("Patient marked as attended!");
      await loadData();
    } catch (e: any) {
      alert("Failed to mark attended: " + (e?.response?.data?.detail || e.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveClinicalCare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralId) return;
    if (!diagnosis.trim()) {
      alert("Please enter a specialist clinical diagnosis.");
      return;
    }

    try {
      setSavingCare(true);
      setSuccessMessage(null);
      await api.recordClinicalCare(referralId, {
        doctor_name: doctorName,
        consultation_notes: consultationNotes,
        diagnosis,
        tests_ordered: testsOrdered,
        test_results: testResults,
        prescriptions,
        treatment_notes: treatmentNotes,
        follow_up_required: followUpRequired,
        follow_up_date: followUpRequired ? followUpDate : undefined,
        follow_up_notes: followUpRequired ? followUpNotes : undefined,
        outcome_status: outcomeStatus,
      });

      setSuccessMessage(
        `Clinical care recorded successfully! Referral status updated to ${outcomeStatus}.`
      );
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert("Failed to save clinical care: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSavingCare(false);
    }
  };

  if (loading || !referral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading Referral Clinical Dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/hospital/${hospitalId}/referrals`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Referrals Queue
        </Link>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" /> Print Clinical Dossier
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Case Header Banner (Section 12) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-black text-xl text-indigo-700">
                {referral.referral_id}
              </span>
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Specialist Clinical Care & Consultation Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Referred by: <strong>{referral.phc_name || referral.phc_id}</strong> • Target Dept: <strong>{referral.required_department}</strong>
            </p>
          </div>

          {/* Quick Action Buttons for Hospital Staff */}
          <div className="flex items-center gap-2">
            {(referral.referral_status === "APPOINTMENT_BOOKED" ||
              referral.referral_status === "EMERGENCY_TRANSFER") && (
              <button
                onClick={handleAcceptReferral}
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Accept Referral
              </button>
            )}

            {referral.referral_status === "REFERRAL_ACCEPTED" && (
              <button
                onClick={handleMarkAttended}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" /> Mark Patient Received
              </button>
            )}
          </div>
        </div>

        {/* 4 Overview Columns (Section 12) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Patient Details:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {patient?.full_name || referral.patient_id}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              ID: {referral.patient_id} • {patient?.age || "-"}y / {patient?.gender || "-"}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Originating PHC:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {referral.phc_name || referral.phc_id}
            </div>
            <div className="text-[10px] text-slate-500">ID: {referral.phc_id}</div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Department & Test:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {referral.required_department}
            </div>
            <div className="text-[10px] text-slate-500">
              Test: {referral.required_test || "None specified"}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Appointment Slot:</span>
            <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
              {referral.appointment_details
                ? `${referral.appointment_details.date} (${referral.appointment_details.start_time})`
                : "Open / Emergency"}
            </div>
            {referral.appointment_details?.doctor_name && (
              <div className="text-[10px] text-slate-500">
                Dr. {referral.appointment_details.doctor_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Vitals & Clinical Reason */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="font-bold text-slate-700 uppercase block text-[11px]">
            PHC Doctor Preliminary Notes & Chief Complaints:
          </span>
          <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
            {referral.reason || patient?.symptoms || "No preliminary notes recorded."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <span className="font-bold text-slate-700 uppercase block text-[11px]">
            Patient Vitals Telemetry (Recorded at PHC):
          </span>
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">BP</div>
              <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                {patient?.vitals?.blood_pressure || "120/80"}
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Pulse</div>
              <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                {patient?.vitals?.pulse_rate || "74"} bpm
              </div>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <div className="text-[10px] text-slate-400 font-bold uppercase">SpO2</div>
              <div className="font-mono font-bold text-emerald-700 text-xs mt-0.5">
                {patient?.vitals?.spo2 || "98"}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Specialist Clinical Consultation & Treatment Recording Form (Section 12) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Stethoscope className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-bold text-slate-900 text-base">
              Specialist Clinical Consultation & Prescription Entry
            </h2>
            <p className="text-xs text-slate-500">
              Record definitive diagnosis, diagnostic test results, medications, and follow-up plan to complete treatment.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveClinicalCare} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Consulting Specialist Doctor Name:
              </label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Definitive Clinical Diagnosis:
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Stable Angina Pectoris / Fracture Distal Radius"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Clinical Consultation & Examination Notes:
            </label>
            <textarea
              rows={2}
              placeholder="Clinical examination findings, heart/lung sounds, physical assessment..."
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                Tests Ordered:
              </label>
              <input
                type="text"
                placeholder="e.g. 2D Echo, Blood CBC, X-Ray Chest"
                value={testsOrdered}
                onChange={(e) => setTestsOrdered(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                Diagnostic Test Results / Lab Findings:
              </label>
              <input
                type="text"
                placeholder="e.g. Normal sinus rhythm, LVEF 60%, Hb 12.8"
                value={testResults}
                onChange={(e) => setTestResults(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Pill className="w-3.5 h-3.5 text-indigo-600" />
              Prescribed Medications & Dosages:
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Tab. Metoprolol 25mg OD (30 days), Tab. Aspirin 75mg OD (30 days)"
              value={prescriptions}
              onChange={(e) => setPrescriptions(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Treatment & Rehabilitation Notes:
            </label>
            <textarea
              rows={2}
              placeholder="Dietary instructions, physical therapy, precautions..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Follow-up Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpCheck"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="followUpCheck" className="font-bold text-slate-800 cursor-pointer">
                Follow-up Consultation Required
              </label>
            </div>

            {followUpRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Follow-up Date:</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Follow-up Instructions:</label>
                  <input
                    type="text"
                    placeholder="e.g. Review after 2 weeks with repeat blood tests"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Outcome Status Selector */}
          <div className="pt-2">
            <label className="block text-slate-700 font-bold mb-1.5">
              Case Outcome & Final Status:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: "UNDER_TREATMENT", label: "Under Treatment", desc: "Ongoing active therapy" },
                { id: "FOLLOW_UP", label: "Follow-up Scheduled", desc: "Patient to return" },
                { id: "COMPLETED", label: "Completed / Treated", desc: "Discharged / Resolved" },
                { id: "CASE_CLOSED", label: "Case Closed", desc: "Full cycle finished" },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setOutcomeStatus(st.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    outcomeStatus === st.id
                      ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20"
                      : "bg-slate-50 border-slate-200 hover:bg-white"
                  }`}
                >
                  <div className="font-bold text-slate-900 text-xs">{st.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={savingCare}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
            >
              {savingCare ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Saving Care Record...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Save Clinical Record & Update Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* State Transitions Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-indigo-600" />
          <h2 className="font-bold text-slate-900 text-sm">
            Referral Journey Audit Trail ({referral.events?.length || 0} Events)
          </h2>
        </div>

        <ReferralTimeline events={referral.events || []} />
      </div>
    </div>
  );
};

export default HospitalReferralDetailPage;
