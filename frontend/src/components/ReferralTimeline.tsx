import React from "react";
import { ReferralEvent } from "../types";
import {
  CheckCircle2,
  Clock,
  Ambulance,
  UserCheck,
  UserX,
  BellRing,
  CalendarCheck,
  Building2,
  FileText,
} from "lucide-react";

interface ReferralTimelineProps {
  events: ReferralEvent[];
}

export const ReferralTimeline: React.FC<ReferralTimelineProps> = ({
  events,
}) => {
  if (!events || events.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 text-sm">
        No lifecycle events recorded yet.
      </div>
    );
  }

  const getEventIcon = (status: string) => {
    switch (status) {
      case "REFERRAL_CREATED":
        return <FileText className="w-4 h-4 text-blue-600" />;
      case "HOSPITAL_SELECTED":
        return <Building2 className="w-4 h-4 text-indigo-600" />;
      case "APPOINTMENT_BOOKED":
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case "EMERGENCY_TRANSFER":
        return <Ambulance className="w-4 h-4 text-red-600" />;
      case "PATIENT_ATTENDED":
        return <UserCheck className="w-4 h-4 text-teal-600" />;
      case "NOT_ATTENDED":
        return <UserX className="w-4 h-4 text-rose-600" />;
      case "PHC_NOTIFIED":
        return <BellRing className="w-4 h-4 text-purple-600" />;
      case "COMPLETED":
      case "CASE_CLOSED":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "PHC_WORKER":
        return "bg-sky-100 text-sky-800 border-sky-200";
      case "CENTRAL_OPERATOR":
        return "bg-indigo-100 text-indigo-800 border-indigo-200";
      case "HIGHER_HOSPITAL_DOCTOR":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "CENTRAL_PLATFORM_INTEGRATION":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((evt, idx) => (
        <div key={evt.event_id || idx} className="relative flex items-start gap-4">
          <div className="absolute -left-6 top-1 flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-slate-300 shadow-sm z-10">
            {getEventIcon(evt.to_status)}
          </div>
          <div className="flex-1 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-800 text-sm">
                  {evt.to_status.replace(/_/g, " ")}
                </span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getRoleBadge(
                    evt.actor_role
                  )}`}
                >
                  {evt.actor_role.replace(/_/g, " ")}
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(evt.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1">{evt.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
