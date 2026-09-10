import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { EmergencyAlertBanner } from "../components/EmergencyAlertBanner";
import api from "../services/api";
import { Referral } from "../types";

export const MainLayout: React.FC = () => {
  const [emergencyReferrals, setEmergencyReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    const checkEmergencies = async () => {
      try {
        const refs = await api.getReferrals({ severity: "EMERGENCY" });
        setEmergencyReferrals(refs);
      } catch (e) {
        console.error("Failed to check emergencies", e);
      }
    };
    checkEmergencies();
    const interval = setInterval(checkEmergencies, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      <Navbar />
      <EmergencyAlertBanner emergencyReferrals={emergencyReferrals} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">RURALCARE</span>
            <span>• SIH26133 • Central Platform (Member 2 Module)</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>PHC Portal (Member 1 API Ready)</span>
            <span>•</span>
            <span>Higher Hospital Portal (Member 3 API Ready)</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
