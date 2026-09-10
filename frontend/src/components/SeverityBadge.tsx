import React from "react";
import { Severity } from "../types";
import { AlertCircle, AlertOctagon, CheckCircle } from "lucide-react";

interface SeverityBadgeProps {
  severity: Severity | string;
  size?: "sm" | "md" | "lg";
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  size = "md",
}) => {
  const sev = (severity || "").toUpperCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  };

  if (sev === "EMERGENCY") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-bold bg-red-600 text-white shadow-sm ring-2 ring-red-300 animate-pulse ${sizeClasses[size]}`}
      >
        <AlertOctagon className="w-3.5 h-3.5" />
        <span>EMERGENCY</span>
      </span>
    );
  }

  if (sev === "MEDIUM") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-amber-100 text-amber-900 border border-amber-300 ${sizeClasses[size]}`}
      >
        <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
        <span>MEDIUM</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 ${sizeClasses[size]}`}
    >
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
      <span>NORMAL</span>
    </span>
  );
};
