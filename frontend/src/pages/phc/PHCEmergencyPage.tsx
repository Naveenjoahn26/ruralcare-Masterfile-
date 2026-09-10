import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Ambulance,
  HeartPulse,
  Building2,
  MapPin,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  Send,
  FileCheck,
} from "lucide-react";
import api from "../../services/api";
import { Referral, MatchingResponse, MatchingHospitalResult } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const PHCEmergencyPage: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const navigate = useNavigate();

  const [referral, setReferral] = useState<Referral | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResponse | null>(null);
  const [recommendedHospital, setRecommendedHospital] = useState<MatchingHospitalResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState<Referral | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [transferNotes, setTransferNotes] = useState<string>(
    "Patient presenting with acute critical distress. 108 Emergency Ambulance requested with oxygen support."
  );

  useEffect(() => {
    const loadEmergency = async () => {
      if (!referralId) return;
      try {
        setLoading(true);
        const refData = await api.getReferral(referralId);
        setReferral(refData);

        // Run emergency auto-triage matching
        const matchData = await api.matchEmergency({
          phc_id: refData.phc_id,
          required_department: refData.required_department || "General Medicine",
          required_test: refData.required_test || undefined,
          referral_id: refData.referral_id,
        });

        setMatchingResult(matchData);
        setRecommendedHospital(matchData.recommended_hospital || matchData.hospitals[0] || null);
      } catch (e: any) {
        console.error("Emergency triage error", e);
        setError("Failed to complete emergency resource auto-evaluation.");
      } finally {
        setLoading(false);
      }
    };
    loadEmergency();
  }, [referralId]);

  const handleInitiateTransfer = async () => {
    if (!referral || !recommendedHospital) return;
    try {
      setDispatching(true);
      setError(null);
      const updatedRef = await api.initiateEmergencyTransfer(
        referral.referral_id,
        recommendedHospital.hospital_id,
        transferNotes
      );
      setDispatchSuccess(updatedRef);
      setReferral(updatedRef);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to dispatch emergency transfer.");
    } finally {
      setDispatching(false);
    }
  };

  if (loading || !referral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-red-600 animate-spin mb-3" />
        <p className="text-sm font-bold text-red-700">Evaluating Emergency Network Resources & ICU Availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/phc/referral/${referral.referral_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Referral Dossier
        </Link>
        <span className="text-xs font-mono text-red-600 font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
          Emergency Triage Protocol
        </span>
      </div>

      {/* Emergency Alert Banner */}
      <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0">
            <Ambulance className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono font-black text-sm bg-white/20 px-2 py-0.5 rounded">
                {referral.referral_id}
              </span>
              <SeverityBadge severity="EMERGENCY" />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-black tracking-tight">
              Emergency Hospital Transfer Protocol
            </h1>
            <p className="text-xs text-red-100 mt-0.5 max-w-xl">
              Routine appointment slots and patient choice are bypassed. The Central Platform has evaluated real-time emergency trauma resources to allocate the optimal receiving hospital.
            </p>
          </div>
        </div>
      </div>

      {/* Dispatch Success Receipt */}
      {dispatchSuccess && (
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold">
              <FileCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">
                108 Emergency Transfer Dispatched!
              </h2>
              <p className="text-xs text-emerald-100">
                Hospital <strong>{dispatchSuccess.selected_hospital_name}</strong> and Ambulance standby notified in real time.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-emerald-700/50 p-4 rounded-xl">
            <div>
              <span className="text-emerald-200">Patient ID:</span>
              <div className="font-bold text-white text-sm font-mono">{dispatchSuccess.patient_id}</div>
            </div>
            <div>
              <span className="text-emerald-200">Receiving Hospital:</span>
              <div className="font-bold text-white text-sm">{dispatchSuccess.selected_hospital_name}</div>
            </div>
            <div>
              <span className="text-emerald-200">Status:</span>
              <div className="font-bold text-white text-sm font-mono">{dispatchSuccess.referral_status}</div>
            </div>
            <div>
              <span className="text-emerald-200">Timeline Notice:</span>
              <div className="font-bold text-white text-sm">Trauma Unit Alerted</div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Automatically Selected Hospital Card (Section 8) */}
      {recommendedHospital && (
        <div className="bg-white rounded-2xl border-2 border-red-300 p-6 shadow-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                Automatically Selected Higher Hospital
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {recommendedHospital.hospital_name}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {recommendedHospital.district}, {recommendedHospital.state} • <strong>{recommendedHospital.distance_km} km</strong> away
                </span>
                <span>•</span>
                <span className="font-mono text-slate-600">ID: {recommendedHospital.hospital_id}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 font-bold block">Triage Capability Score</span>
              <span className="text-2xl font-black text-red-600">{recommendedHospital.score} / 100</span>
            </div>
          </div>

          {/* Emergency Resources Matrix */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-red-500" />
              Verified Emergency Resources at Receiving Hospital:
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">ICU Beds</div>
                <div className="text-lg font-black text-red-600 mt-1">
                  {recommendedHospital.icu_beds_available} Available
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Emergency Beds</div>
                <div className="text-lg font-black text-slate-900 mt-1">
                  {recommendedHospital.emergency_beds} Beds
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Oxygen Supply</div>
                <div className="text-lg font-black text-emerald-600 mt-1">
                  {recommendedHospital.oxygen_available ? "READY (24x7)" : "NO"}
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Ambulance Standby</div>
                <div className="text-lg font-black text-emerald-600 mt-1">
                  {recommendedHospital.ambulance_available ? "ACTIVE" : "UNAVAILABLE"}
                </div>
              </div>
            </div>
          </div>

          {/* Transfer Dispatch Notes Form */}
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <label className="font-bold text-slate-700 block">Emergency Dispatch Clinical Notes:</label>
            <textarea
              rows={3}
              value={transferNotes}
              onChange={(e) => setTransferNotes(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Dispatch Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              onClick={handleInitiateTransfer}
              disabled={dispatching || referral.referral_status === "EMERGENCY_TRANSFER"}
              className="px-7 py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white font-black text-xs rounded-xl shadow-lg shadow-red-600/30 transition cursor-pointer flex items-center gap-2"
            >
              {dispatching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Dispatching Transfer...
                </>
              ) : referral.referral_status === "EMERGENCY_TRANSFER" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Transfer Already Initiated
                </>
              ) : (
                <>
                  <Ambulance className="w-4 h-4" /> Initiate Emergency Transfer
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PHCEmergencyPage;
