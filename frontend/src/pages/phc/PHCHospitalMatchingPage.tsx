import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  UserCheck,
  RefreshCw,
  Compass,
  AlertCircle,
  MapPin,
  CalendarCheck,
  Stethoscope,
  Activity,
} from "lucide-react";
import api from "../../services/api";
import { Referral, MatchingResponse, MatchingHospitalResult } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const PHCHospitalMatchingPage: React.FC = () => {
  const { referralId } = useParams<{ referralId: string }>();
  const navigate = useNavigate();

  const [referral, setReferral] = useState<Referral | null>(null);
  const [matchingResult, setMatchingResult] = useState<MatchingResponse | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
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
        if (refData.selected_hospital_id) {
          setSelectedHospitalId(refData.selected_hospital_id);
        }

        // Run medium matching engine
        const matchData = await api.matchMedium({
          phc_id: refData.phc_id,
          required_department: refData.required_department,
          required_test: refData.required_test || undefined,
          referral_id: refData.referral_id,
        });
        setMatchingResult(matchData);
      } catch (err: any) {
        console.error("Error loading matching data", err);
        setError("Failed to evaluate candidate higher hospitals.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [referralId]);

  const handleSelectHospital = async (hospitalId: string) => {
    if (!referralId) return;
    try {
      setSubmitting(true);
      setError(null);
      await api.recordHospitalSelection(referralId, hospitalId);
      setSelectedHospitalId(hospitalId);

      // Navigate to dedicated appointment slot page
      navigate(`/phc/referral/${referralId}/appointment?hospital_id=${hospitalId}`);
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
        <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Evaluating Higher Hospital Candidates...</p>
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
        <span className="text-xs font-mono text-slate-500">
          Step 2 of 3: Patient Hospital Matching & Choice
        </span>
      </div>

      {/* Patient Referral Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono font-black text-lg text-emerald-700">
                {referral.referral_id}
              </span>
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Suitable Higher Hospitals for Patient Choice
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Ranked candidates based on Haversine distance from <strong>{referral.phc_name}</strong>, specialty readiness for <strong>{referral.required_department}</strong>, and open doctor appointment slots.
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2 max-w-sm">
            <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Patient Preference Consultation</span>
              <span>Consult with the patient regarding travel distance and doctor availability before selecting.</span>
            </div>
          </div>
        </div>

        {/* Selected Criteria Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
          <div>
            <span className="text-slate-500">Patient ID:</span>
            <div className="font-bold text-slate-800 font-mono">{referral.patient_id}</div>
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
            <span className="text-slate-500">Current Status:</span>
            <div className="font-bold text-emerald-700 font-mono">
              {selectedHospitalId ? `Selected: ${selectedHospitalId}` : "Awaiting Choice"}
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

      {/* Hospital Cards Grid (Section 6) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-600" />
            Ranked Candidate Hospitals ({matchingResult?.hospitals.length || 0})
          </h2>
          <span className="text-xs text-slate-500">
            Click "Select Hospital" to proceed to doctor slot booking
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {matchingResult?.hospitals.map((hosp, idx) => {
            const isSelected = selectedHospitalId === hosp.hospital_id;
            const isSubmittingThis = submitting && isSelected;

            return (
              <div
                key={hosp.hospital_id}
                className={`bg-white rounded-2xl border-2 p-5 shadow-xs transition flex flex-col justify-between ${
                  isSelected ? "border-emerald-600 bg-emerald-50/20 shadow-md" : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm">{hosp.hospital_name}</h3>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {hosp.district}, {hosp.state} • <strong>{hosp.distance_km} km</strong> from PHC
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                      Score: {hosp.score}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Specialty</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {hosp.department_available ? (
                          <span className="text-emerald-700">Available</span>
                        ) : (
                          <span className="text-slate-400">Unavailable</span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Specialists</div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {hosp.available_doctors?.length || 0} Doctors
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Open Slots</div>
                      <div className="font-bold text-emerald-700 mt-0.5">
                        {hosp.available_slots_count} Slots
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {hosp.hospital_id} • {hosp.hospital_type}
                  </span>

                  <button
                    onClick={() => handleSelectHospital(hosp.hospital_id)}
                    disabled={submitting}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSubmittingThis ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving Choice...
                      </>
                    ) : (
                      <>
                        Select Hospital <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PHCHospitalMatchingPage;
