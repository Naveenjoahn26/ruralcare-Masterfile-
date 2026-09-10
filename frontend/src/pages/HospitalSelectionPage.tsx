import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Compass,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";
import { Referral, MatchingResponse, MatchingHospitalResult } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";
import { HospitalComparisonCard } from "../components/HospitalComparisonCard";

export const HospitalSelectionPage: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const preselectedHospitalId = searchParams.get("hospital_id") || "";

  const [referral, setReferral] = useState<Referral | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResponse | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(preselectedHospitalId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!referralId) return;
      try {
        setLoading(true);
        const refData = await api.getReferral(referralId);
        setReferral(refData);

        if (refData.selected_hospital_id && !selectedHospitalId) {
          setSelectedHospitalId(refData.selected_hospital_id);
        }

        // Run medium matching to get candidate hospitals
        const matchData = await api.matchMedium({
          phc_id: refData.phc_id,
          required_department: refData.required_department,
          required_test: refData.required_test || undefined,
          referral_id: refData.referral_id,
        });
        setMatchingResult(matchData);
      } catch (err: any) {
        console.error("Error loading selection data", err);
        setError("Failed to load hospital candidates.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [referralId]);

  const handleSelectPreference = async (hospitalId: string) => {
    if (!referralId) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.recordHospitalSelection(referralId, hospitalId);
      setSelectedHospitalId(hospitalId);

      // Transition to Appointment Booking page
      navigate(`/appointments/book?referral_id=${referralId}&hospital_id=${hospitalId}`);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to record hospital selection.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !referral) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Hospital Candidates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to={`/referrals/${referral.referral_id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Referral Dossier
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Step 2 of 3: Patient Hospital Selection
        </span>
      </div>

      {/* Patient Referral Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono font-black text-lg text-blue-700">
                {referral.referral_id}
              </span>
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Record Patient's Preferred Hospital
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              PHC Worker Prompt: Please consult with <strong>Patient {referral.patient_id}</strong> regarding proximity, transport convenience, and doctor availability to record their choice.
            </p>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2 max-w-sm">
            <UserCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">PHC Worker Action</span>
              <span>Patient choice is recorded to schedule slots at their preferred hospital.</span>
            </div>
          </div>
        </div>

        {/* Selected Criteria Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <span className="text-slate-500">Originating PHC:</span>
            <div className="font-bold text-slate-800">{referral.phc_name}</div>
          </div>
          <div>
            <span className="text-slate-500">Required Specialty:</span>
            <div className="font-bold text-slate-800">{referral.required_department}</div>
          </div>
          <div>
            <span className="text-slate-500">Diagnostic Test:</span>
            <div className="font-bold text-slate-800">{referral.required_test || "None"}</div>
          </div>
          <div>
            <span className="text-slate-500">Current Choice:</span>
            <div className="font-bold text-indigo-700 font-mono">
              {selectedHospitalId || "Awaiting Choice"}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidate Hospitals Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            Suitable Higher Hospitals for Patient Choice ({matchingResult?.hospitals.length || 0})
          </h2>
          <span className="text-xs text-slate-500">
            Select a hospital to proceed to doctor slot booking
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {matchingResult?.hospitals.map((hosp) => (
            <HospitalComparisonCard
              key={hosp.hospital_id}
              hospital={hosp}
              selected={selectedHospitalId === hosp.hospital_id}
              actionLabel={
                submitting && selectedHospitalId === hosp.hospital_id
                  ? "Saving Choice..."
                  : "Select This Hospital"
              }
              onSelect={handleSelectPreference}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
