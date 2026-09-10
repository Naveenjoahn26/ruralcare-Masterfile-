import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  AlertTriangle,
  CalendarCheck,
  Ambulance,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Activity,
  PlusCircle,
  Building,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";
import { DashboardStats, Referral } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (e) {
      console.error("Error loading dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredReferrals =
    stats?.recent_referrals.filter((r) => {
      if (filterSeverity === "ALL") return true;
      return r.severity === filterSeverity;
    }) || [];

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading Central Platform Hub...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded w-fit mb-2 border border-blue-200">
            <Activity className="w-3.5 h-3.5" /> Central Coordination Dashboard
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            RURALCARE Central Operations Center
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time referral routing, higher hospital resource matching, and secondary care appointments for rural PHCs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/matching"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <TrendingUp className="w-4 h-4" /> Match Hospital
          </Link>
          <Link
            to="/simulator"
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" /> New Demo Referral
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Total Referrals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Referrals</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total_referrals || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across all PHCs</div>
        </div>

        {/* Medium Referrals */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Medium Cases</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">{stats?.medium_referrals || 0}</div>
          <div className="text-[11px] text-amber-700 mt-1">Patient Preference flow</div>
        </div>

        {/* Emergency Referrals */}
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-xs">
          <div className="flex items-center justify-between text-red-700 mb-2">
            <span className="text-xs font-semibold">Emergency</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-900">{stats?.emergency_referrals || 0}</div>
          <div className="text-[11px] text-red-700 mt-1">Direct Auto-Triage</div>
        </div>

        {/* Pending Selection */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Pending Choice</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.pending_selection || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Awaiting PHC input</div>
        </div>

        {/* Appointments Booked */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-2">
            <span className="text-xs font-semibold">Slots Booked</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-900">{stats?.appointments_booked || 0}</div>
          <div className="text-[11px] text-emerald-700 mt-1">Confirmed appointments</div>
        </div>

        {/* Emergency Transfers */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/20 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-semibold">ER Transfers</span>
            <Ambulance className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{stats?.emergency_transfers || 0}</div>
          <div className="text-[11px] text-rose-700 mt-1">Dispatched to ER</div>
        </div>

        {/* Completed Referrals */}
        <div className="bg-white p-4 rounded-xl border border-green-200 bg-green-50/20 shadow-xs">
          <div className="flex items-center justify-between text-green-700 mb-2">
            <span className="text-xs font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-black text-green-900">{stats?.completed_referrals || 0}</div>
          <div className="text-[11px] text-green-700 mt-1">Case closed by Hospital</div>
        </div>
      </div>

      {/* Network Infrastructure Summary Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Connected Higher Hospitals: <strong>{stats?.active_hospitals_count || 10}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Linked Primary Health Centres: <strong>{stats?.active_phcs_count || 5}</strong></span>
          </div>
        </div>
        <div className="text-slate-400">
          State Healthcare Grid: <strong>Tamil Nadu (Tiruppur & Coimbatore Clusters)</strong>
        </div>
      </div>

      {/* Recent Referrals Stream */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-black text-slate-900 text-lg">Active Referral Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live referrals synchronized between Member 1 PHCs and Member 3 Secondary/Tertiary Hospitals
            </p>
          </div>

          <div className="flex items-center gap-2">
            {["ALL", "MEDIUM", "EMERGENCY"].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  filterSeverity === sev
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {sev}
              </button>
            ))}
            <Link
              to="/referrals"
              className="text-xs font-bold text-blue-600 hover:text-blue-800 ml-2 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Referrals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient ID</th>
                <th className="p-3.5">Originating PHC</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Department / Test</th>
                <th className="p-3.5">Assigned Hospital</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-500">
                    No referrals found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      <Link to={`/referrals/${r.referral_id}`} className="hover:underline">
                        {r.referral_id}
                      </Link>
                    </td>
                    <td className="p-3.5 font-mono font-semibold text-slate-800">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{r.phc_name || r.phc_id}</div>
                      <div className="text-[11px] text-slate-500">{r.phc_district}</div>
                    </td>
                    <td className="p-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{r.required_department}</div>
                      {r.required_test && (
                        <div className="text-[11px] text-slate-500">Test: {r.required_test}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {r.selected_hospital_name ? (
                        <div className="font-semibold text-slate-900">
                          {r.selected_hospital_name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Not Assigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/referrals/${r.referral_id}`}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold text-[11px] transition"
                        >
                          View
                        </Link>

                        {r.severity === "MEDIUM" &&
                          (r.referral_status === "REFERRAL_CREATED" ||
                            r.referral_status === "HOSPITAL_SELECTION_PENDING") && (
                            <Link
                              to={`/matching?referral_id=${r.referral_id}`}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px] transition"
                            >
                              Match
                            </Link>
                          )}

                        {r.severity === "MEDIUM" &&
                          r.referral_status === "HOSPITAL_SELECTED" &&
                          r.selected_hospital_id && (
                            <Link
                              to={`/appointments/book?referral_id=${r.referral_id}&hospital_id=${r.selected_hospital_id}`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] transition"
                            >
                              Book Slot
                            </Link>
                          )}

                        {r.severity === "EMERGENCY" &&
                          r.referral_status !== "EMERGENCY_TRANSFER" &&
                          r.referral_status !== "COMPLETED" && (
                            <Link
                              to={`/emergency/${r.referral_id}`}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] transition"
                            >
                              Emergency Dispatch
                            </Link>
                          )}
                      </div>
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
