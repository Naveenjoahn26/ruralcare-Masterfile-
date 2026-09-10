import React from "react";
import { Link } from "react-router-dom";
import { AlertOctagon, ArrowRight, Ambulance } from "lucide-react";
import { Referral } from "../types";

interface EmergencyAlertBannerProps {
  emergencyReferrals: Referral[];
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({
  emergencyReferrals,
}) => {
  const pendingEmergencies = emergencyReferrals.filter(
    (r) =>
      r.severity === "EMERGENCY" &&
      r.referral_status !== "COMPLETED" &&
      r.referral_status !== "CASE_CLOSED"
  );

  if (pendingEmergencies.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white px-4 py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span className="p-1.5 bg-white/20 rounded-lg shrink-0 animate-bounce">
            <AlertOctagon className="w-5 h-5 text-white" />
          </span>
          <div>
            <span className="font-black uppercase tracking-wider text-xs bg-red-900/60 px-2 py-0.5 rounded mr-2">
              Critical Triage Notice
            </span>
            <span className="font-semibold">
              {pendingEmergencies.length} Active Emergency Referral(s) Requiring Priority Dispatch:
            </span>{" "}
            <span className="text-red-100 text-xs">
              {pendingEmergencies.map((e) => `${e.referral_id} (${e.patient_id})`).join(", ")}
            </span>
          </div>
        </div>

        <Link
          to={`/emergency/${pendingEmergencies[0].referral_id}`}
          className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-4 py-1.5 rounded-lg text-xs font-bold tracking-wide shadow-sm shrink-0 transition"
        >
          <Ambulance className="w-4 h-4" />
          Dispatch Emergency Transfer
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
