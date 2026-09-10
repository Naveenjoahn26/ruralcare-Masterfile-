import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Stethoscope,
  Activity,
  FileCheck,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowLeft,
  User,
  Heart,
  Pill,
  FileText,
  AlertCircle,
  RefreshCw,
  Building,
} from "lucide-react";
import api from "../../services/api";
import { Referral, PatientRecordReference } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const HospitalCarePage: React.FC = () => {
  const { hospitalId = "H001", referralId = "" } = useParams<{
    hospitalId: string;
    referralId: string;
  }>();
  const navigate = useNavigate();

  const [referral, setReferral] = useState<Referral | null>(null);
  const [patient, setPatient] = useState<PatientRecordReference | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [doctorName, setDoctorName] = useState("Dr. R. K. Sharma (Cardiologist)");
  const [diagnosis, setDiagnosis] = useState("");
  const [consultationNotes, setConsultationNotes] = useState("");
  const [testsOrdered, setTestsOrdered] = useState("ECG, 2D Echocardiogram, Lipid Profile");
  const [testResults, setTestResults] = useState("ECG shows normal sinus rhythm. EF 60%. Mild ischemic changes on lead V3-V4.");
  const [prescriptions, setPrescriptions] = useState("Tab. Metoprolol 25mg OD, Tab. Aspirin 75mg OD, Tab. Atorvastatin 20mg HS");
  const [treatmentNotes, setTreatmentNotes] = useState("Advised cardiac rehabilitation, low-salt diet, and avoid heavy strenuous lifting.");
  const [followUpRequired, setFollowUpRequired] = useState(true);
  const [followUpDate, setFollowUpDate] = useState("2026-10-15");
  const [followUpNotes, setFollowUpNotes] = useState("Review with repeat lipid profile and TMT test report in 4 weeks.");
  const [outcomeStatus, setOutcomeStatus] = useState<
    "UNDER_TREATMENT" | "FOLLOW_UP" | "COMPLETED" | "CASE_CLOSED"
  >("COMPLETED");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const ref = await api.getReferral(referralId);
        setReferral(ref);
        setDiagnosis(ref.reason || "Evaluated by Department Specialist");

        const pat = await api.getPatientRecords(ref.patient_id);
        setPatient(pat);
      } catch (e) {
        console.error("Failed to load care dossier", e);
      } finally {
        setLoading(false);
      }
    };
    if (referralId) {
      fetchData();
    }
  }, [referralId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      alert("Please enter a specialist diagnosis");
      return;
    }

    try {
      setSubmitting(true);
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

      alert(`Clinical care recorded successfully. Referral status updated to ${outcomeStatus}.`);
      navigate(`/hospital/${hospitalId}`);
    } catch (err: any) {
      alert("Error saving clinical care: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        Loading clinical care dossier...
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Referral {referralId} not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to={`/hospital/${hospitalId}`}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Hospital Dashboard
        </Link>
        <div className="flex items-center gap-2">
          <SeverityBadge severity={referral.severity} />
          <StatusBadge status={referral.referral_status} />
        </div>
      </div>

      {/* Patient PHC Dossier Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">
                {patient?.full_name || `Patient ${referral.patient_id}`}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                ID: {referral.patient_id} • Age: {patient?.age} yrs • Gender: {patient?.gender} • PHC: {referral.phc_name || referral.phc_id}
              </div>
            </div>
          </div>
          <div className="text-right font-mono text-xs text-blue-600 font-bold">
            Referral: {referral.referral_id}
          </div>
        </div>

        {/* Vitals Grid from PHC */}
        {patient?.vitals && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Blood Pressure:</span>
              <strong className="text-slate-800 font-mono">{patient.vitals.blood_pressure || "120/80 mmHg"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Pulse Rate:</span>
              <strong className="text-slate-800 font-mono">{patient.vitals.pulse_rate || "76 bpm"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SpO2:</span>
              <strong className="text-emerald-700 font-mono">{patient.vitals.spo2 || "98%"}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Temperature:</span>
              <strong className="text-slate-800 font-mono">{patient.vitals.temperature || "98.6 °F"}</strong>
            </div>
          </div>
        )}

        {patient?.preliminary_diagnosis && (
          <div className="text-xs text-slate-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
            <span className="font-bold text-amber-900">PHC Doctor Preliminary Note:</span>{" "}
            {patient.preliminary_diagnosis} ({patient.symptoms})
          </div>
        )}
      </div>

      {/* Clinical Care Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-indigo-200 shadow-lg space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-indigo-950 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            Specialist Clinical Care & Case Management
          </h2>
          <p className="text-xs text-slate-500">
            Record specialist findings, diagnostic test results, treatment medications, and case completion status
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Attending Specialist Doctor *</label>
              <input
                type="text"
                required
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Specialist Diagnosis *</label>
              <input
                type="text"
                required
                placeholder="e.g. Stable Angina Pectoris - CCS Class II"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Clinical Examination & Consultation Notes</label>
            <textarea
              rows={2}
              placeholder="Clinical observations, cardiovascular exam, breath sounds..."
              value={consultationNotes}
              onChange={(e) => setConsultationNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Diagnostic Tests Ordered</label>
              <textarea
                rows={2}
                placeholder="e.g. ECG, 2D Echo, TMT, Chest X-Ray..."
                value={testsOrdered}
                onChange={(e) => setTestsOrdered(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Diagnostic Test Results / Findings</label>
              <textarea
                rows={2}
                placeholder="e.g. 2D Echo: Normal LV systolic function, EF 60%..."
                value={testResults}
                onChange={(e) => setTestResults(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-purple-600" />
              Prescribed Medications & Dosages
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Tab. Metoprolol 25mg OD, Tab. Aspirin 75mg OD..."
              value={prescriptions}
              onChange={(e) => setPrescriptions(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Treatment Plan & Discharge Advice</label>
            <textarea
              rows={2}
              placeholder="Lifestyle guidance, dietary restrictions, red flag symptoms..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Follow-up Section */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpCheckbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="followUpCheckbox" className="font-bold text-slate-800 cursor-pointer">
                Follow-up Consultation Required
              </label>
            </div>

            {followUpRequired && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Follow-up Instructions</label>
                  <input
                    type="text"
                    placeholder="e.g. Review with repeat Echo report"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Outcome Status Selector */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
              Set Case Outcome Status *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { val: "UNDER_TREATMENT", label: "Under Treatment", desc: "Active in care" },
                { val: "FOLLOW_UP", label: "Follow Up", desc: "Awaiting next visit" },
                { val: "COMPLETED", label: "Treatment Completed", desc: "Successful discharge" },
                { val: "CASE_CLOSED", label: "Case Closed", desc: "Final closure" },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => setOutcomeStatus(item.val as any)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    outcomeStatus === item.val
                      ? "border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-sm"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className="text-xs">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Link
            to={`/hospital/${hospitalId}`}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/30 cursor-pointer transition"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Saving Record...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Clinical Care & Update Status
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
