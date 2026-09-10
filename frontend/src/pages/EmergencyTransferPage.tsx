import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Ambulance,
  AlertOctagon,
  Bed,
  Wind,
  Phone,
  Clock,
  Building2,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  Zap,
} from "lucide-react";
import api from "../services/api";
import {
  Referral,
  MatchingResponse,
  MatchingHospitalResult,
  PHC,
} from "../types";
import { SeverityBadge } from "../components/SeverityBadge";
import { StatusBadge } from "../components/StatusBadge";
import { HospitalComparisonCard } from "../components/HospitalComparisonCard";

export const EmergencyTransferPage: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferralId, setSelectedReferralId] = useState<string>(referralId || "");
  const [referral, setReferral] = useState<Referral | null>(null);

  const [matchingResult, setMatchingResult] = useState<MatchingResponse | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [transferNotes, setTransferNotes] = useState<string>(
    "Patient stabilized with IV access and oxygen. Transport via 108 Emergency Ambulance initiated."
  );

  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<Referral | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load emergency referrals
  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const list = await api.getReferrals({ severity: "EMERGENCY" });
        setReferrals(list);
        if (!selectedReferralId && list.length > 0) {
          setSelectedReferralId(list[0].referral_id);
        }
      } catch (e) {
        console.error("Failed to load emergency referrals", e);
      }
    };
    fetchEmergencies();
  }, []);

  // When referral changes, run emergency matching
  useEffect(() => {
    if (!selectedReferralId) return;
    const loadEmergencyMatch = async () => {
      try {
        setLoading(true);
        setError(null);
        const refData = await api.getReferral(selectedReferralId);
        setReferral(refData);

        const matchRes = await api.matchEmergency({
          phc_id: refData.phc_id,
          required_department: refData.required_department,
          required_test: refData.required_test || undefined,
          referral_id: refData.referral_id,
        });

        setMatchingResult(matchRes);
        if (matchRes.recommended_hospital) {
          setSelectedHospitalId(matchRes.recommended_hospital.hospital_id);
        }
      } catch (err: any) {
        console.error(err);
        setError("Failed to run emergency matching algorithm.");
      } finally {
        setLoading(false);
      }
    };
    loadEmergencyMatch();
  }, [selectedReferralId]);

  // Initiate Emergency Transfer
  const handleInitiateTransfer = async () => {
    if (!selectedReferralId || !selectedHospitalId) {
      setError("Please select a referral and receiving emergency facility.");
      return;
    }

    try {
      setDispatching(true);
      setError(null);
      const res = await api.initiateEmergencyTransfer(
        selectedReferralId,
        selectedHospitalId,
        transferNotes
      );
      setDispatchSuccess(res);
      setReferral(res);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Emergency dispatch failed.");
    } finally {
      setDispatching(false);
    }
  };

  const topHospital = matchingResult?.recommended_hospital;

  return (
    <div className="space-y-6">
      {/* High-Urgency Header */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-red-600/60">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-white/20 text-white text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                Emergency Triage & Rapid Dispatch Hub
              </span>
              <span className="bg-red-950/80 text-red-200 text-[11px] font-bold px-2 py-0.5 rounded">
                Code Red
              </span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Emergency Transfer Management
            </h1>
            <p className="text-xs text-red-100 mt-1 max-w-2xl">
              Strict Emergency Protocol: Routine patient preference selection and standard appointment scheduling are completely bypassed. The platform auto-triages the highest-capability nearby hospital with active ICU, oxygen, and trauma beds.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/referrals"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> All Referrals
            </Link>
          </div>
        </div>

        {/* Emergency Referral Selector */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="font-bold text-red-200 shrink-0">Active Emergency Referral:</span>
            <select
              value={selectedReferralId}
              onChange={(e) => setSelectedReferralId(e.target.value)}
              className="bg-red-900/80 text-white border border-red-500 rounded-lg px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-white"
            >
              {referrals.map((r) => (
                <option key={r.referral_id} value={r.referral_id}>
                  {r.referral_id} - Patient {r.patient_id} ({r.phc_name})
                </option>
              ))}
            </select>
          </div>

          {referral && (
            <div className="flex items-center gap-2">
              <span className="text-red-200">Current Status:</span>
              <StatusBadge status={referral.referral_status} />
            </div>
          )}
        </div>
      </div>

      {/* Success Dispatch Alert */}
      {dispatchSuccess && (
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Emergency Transfer Successfully Dispatched!</h3>
                <p className="text-xs text-emerald-100">
                  Referral status updated to <strong>EMERGENCY_TRANSFER</strong>. Receiving hospital trauma desk alerted.
                </p>
              </div>
            </div>
            <Link
              to={`/tracking?referral_id=${dispatchSuccess.referral_id}`}
              className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              View Tracking Timeline
            </Link>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recommended Emergency Facility Breakdown */}
      {topHospital && (
        <div className="bg-white p-6 rounded-2xl border-2 border-red-500 shadow-md space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-red-700 bg-red-50 px-2.5 py-1 rounded-full mb-2 border border-red-200">
                <Zap className="w-3.5 h-3.5" /> Optimal Receiving Emergency Facility (Auto-Ranked #1)
              </div>
              <h2 className="text-xl font-black text-slate-900">
                {topHospital.hospital_name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded">
                  {topHospital.distance_km} km Proximity
                </span>
                <span>{topHospital.district}, {topHospital.state}</span>
                <span>{topHospital.hospital_type}</span>
              </div>
            </div>

            <div className="bg-slate-950 text-white px-4 py-2.5 rounded-xl text-right">
              <span className="text-slate-400 text-[11px] block">Emergency Priority Score</span>
              <span className="text-2xl font-black text-emerald-400">{topHospital.score}%</span>
            </div>
          </div>

          {/* Key Emergency Capacity Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
              <span className="text-red-700 font-semibold flex items-center gap-1 mb-1">
                <Bed className="w-4 h-4" /> Emergency Triage Beds
              </span>
              <div className="text-xl font-black text-red-950">
                {topHospital.emergency_beds} Beds Available
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
              <span className="text-indigo-700 font-semibold flex items-center gap-1 mb-1">
                <Bed className="w-4 h-4" /> ICU Bed Capacity
              </span>
              <div className="text-xl font-black text-indigo-950">
                {topHospital.icu_beds_available} ICU Beds Free
              </div>
            </div>

            <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200">
              <span className="text-sky-700 font-semibold flex items-center gap-1 mb-1">
                <Wind className="w-4 h-4" /> Oxygen & Ambulance
              </span>
              <div className="text-xs font-bold text-sky-950">
                O2 Supply: {topHospital.oxygen_available ? "YES" : "NO"} • Ambulance: {topHospital.ambulance_available ? "YES" : "NO"}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-emerald-700 font-semibold flex items-center gap-1 mb-1">
                <Clock className="w-4 h-4" /> Estimated Wait Time
              </span>
              <div className="text-xl font-black text-emerald-950">
                ~{topHospital.estimated_wait_minutes} Mins
              </div>
            </div>
          </div>

          {/* Emergency Dispatch Form */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold text-slate-800">
              Emergency Transfer Clinical & Transit Log Notes:
            </label>
            <textarea
              rows={2}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-red-500 focus:outline-none"
            />

            {referral?.referral_status === "EMERGENCY_TRANSFER" && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Emergency transfer is currently active for this patient.
                </span>
                <Link
                  to={`/tracking?referral_id=${referral.referral_id}`}
                  className="font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
                >
                  View Status Lifecycle & Tracking →
                </Link>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-4 text-xs text-slate-600">
                {topHospital.contact_number && (
                  <span className="flex items-center gap-1 font-semibold">
                    <Phone className="w-3.5 h-3.5 text-slate-700" /> ER Hotline: {topHospital.contact_number}
                  </span>
                )}
                {topHospital.ambulance_number && (
                  <span className="flex items-center gap-1 font-semibold text-red-700">
                    <Ambulance className="w-3.5 h-3.5" /> Ambulance: {topHospital.ambulance_number}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {referral?.referral_status === "EMERGENCY_TRANSFER" && (
                  <Link
                    to={`/tracking?referral_id=${referral.referral_id}`}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
                  >
                    Track Case
                  </Link>
                )}
                <button
                  onClick={handleInitiateTransfer}
                  disabled={dispatching || referral?.referral_status === "EMERGENCY_TRANSFER"}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {dispatching ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Transfer...
                    </>
                  ) : referral?.referral_status === "EMERGENCY_TRANSFER" ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Emergency Transfer Dispatched
                    </>
                  ) : (
                    <>
                      <Ambulance className="w-4 h-4" /> Initiate Emergency Transfer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Nearby Facilities Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-800 text-sm">
          All Evaluated Network Facilities for Emergency Standby
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {matchingResult?.hospitals.map((hosp) => (
            <div
              key={hosp.hospital_id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                hosp.hospital_id === selectedHospitalId
                  ? "bg-red-50/50 border-red-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{hosp.hospital_name}</span>
                  {hosp.is_recommended && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      Top Match
                    </span>
                  )}
                </div>
                <div className="text-slate-500 mt-0.5">
                  {hosp.district} • {hosp.distance_km} km • ICU: {hosp.icu_beds_available} beds • ER Beds: {hosp.emergency_beds} • Wait: ~{hosp.estimated_wait_minutes} mins
                </div>
              </div>

              <button
                onClick={() => setSelectedHospitalId(hosp.hospital_id)}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                  selectedHospitalId === hosp.hospital_id
                    ? "bg-red-600 text-white"
                    : "bg-white hover:bg-slate-100 text-slate-700 border border-slate-300"
                }`}
              >
                {selectedHospitalId === hosp.hospital_id ? "Selected Facility" : "Select Facility"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
