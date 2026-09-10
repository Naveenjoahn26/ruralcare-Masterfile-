import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  Stethoscope,
  Ambulance,
  FileText,
  Activity,
  HeartPulse,
  RefreshCw,
  Compass,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { Referral, PatientRecordReference } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";
import { ReferralTimeline } from "../components/ReferralTimeline";

export const ReferralDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [patientRecord, setPatientRecord] = useState<PatientRecordReference | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const refData = await api.getReferral(id);
      setReferral(refData);

      // Fetch PHC patient clinical record summary (Integration with Member 1)
      try {
        const patientData = await api.getPatientRecords(refData.patient_id);
        setPatientRecord(patientData);
      } catch (err) {
        console.warn("No patient clinical record found", err);
      }
    } catch (e) {
      console.error("Error loading referral details", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  if (loading || !referral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Referral Dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/referrals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Referral Directory
        </Link>
        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
          Referral Dossier: <strong className="text-slate-800">{referral.referral_id}</strong>
        </div>
      </div>

      {/* Main Dossier Header Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-mono font-black text-lg text-blue-700">
                {referral.referral_id}
              </span>
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Patient ID: <span className="font-mono text-indigo-900">{referral.patient_id}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Originating Facility: <strong>{referral.phc_name || referral.phc_id}</strong> ({referral.phc_district}) • Created on {referral.created_date}
            </p>
          </div>

          {/* Quick Action Dispatchers based on state */}
          <div className="flex flex-wrap items-center gap-2.5">
            {referral.severity === "MEDIUM" &&
              (referral.referral_status === "REFERRAL_CREATED" ||
                referral.referral_status === "HOSPITAL_SELECTION_PENDING") && (
                <Link
                  to={`/matching?referral_id=${referral.referral_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Compass className="w-4 h-4" /> Match Hospitals
                </Link>
              )}

            {referral.severity === "MEDIUM" &&
              referral.referral_status === "HOSPITAL_SELECTED" &&
              referral.selected_hospital_id && (
                <Link
                  to={`/appointments/book?referral_id=${referral.referral_id}&hospital_id=${referral.selected_hospital_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <CalendarCheck className="w-4 h-4" /> Book Appointment Slot
                </Link>
              )}

            {referral.severity === "EMERGENCY" &&
              referral.referral_status !== "EMERGENCY_TRANSFER" && (
                <Link
                  to={`/emergency/${referral.referral_id}`}
                  className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                >
                  <Ambulance className="w-4 h-4" /> Dispatch Emergency Transfer
                </Link>
              )}

            <Link
              to={`/tracking?referral_id=${referral.referral_id}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
            >
              <Activity className="w-4 h-4" /> Full Status Lifecycle
            </Link>
          </div>
        </div>

        {/* Clinical Referral Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Required Specialty</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {referral.required_department}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Required Diagnostic Test</span>
            <span className="font-bold text-slate-800 text-sm mt-0.5 block">
              {referral.required_test || "None specified"}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <span className="text-slate-500 font-medium block">Assigned Higher Hospital</span>
            <span className="font-bold text-blue-900 text-sm mt-0.5 block">
              {referral.selected_hospital_name || "Pending Selection / Match"}
            </span>
          </div>
        </div>

        {referral.reason && (
          <div className="mt-4 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs">
            <span className="font-bold text-amber-900 block mb-1">Referral Reason / Clinical Note:</span>
            <p className="text-slate-700">{referral.reason}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: PHC Patient Medical Record Reference (Member 1 Integration) */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-600" />
                <h2 className="font-bold text-slate-900 text-base">
                  PHC Medical Record Summary
                </h2>
              </div>
              <span className="text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                Member 1 PHC Record Reference
              </span>
            </div>

            {patientRecord ? (
              <div className="space-y-4 text-xs">
                {/* Demographics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500">Full Name</span>
                    <div className="font-bold text-slate-800">{patientRecord.full_name}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Age / Gender</span>
                    <div className="font-bold text-slate-800">
                      {patientRecord.age} Yrs / {patientRecord.gender}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Blood Group</span>
                    <div className="font-bold text-rose-600">{patientRecord.blood_group || "N/A"}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact</span>
                    <div className="font-bold text-slate-800">{patientRecord.contact_number || "N/A"}</div>
                  </div>
                </div>

                {/* Vitals Matrix */}
                {patientRecord.vitals && (
                  <div>
                    <span className="font-bold text-slate-800 text-xs block mb-2">
                      Recorded Vitals at PHC Consultation:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Object.entries(patientRecord.vitals).map(([key, val]) => (
                        <div
                          key={key}
                          className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80"
                        >
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold block">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">{String(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Symptoms & Diagnosis */}
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-0.5">Reported Symptoms:</span>
                    <p className="text-slate-600">{patientRecord.symptoms}</p>
                  </div>

                  <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-200/60">
                    <span className="font-bold text-blue-900 block mb-0.5">Preliminary Diagnosis:</span>
                    <p className="text-slate-700">{patientRecord.preliminary_diagnosis}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700 block mb-0.5">PHC Doctor Notes:</span>
                    <p className="text-slate-600">{patientRecord.phc_doctor_notes}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-xs">No clinical record available for this patient.</p>
            )}
          </div>

          {/* Booked Appointment Card (if applicable) */}
          {referral.appointment_details && (
            <div className="bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200 shadow-xs">
              <div className="flex items-center gap-2 mb-3 text-emerald-800">
                <CalendarCheck className="w-5 h-5" />
                <h3 className="font-bold text-base">Confirmed Appointment Schedule</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500">Hospital</span>
                  <div className="font-bold text-slate-900">{referral.selected_hospital_name}</div>
                </div>
                <div>
                  <span className="text-slate-500">Consulting Specialist</span>
                  <div className="font-bold text-slate-900">
                    {referral.appointment_details.doctor_name || "Specialist On Duty"}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Appointment Date</span>
                  <div className="font-bold text-slate-900 font-mono">
                    {referral.appointment_details.date}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Time Window</span>
                  <div className="font-bold text-emerald-700 font-mono">
                    {referral.appointment_details.start_time} - {referral.appointment_details.end_time}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Lifecycle Audit Trail */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900 text-base">
                Lifecycle Timeline & Integration Log
              </h2>
            </div>
            <Link
              to={`/tracking?referral_id=${referral.referral_id}`}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Interactive Simulator
            </Link>
          </div>

          <ReferralTimeline events={referral.events} />
        </div>
      </div>
    </div>
  );
};
