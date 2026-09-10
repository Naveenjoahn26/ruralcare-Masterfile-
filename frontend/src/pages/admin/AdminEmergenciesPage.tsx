import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ambulance,
  HeartPulse,
  Building,
  RefreshCw,
  Search,
  Eye,
  MapPin,
  Clock,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Referral, Hospital } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const AdminEmergenciesPage: React.FC = () => {
  const [emergencies, setEmergencies] = useState<Referral[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [refs, hosps] = await Promise.all([
        api.getReferrals({ severity: "EMERGENCY" }),
        api.getHospitals(),
      ]);
      setEmergencies(refs);
      setHospitals(hosps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalICUBeds = hospitals.reduce(
    (acc, h) => acc + (h.emergency_resource?.icu_beds_available || 0),
    0
  );
  const totalEmergencyBeds = hospitals.reduce(
    (acc, h) => acc + (h.emergency_resource?.emergency_beds || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-red-600 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
              108 RAPID RESPONSE GRID
            </span>
            <span className="text-red-200 text-xs font-mono">Central Emergency Matrix</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Emergency Transfers & Trauma Network ({emergencies.length})
          </h1>
          <p className="text-xs text-red-100 mt-1">
            Critical patient transfers dispatched directly from rural PHCs to tertiary hospital trauma centers.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 bg-white text-red-700 hover:bg-red-50 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Resource Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Total Emergency Dispatches</span>
          <div className="text-2xl font-black text-red-600 mt-1">{emergencies.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Critical 108 transfers</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Network ICU Beds</span>
          <div className="text-2xl font-black text-red-600 mt-1">{totalICUBeds} Available</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Across 10 Higher Hospitals</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Network Emergency Beds</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalEmergencyBeds} Beds</div>
          <div className="text-[10px] text-slate-400 mt-0.5">24x7 Trauma Units</div>
        </div>
      </div>

      {/* Emergency Transfers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Receiving Hospital</th>
                <th className="p-3.5">Clinical Reason / Distress</th>
                <th className="p-3.5">Dispatched Date</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-red-600" />
                    Loading emergency records...
                  </td>
                </tr>
              ) : emergencies.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No emergency transfers currently logged.
                  </td>
                </tr>
              ) : (
                emergencies.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-red-600">
                      {r.referral_id}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 font-mono">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{r.phc_name || r.phc_id}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{r.selected_hospital_name}</div>
                    </td>
                    <td className="p-3.5 max-w-xs">
                      <p className="line-clamp-1 text-slate-700 font-medium">
                        {r.reason || "Critical trauma emergency"}
                      </p>
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-400">
                      {r.created_date}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/admin/referrals`}
                        className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Dossier
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminEmergenciesPage;
