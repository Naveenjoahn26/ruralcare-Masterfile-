import React from "react";
import { ReferralStatus } from "../types";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  CalendarCheck,
  Ambulance,
  Activity,
  UserCheck,
  UserX,
  BellRing,
} from "lucide-react";

interface StatusBadgeProps {
  status: ReferralStatus | string;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const getStatusConfig = (st: string) => {
    switch (st) {
      case "REFERRAL_CREATED":
        return {
          label: "Referral Created",
          bg: "bg-blue-50 text-blue-700 border-blue-200",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "HOSPITAL_SELECTION_PENDING":
        return {
          label: "Selection Pending",
          bg: "bg-amber-50 text-amber-700 border-amber-200",
          icon: <AlertCircle className="w-3.5 h-3.5" />,
        };
      case "HOSPITAL_SELECTED":
        return {
          label: "Hospital Selected",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "APPOINTMENT_BOOKED":
        return {
          label: "Appointment Booked",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: <CalendarCheck className="w-3.5 h-3.5" />,
        };
      case "EMERGENCY_TRANSFER_PENDING":
        return {
          label: "Emergency Pending",
          bg: "bg-red-50 text-red-700 border-red-200 animate-pulse",
          icon: <AlertTriangle className="w-3.5 h-3.5" />,
        };
      case "EMERGENCY_TRANSFER":
        return {
          label: "Emergency Transfer",
          bg: "bg-red-100 text-red-800 border-red-300 font-bold",
          icon: <Ambulance className="w-3.5 h-3.5" />,
        };
      case "REFERRED":
        return {
          label: "Referred",
          bg: "bg-sky-50 text-sky-700 border-sky-200",
          icon: <Activity className="w-3.5 h-3.5" />,
        };
      case "REFERRAL_ACCEPTED":
        return {
          label: "Referral Accepted",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      case "PATIENT_ATTENDED":
        return {
          label: "Patient Attended",
          bg: "bg-teal-50 text-teal-700 border-teal-200",
          icon: <UserCheck className="w-3.5 h-3.5" />,
        };
      case "NOT_ATTENDED":
        return {
          label: "Not Attended",
          bg: "bg-rose-50 text-rose-700 border-rose-300",
          icon: <UserX className="w-3.5 h-3.5" />,
        };
      case "PHC_NOTIFIED":
        return {
          label: "PHC Notified",
          bg: "bg-purple-50 text-purple-700 border-purple-200",
          icon: <BellRing className="w-3.5 h-3.5" />,
        };
      case "UNDER_TREATMENT":
        return {
          label: "Under Treatment",
          bg: "bg-cyan-50 text-cyan-700 border-cyan-200",
          icon: <Activity className="w-3.5 h-3.5" />,
        };
      case "FOLLOW_UP":
        return {
          label: "Follow Up",
          bg: "bg-yellow-50 text-yellow-800 border-yellow-200",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
      case "COMPLETED":
      case "CASE_CLOSED":
        return {
          label: "Completed",
          bg: "bg-green-50 text-green-700 border-green-200",
          icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        };
      default:
        return {
          label: st.replace(/_/g, " "),
          bg: "bg-slate-100 text-slate-700 border-slate-200",
          icon: <Clock className="w-3.5 h-3.5" />,
        };
    }
  };

  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${sizeClasses[size]}`}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
