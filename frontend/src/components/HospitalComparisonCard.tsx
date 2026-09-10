import React from "react";
import { MatchingHospitalResult } from "../types";
import {
  Building2,
  MapPin,
  Stethoscope,
  FlaskConical,
  Calendar,
  Ambulance,
  Phone,
  Bed,
  CheckCircle2,
  XCircle,
  Award,
} from "lucide-react";

interface HospitalComparisonCardProps {
  hospital: MatchingHospitalResult;
  onSelect?: (hospitalId: string) => void;
  selected?: boolean;
  actionLabel?: string;
  isEmergency?: boolean;
}

export const HospitalComparisonCard: React.FC<HospitalComparisonCardProps> = ({
  hospital,
  onSelect,
  selected = false,
  actionLabel = "Select Hospital",
  isEmergency = false,
}) => {
  return (
    <div
      className={`card-elevated p-5 relative overflow-hidden transition-all duration-200 border-2 ${
        selected
          ? "border-blue-600 ring-2 ring-blue-100 bg-blue-50/20"
          : hospital.is_recommended
          ? "border-emerald-500 bg-emerald-50/10"
          : "border-slate-200 hover:border-slate-300"
      }`}
    >
      {/* Top Banner Ribbon */}
      {hospital.is_recommended && (
        <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[11px] font-bold tracking-wider px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1 uppercase">
          <Award className="w-3.5 h-3.5" /> Best Match
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-700 shrink-0" />
            <h3 className="font-bold text-slate-900 text-lg">
              {hospital.hospital_name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              {hospital.district}, {hospital.state}
            </span>
            <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {hospital.distance_km} km from PHC
            </span>
            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {hospital.hospital_type}
            </span>
          </div>
        </div>

        {/* Score Pill */}
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-xs">
            <span className="text-xs text-slate-300 font-medium">Match Score:</span>
            <span className="text-base font-black text-emerald-400">
              {hospital.score}%
            </span>
          </div>
        </div>
      </div>

      {/* Resource Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200/80 text-xs">
        {/* Department */}
        <div className="flex items-start gap-2">
          {hospital.department_available ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-slate-500 font-medium">Department</div>
            <div className="font-semibold text-slate-800">
              {hospital.department_available ? "Available" : "Unavailable"}
            </div>
          </div>
        </div>

        {/* Doctors on duty */}
        <div className="flex items-start gap-2">
          {hospital.doctor_available ? (
            <Stethoscope className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <Stethoscope className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-slate-500 font-medium">Specialist Doctor</div>
            <div className="font-semibold text-slate-800">
              {hospital.doctor_available
                ? `${hospital.available_doctors.length} On Duty`
                : "None Active"}
            </div>
          </div>
        </div>

        {/* Tests */}
        <div className="flex items-start gap-2">
          {hospital.test_available ? (
            <FlaskConical className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <FlaskConical className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div>
            <div className="text-slate-500 font-medium">Required Test</div>
            <div className="font-semibold text-slate-800">
              {hospital.test_status}
            </div>
          </div>
        </div>

        {/* Appointment Slots or Emergency Beds */}
        {!isEmergency ? (
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-500 font-medium">Open Slots</div>
              <div className="font-semibold text-slate-800">
                {hospital.available_slots_count > 0
                  ? `${hospital.available_slots_count} Available`
                  : "No Open Slots"}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <Bed className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-slate-500 font-medium">ICU / ER Beds</div>
              <div className="font-semibold text-slate-800">
                {hospital.icu_beds_available} ICU / {hospital.emergency_beds} ER
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Emergency Capabilities (Extra details for triage) */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          {hospital.emergency_available && (
            <span className="inline-flex items-center gap-1 font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
              24x7 Emergency Unit
            </span>
          )}
          {hospital.oxygen_available && (
            <span className="inline-flex items-center gap-1 font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              Oxygen Supply Active
            </span>
          )}
          {hospital.ambulance_available && (
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Ambulance className="w-3.5 h-3.5" /> Ambulance On Standby
            </span>
          )}
          {hospital.contact_number && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <Phone className="w-3 h-3" /> {hospital.contact_number}
            </span>
          )}
        </div>

        {onSelect && (
          <button
            onClick={() => onSelect(hospital.hospital_id)}
            disabled={!hospital.department_available && !isEmergency}
            className={`px-4 py-2 rounded-lg font-semibold text-xs tracking-wide shadow-xs transition-all duration-150 cursor-pointer ${
              isEmergency
                ? "bg-red-600 hover:bg-red-700 text-white"
                : selected
                ? "bg-blue-700 text-white ring-2 ring-blue-300"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {actionLabel}
          </button>
        )}
      </div>

      {/* Match breakdown bullet points */}
      {hospital.match_reasons && hospital.match_reasons.length > 0 && (
        <div className="mt-3 pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 font-medium mb-1">Matching Criteria Breakdown:</p>
          <div className="flex flex-wrap gap-1.5">
            {hospital.match_reasons.map((reason, i) => (
              <span
                key={i}
                className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded"
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
