import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  Compass,
  CalendarCheck,
  Ambulance,
  GitBranch,
  Bell,
  RefreshCw,
  Building,
  CheckCircle,
  Stethoscope,
  ShieldCheck,
  PlusCircle,
  Clock,
  ListOrdered,
} from "lucide-react";
import api from "../services/api";
import { NotificationItem } from "../types";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Determine current active persona/role mode
  const currentPath = location.pathname;
  const isPHCMode = currentPath.startsWith("/phc");
  const isHospitalMode = currentPath.startsWith("/hospital");
  const isAdminMode =
    currentPath.startsWith("/admin") ||
    currentPath === "/" ||
    currentPath.startsWith("/referrals") ||
    currentPath.startsWith("/matching") ||
    currentPath.startsWith("/appointments") ||
    currentPath.startsWith("/emergency") ||
    currentPath.startsWith("/tracking") ||
    currentPath.startsWith("/hospitals") ||
    currentPath.startsWith("/simulator");

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications({ unread_only: true, limit: 10 });
      setNotifications(data);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResetSeed = async () => {
    if (window.confirm("Reset and reseed database from the 10 original CSV files?")) {
      try {
        setIsResetting(true);
        await api.resetSeedDatabase();
        window.location.reload();
      } catch (e) {
        alert("Failed to reset database: " + e);
      } finally {
        setIsResetting(false);
      }
    }
  };

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) => prev.filter((n) => n.notification_id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  // Dynamic nav links based on role
  let navLinks: { to: string; label: string; icon: React.ReactNode }[] = [];

  if (isPHCMode) {
    navLinks = [
      { to: "/phc", label: "PHC Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/phc/patient/new", label: "New Patient & Triage", icon: <PlusCircle className="w-4 h-4 text-emerald-400" /> },
      { to: "/phc/referrals", label: "My Referrals Tracker", icon: <Clock className="w-4 h-4" /> },
    ];
  } else if (isHospitalMode) {
    // Extract hospital ID from path if present, otherwise default to H001
    const match = currentPath.match(/\/hospital\/(H\d{3})/);
    const activeHospitalId = match ? match[1] : "H001";

    navLinks = [
      { to: `/hospital/${activeHospitalId}`, label: "Hospital Clinical Queue", icon: <Building className="w-4 h-4" /> },
      { to: "/hospitals", label: "Hospital Directory", icon: <Users className="w-4 h-4" /> },
      { to: "/admin/referrals", label: "System Monitor", icon: <Activity className="w-4 h-4" /> },
    ];
  } else {
    // Central Admin & Core Platform Tools
    navLinks = [
      { to: "/admin", label: "Command Center", icon: <LayoutDashboard className="w-4 h-4" /> },
      { to: "/admin/referrals", label: "Referral Monitor", icon: <Activity className="w-4 h-4" /> },
      { to: "/admin/phcs", label: "PHC Grid", icon: <Stethoscope className="w-4 h-4" /> },
      { to: "/hospitals", label: "Hospitals", icon: <Building className="w-4 h-4" /> },
      { to: "/admin/notifications", label: "Notifications", icon: <Bell className="w-4 h-4 text-purple-400" /> },
      { to: "/matching", label: "Matching Sandbox", icon: <Compass className="w-4 h-4" /> },
      { to: "/simulator", label: "Integration Sandbox", icon: <GitBranch className="w-4 h-4 text-amber-400" /> },
    ];
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white shadow-md">
      {/* Top Universal Role & Grid Bar */}
      <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          {/* Brand & Project Metadata */}
          <div className="flex items-center gap-3">
            <span className="font-semibold text-emerald-400 tracking-wider flex items-center gap-1.5 uppercase text-[11px]">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              National Rural Health Grid – SIH26133
            </span>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <span className="text-slate-400 font-mono hidden sm:inline text-[11px]">
              Module: Member 2 (Central Platform)
            </span>
          </div>

          {/* Unified Role Switcher Pills */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-bold mr-1 hidden md:inline">
              Interface Role:
            </span>

            {/* PHC Pill */}
            <Link
              to="/phc"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                isPHCMode
                  ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Stethoscope className="w-3 h-3" />
              PHC Portal
            </Link>

            {/* Admin Pill */}
            <Link
              to="/admin"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                isAdminMode && !isPHCMode && !isHospitalMode
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              Central Admin
            </Link>

            {/* Higher Hospital Pill */}
            <Link
              to="/hospital/H001"
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition ${
                isHospitalMode
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              <Building className="w-3 h-3" />
              Higher Hospital
            </Link>

            {/* Reseed DB button */}
            <button
              onClick={handleResetSeed}
              disabled={isResetting}
              title="Reset DB to CSV Seed Data"
              className="flex items-center gap-1 text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded border border-slate-700 cursor-pointer transition ml-1"
            >
              <RefreshCw className={`w-2.5 h-2.5 ${isResetting ? "animate-spin" : ""}`} />
              Reseed
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
                RURAL<span className="text-cyan-400">CARE</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    isPHCMode
                      ? "bg-emerald-600/80 text-emerald-100"
                      : isHospitalMode
                      ? "bg-indigo-600/80 text-indigo-100"
                      : "bg-blue-600/80 text-blue-100"
                  }`}
                >
                  {isPHCMode
                    ? "PHC Portal"
                    : isHospitalMode
                    ? "Higher Hospital"
                    : "Central Platform"}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Connected Care from PHC to Higher Hospital
              </div>
            </div>
          </Link>

          {/* Contextual Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.to === "/" || link.to === "/phc" || link.to === "/admin"
                  ? location.pathname === link.to
                  : location.pathname.startsWith(link.to);
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full">
                    {notifications.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-800">
                      System Broadcasts & Alerts
                    </span>
                    <span className="text-xs text-slate-500">
                      {notifications.length} Unread
                    </span>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No unread notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.notification_id} className="p-3 hover:bg-slate-50 text-xs">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-red-600">{n.event_type}</span>
                            <button
                              onClick={() => markRead(n.notification_id)}
                              className="text-slate-400 hover:text-emerald-600"
                              title="Mark read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-slate-700 mt-1">{n.message}</p>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            PHC: {n.phc_id} • Patient: {n.patient_id}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 border-t border-slate-100 text-center">
                    <Link
                      to="/admin/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      View All Multi-Channel Logs &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800 scrollbar-none">
          {navLinks.map((link) => {
            const isActive =
              link.to === "/" || link.to === "/phc" || link.to === "/admin"
                ? location.pathname === link.to
                : location.pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
