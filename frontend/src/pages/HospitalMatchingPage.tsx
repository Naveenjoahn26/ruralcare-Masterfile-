import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Compass,
  Building2,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Stethoscope,
  FlaskConical,
  Ambulance,
  SlidersHorizontal,
} from "lucide-react";
import api from "../services/api";
import {
  MatchingResponse,
  MatchingHospitalResult,
  PHC,
  Referral,
} from "../types";
import { HospitalComparisonCard } from "../components/HospitalComparisonCard";
import { SeverityBadge } from "../components/SeverityBadge";

export const HospitalMatchingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const referralIdParam = searchParams.get("referral_id") || "";

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);

  const [selectedReferralId, setSelectedReferralId] = useState<string>(referralIdParam);
  const [phcId, setPhcId] = useState<string>("PHC001");
  const [severity, setSeverity] = useState<"MEDIUM" | "EMERGENCY">("MEDIUM");
  const [department, setDepartment] = useState<string>("Cardiology");
  const [testRequired, setTestRequired] = useState<string>("ECG");

  const [matchingResult, setMatchingResult] = useState<MatchingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting & Filtering local UI controls
  const [sortBy, setSortBy] = useState<"score" | "distance" | "slots">("score");
  const [filterDeptOnly, setFilterDeptOnly] = useState<boolean>(true);

  // Fetch initial PHCs and Referrals
  useEffect(() => {
    const init = async () => {
      try {
        const [phcList, refList] = await Promise.all([
          api.getPHCs(),
          api.getReferrals(),
        ]);
        setPhcs(phcList);
        setReferrals(refList);

        if (referralIdParam) {
          const matchedRef = refList.find((r) => r.referral_id === referralIdParam);
          if (matchedRef) {
            setPhcId(matchedRef.phc_id);
            setSeverity(matchedRef.severity as "MEDIUM" | "EMERGENCY");
            setDepartment(matchedRef.required_department);
            setTestRequired(matchedRef.required_test || "");
          }
        }
      } catch (e) {
        console.error("Failed to load initial matching data", e);
      }
    };
    init();
  }, [referralIdParam]);

  // When selected referral changes, update fields
  const handleReferralChange = (refId: string) => {
    setSelectedReferralId(refId);
    if (!refId) return;
    const ref = referrals.find((r) => r.referral_id === refId);
    if (ref) {
      setPhcId(ref.phc_id);
      setSeverity(ref.severity as "MEDIUM" | "EMERGENCY");
      setDepartment(ref.required_department);
      setTestRequired(ref.required_test || "");
    }
  };

  const runMatching = async () => {
    try {
      setLoading(true);
      setError(null);

      if (severity === "EMERGENCY") {
        const res = await api.matchEmergency({
          phc_id: phcId,
          required_department: department || undefined,
          required_test: testRequired || undefined,
          referral_id: selectedReferralId || undefined,
        });
        setMatchingResult(res);
      } else {
        const res = await api.matchMedium({
          phc_id: phcId,
          required_department: department,
          required_test: testRequired || undefined,
          referral_id: selectedReferralId || undefined,
        });
        setMatchingResult(res);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Hospital matching algorithm encountered an issue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (phcId && department) {
      runMatching();
    }
  }, [phcId, severity, department, testRequired]);

  // Handle hospital selection action
  const handleSelectHospital = (hospitalId: string) => {
    if (severity === "EMERGENCY") {
      if (selectedReferralId) {
        navigate(`/emergency/${selectedReferralId}?hospital_id=${hospitalId}`);
      } else {
        navigate(`/emergency?hospital_id=${hospitalId}&phc_id=${phcId}`);
      }
    } else {
      if (selectedReferralId) {
        navigate(`/selection/${selectedReferralId}?hospital_id=${hospitalId}`);
      } else {
        // Standalone hospital selection
        navigate(`/appointments/book?hospital_id=${hospitalId}`);
      }
    }
  };

  // Sort & filter results
  let displayedHospitals = matchingResult?.hospitals ? [...matchingResult.hospitals] : [];

  if (filterDeptOnly && severity === "MEDIUM") {
    displayedHospitals = displayedHospitals.filter((h) => h.department_available);
  }

  if (sortBy === "distance") {
    displayedHospitals.sort((a, b) => a.distance_km - b.distance_km);
  } else if (sortBy === "slots") {
    displayedHospitals.sort((a, b) => b.available_slots_count - a.available_slots_count);
  } else {
    displayedHospitals.sort((a, b) => b.score - a.score);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded w-fit mb-2 border border-blue-200">
            <Compass className="w-3.5 h-3.5" /> Intelligent Healthcare Matching Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Higher Hospital Search & Matching
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Calculates Haversine distances, department/specialist availability, diagnostic equipment readiness, and open appointment slots.
          </p>
        </div>

        {matchingResult && (
          <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-medium">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>
              Matched Candidates: <strong>{matchingResult.total_candidates}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Referral Input & Criteria Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Linked Referral */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Select Active Referral:
            </label>
            <select
              value={selectedReferralId}
              onChange={(e) => handleReferralChange(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="">-- Standalone Matching --</option>
              {referrals.map((r) => (
                <option key={r.referral_id} value={r.referral_id}>
                  {r.referral_id} ({r.patient_id} - {r.required_department} - {r.severity})
                </option>
              ))}
            </select>
          </div>

          {/* Originating PHC */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Originating PHC Center:
            </label>
            <select
              value={phcId}
              onChange={(e) => setPhcId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              {phcs.map((p) => (
                <option key={p.phc_id} value={p.phc_id}>
                  {p.phc_name} ({p.district})
                </option>
              ))}
            </select>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Severity Level:
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as "MEDIUM" | "EMERGENCY")}
              className={`w-full p-2.5 rounded-lg font-bold border ${
                severity === "EMERGENCY"
                  ? "bg-red-50 text-red-700 border-red-300"
                  : "bg-slate-50 text-slate-800 border-slate-200"
              } focus:ring-2 focus:ring-blue-500`}
            >
              <option value="MEDIUM">MEDIUM (Patient Preference Flow)</option>
              <option value="EMERGENCY">EMERGENCY (Direct Triage Auto-Match)</option>
            </select>
          </div>

          {/* Required Department */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Required Specialization:
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Neurology">Neurology</option>
            </select>
          </div>

          {/* Required Test */}
          <div>
            <label className="block text-slate-600 font-semibold mb-1">
              Diagnostic Test:
            </label>
            <select
              value={testRequired}
              onChange={(e) => setTestRequired(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white"
            >
              <option value="">None / Routine</option>
              <option value="ECG">ECG</option>
              <option value="X-Ray">X-Ray</option>
              <option value="CT Scan">CT Scan</option>
              <option value="MRI">MRI</option>
              <option value="Echo">Echo</option>
              <option value="Blood Test">Blood Test</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Sorting & Display:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-medium"
              >
                <option value="score">Match Score (Recommended)</option>
                <option value="distance">Shortest Distance (km)</option>
                <option value="slots">Most Open Slots</option>
              </select>
            </div>

            {severity === "MEDIUM" && (
              <label className="flex items-center gap-1.5 cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={filterDeptOnly}
                  onChange={(e) => setFilterDeptOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                Show only hospitals with active department
              </label>
            )}
          </div>

          <button
            onClick={runMatching}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Recalculate Matches
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Emergency Mode Callout Banner */}
      {severity === "EMERGENCY" && (
        <div className="bg-red-500/10 border-2 border-red-500 p-5 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-red-700 text-sm uppercase tracking-wider">
              <Ambulance className="w-5 h-5 text-red-600" /> Emergency Auto-Triage Matching Active
            </div>
            <span className="bg-red-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
              Urgent Priority
            </span>
          </div>
          <p className="text-slate-700">
            In Emergency mode, hospital matching prioritizes 24x7 trauma readiness, ICU bed availability, oxygen infrastructure, ambulance standby, and lowest estimated wait times. Patient preference choice and routine slot booking are bypassed for immediate transfer.
          </p>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Matched Suitable Facilities ({displayedHospitals.length} Found)
        </h2>
        <span className="text-xs text-slate-500">
          Ranked by multi-parameter healthcare suitability scoring
        </span>
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="font-semibold text-slate-700 text-sm">
              Calculating distance matrix and hospital capability scores...
            </p>
          </div>
        ) : displayedHospitals.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
            No higher hospitals found matching the required criteria.
          </div>
        ) : (
          displayedHospitals.map((hosp) => (
            <HospitalComparisonCard
              key={hosp.hospital_id}
              hospital={hosp}
              isEmergency={severity === "EMERGENCY"}
              actionLabel={
                severity === "EMERGENCY"
                  ? "Dispatch Emergency Transfer"
                  : "Select This Hospital"
              }
              onSelect={handleSelectHospital}
            />
          ))
        )}
      </div>
    </div>
  );
};
