import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Building,
  Users,
  Ambulance,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  Bell,
  RefreshCw,
  Stethoscope,
  HeartPulse,
  Send,
  Eye,
  Clock,
  Radio,
} from "lucide-react";
import api from "../../services/api";
import { DashboardStats, Hospital, PHC, NotificationItem } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [phcs, setPHCs] = useState<PHC[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [statsData, hospitalsData, phcsData, notifsData] = await Promise.all([
        api.getDashboardStats(),
        api.getHospitals(),
        api.getPHCs(),
        api.getNotifications({ limit: 8 }),
      ]);
      setStats(statsData);
      setHospitals(hospitalsData);
      setPHCs(phcsData);
      setNotifications(notifsData);
    } catch (e) {
      console.error("Failed to load admin dashboard data", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 12000);
    return () => clearInterval(timer);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">
            Loading Central Health Grid Command Center...
          </p>
        </div>
      </div>
    );
  }

  // Calculate emergency resource totals across the network
  const totalEmergencyBeds = hospitals.reduce(
    (acc, h) => acc + (h.emergency_resource?.emergency_beds || 0),
    0
  );
  const totalICUBeds = hospitals.reduce(
    (acc, h) => acc + (h.emergency_resource?.icu_beds_available || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome & Central Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold border border-blue-500/30">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                CENTRAL PLATFORM OPERATIONAL HUB
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 text-xs font-mono">
                SIH26133 Connected Grid
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
              State Healthcare Command Center
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Centralized orchestration engine bridging {phcs.length} Primary Health Centers (PHC)
              with {hospitals.length} Secondary & Tertiary District Hospitals in real time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-cyan-400" : ""}`} />
              Refresh Network
            </button>
            <Link
              to="/admin/referrals"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/30"
            >
              <Activity className="w-4 h-4" />
              Referral Journey Monitor
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Total Referrals */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Referrals
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.total_referrals || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Logged across all PHCs</span>
          </div>
        </div>

        {/* Medium Severity */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Specialist Referrals
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats?.medium_referrals || 0}
          </div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">
            {stats?.appointments_booked || 0} slots confirmed
          </div>
        </div>

        {/* Emergency Referrals */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-red-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Emergency 108
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Ambulance className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 mt-2">
            {stats?.emergency_referrals || 0}
          </div>
          <div className="text-[11px] text-red-600 mt-1 font-medium">
            Immediate dispatch active
          </div>
        </div>

        {/* Missed Care / Not Attended */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Missed Care (Alert)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {stats?.not_attended_count || 0}
          </div>
          <div className="text-[11px] text-rose-500 mt-1 font-medium">
            ASHA outreach triggered
          </div>
        </div>

        {/* Completed Cases */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Completed Care
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {stats?.completed_referrals || 0}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">
            Treated & Closed
          </div>
        </div>

        {/* Network Nodes */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Active Grid Nodes
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {phcs.length + hospitals.length}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 font-medium">
            {phcs.length} PHCs • {hospitals.length} Hospitals
          </div>
        </div>
      </div>

      {/* Role Portal Quick Launch Strip */}
      <div className="bg-slate-900 rounded-xl p-4 text-white border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">Role-Based System Switcher</h2>
            <p className="text-xs text-slate-400">
              Jump directly to specific operational actor dashboards to test or perform role actions.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate("/phc")}
            className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs font-semibold cursor-pointer transition"
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
            🩺 PHC Worker Portal
          </button>
          <button
            onClick={() => navigate("/hospital/H001")}
            className="flex items-center gap-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-500/30 text-xs font-semibold cursor-pointer transition"
          >
            <Building className="w-3.5 h-3.5 text-blue-400" />
            🏥 Higher Hospital Portal (H001)
          </button>
          <button
            onClick={() => navigate("/admin/notifications")}
            className="flex items-center gap-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30 text-xs font-semibold cursor-pointer transition"
          >
            <Bell className="w-3.5 h-3.5 text-purple-400" />
            📢 Multi-Channel Notifications
          </button>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Referrals & Flow */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Referral Stream */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-slate-800 text-sm">
                  Live Referral Grid Activity
                </h2>
              </div>
              <Link
                to="/admin/referrals"
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View Full Monitor <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Referral ID</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Origin PHC</th>
                    <th className="px-4 py-3">Target Hospital</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.recent_referrals && stats.recent_referrals.length > 0 ? (
                    stats.recent_referrals.map((ref) => (
                      <tr key={ref.referral_id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {ref.referral_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {ref.patient_id}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Dept: {ref.required_department}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-slate-700">
                            {ref.phc_name || ref.phc_id}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {ref.selected_hospital_name ? (
                            <span className="font-medium text-slate-800">
                              {ref.selected_hospital_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Selected</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <SeverityBadge severity={ref.severity} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ref.referral_status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/referrals/${ref.referral_id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition"
                          >
                            <Eye className="w-3 h-3" /> Details
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-6 text-slate-400">
                        No active referrals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Regional Hospital Emergency & Bed Capacity Matrix */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-slate-800 text-sm">
                  Secondary/Tertiary Hospital Emergency Resource Matrix
                </h2>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Network: {totalEmergencyBeds} Emergency Beds • {totalICUBeds} ICU Beds
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospitals.slice(0, 6).map((h) => {
                const res = h.emergency_resource;
                return (
                  <div
                    key={h.hospital_id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 text-xs">
                          {h.hospital_name}
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {h.district} • ID: {h.hospital_id}
                        </div>
                      </div>
                      <Link
                        to={`/hospital/${h.hospital_id}`}
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Open Portal &rarr;
                      </Link>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          ER Beds
                        </div>
                        <div className="font-black text-slate-700 text-xs">
                          {res?.emergency_beds ?? "-"}
                        </div>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          ICU Beds
                        </div>
                        <div className="font-black text-red-600 text-xs">
                          {res?.icu_beds_available ?? "-"}
                        </div>
                      </div>
                      <div className="bg-white p-1.5 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400 uppercase font-bold">
                          Oxygen
                        </div>
                        <div
                          className={`font-black text-xs ${
                            res?.oxygen_available === "YES"
                              ? "text-emerald-600"
                              : "text-slate-400"
                          }`}
                        >
                          {res?.oxygen_available === "YES" ? "READY" : "NO"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Multi-Channel Alerts & PHC Network */}
        <div className="space-y-6">
          {/* Notification Stream */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-purple-600" />
                <h2 className="font-bold text-slate-800 text-sm">
                  Multi-Channel Broadcast Log
                </h2>
              </div>
              <Link
                to="/admin/notifications"
                className="text-xs font-semibold text-purple-600 hover:text-purple-800"
              >
                All Logs &rarr;
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {notifications && notifications.length > 0 ? (
                notifications.map((n) => (
                  <div key={n.notification_id} className="p-3.5 hover:bg-slate-50/80 text-xs">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-bold text-slate-800">{n.event_type}</span>
                      <span className="text-[10px] text-slate-400">
                        {n.channel || "SMS / EMAIL"}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                      <span>PHC: {n.phc_id}</span>
                      <span>{n.created_at ? new Date(n.created_at).toLocaleTimeString() : ""}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400">
                  No recent notifications recorded.
                </div>
              )}
            </div>
          </div>

          {/* Primary Health Centers Overview */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-slate-800 text-sm">
                  Primary Health Centers ({phcs.length})
                </h2>
              </div>
              <Link
                to="/admin/phcs"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800"
              >
                View Map & List &rarr;
              </Link>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {phcs.map((phc) => (
                <div
                  key={phc.phc_id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-800">{phc.phc_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {phc.district}, {phc.state} • ID: {phc.phc_id}
                    </div>
                  </div>
                  <Link
                    to={`/phc?phc_id=${phc.phc_id}`}
                    className="text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded transition"
                  >
                    Open PHC
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
