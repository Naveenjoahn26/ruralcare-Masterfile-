import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Clock,
  FileCheck,
  Stethoscope,
  HeartPulse,
  User,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  RefreshCw,
  Share2,
  Printer,
} from "lucide-react";
import api from "../../services/api";
import { Referral, PatientRecordReference } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { ReferralTimeline } from "../../components/ReferralTimeline";

export const PHCReferralDetailPage: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [patient, setPatient] = useState<PatientRecordReference | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetail = async () => {
      if (!referralId) return;
      try {
        setLoading(true);
        const refData = await api.getReferral(referralId);
        setReferral(refData);
        if (refData.patient_id) {
          const patData = await api.getPatient(refData.patient_id);
          setPatient(patData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDetail();
  }, [referralId]);

  if (loading || !referral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-2" />
        <p className="text-xs text-slate-500 font-medium">Loading Referral Dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/phc/referrals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Referrals
        </Link>

        <button
          onClick={() => window.print()}
          className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Printer className="w-3.5 h-3.5" /> Print Case Dossier
        </button>
      </div>

      {/* Case Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-black text-xl text-emerald-700">
                {referral.referral_id}
              </span>
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Patient Referral Case Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Originated at: <strong>{referral.phc_name || referral.phc_id}</strong> on {referral.created_date}
            </p>
          </div>

          {/* Quick Action according to state */}
          <div className="flex items-center gap-2">
            {referral.severity === "MEDIUM" && referral.referral_status === "HOSPITAL_SELECTION_PENDING" && (
              <Link
                to={`/phc/referral/${referral.referral_id}/hospitals`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Match & Select Hospital &rarr;
              </Link>
            )}

            {referral.severity === "MEDIUM" && referral.referral_status === "HOSPITAL_SELECTED" && (
              <Link
                to={`/phc/referral/${referral.referral_id}/appointment`}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Book Appointment Slot &rarr;
              </Link>
            )}

            {referral.severity === "EMERGENCY" && referral.referral_status !== "EMERGENCY_TRANSFER" && (
              <Link
                to={`/phc/referral/${referral.referral_id}/emergency`}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Ambulance className="w-4 h-4" /> Initiate Emergency Transfer
              </Link>
            )}
          </div>
        </div>

        {/* Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Patient:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {patient?.full_name || referral.patient_id} ({patient?.age || "-"}y / {patient?.gender || "-"})
            </div>
            <div className="text-[10px] text-slate-500 font-mono">ID: {referral.patient_id}</div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Target Hospital:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {referral.selected_hospital_name || (
                <span className="text-slate-400 italic">Not Selected</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono">
              {referral.selected_hospital_id || ""}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Required Specialty:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">
              {referral.required_department}
            </div>
            <div className="text-[10px] text-slate-500">
              Test: {referral.required_test || "None"}
            </div>
          </div>

          <div>
            <span className="text-slate-400 font-medium">Appointment Window:</span>
            <div className="font-bold text-slate-900 text-sm font-mono mt-0.5">
              {referral.appointment_details ? (
                `${referral.appointment_details.date} (${referral.appointment_details.start_time})`
              ) : (
                <span className="text-slate-400 italic font-sans">Not Scheduled</span>
              )}
            </div>
            {referral.appointment_details?.doctor_name && (
              <div className="text-[10px] text-slate-500">
                Dr. {referral.appointment_details.doctor_name}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clinical Care Records / Specialist Feedback */}
      {referral.clinical_cares && referral.clinical_cares.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Stethoscope className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">
              Higher Hospital Clinical Feedback & Treatment Notes
            </h2>
          </div>

          <div className="space-y-3">
            {referral.clinical_cares.map((care) => (
              <div
                key={care.care_id}
                className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-100 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900">
                    Dr. {care.doctor_name || "Specialist"} • Consultation
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(care.created_at).toLocaleString()}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Diagnosis:</span>
                  <p className="font-medium text-slate-800">{care.diagnosis}</p>
                </div>

                {care.test_results && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Diagnostic Results:</span>
                    <p className="bg-white p-2 rounded border border-slate-200 mt-0.5 text-slate-700">
                      {care.test_results}
                    </p>
                  </div>
                )}

                {care.prescriptions && (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Prescriptions:</span>
                    <p className="bg-white p-2 rounded border border-slate-200 mt-0.5 text-slate-700">
                      {care.prescriptions}
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-indigo-100 flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-700">
                    Outcome: <strong className="text-indigo-700">{care.outcome_status}</strong>
                  </span>
                  {care.follow_up_date && (
                    <span className="text-amber-700 font-bold">
                      Follow-up: {care.follow_up_date}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State Transitions Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Clock className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-900 text-sm">
            Referral Journey Audit Trail ({referral.events?.length || 0} Events)
          </h2>
        </div>

        <ReferralTimeline events={referral.events || []} />
      </div>
    </div>
  );
};

export default PHCReferralDetailPage;
