import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  UserPlus,
  GitPullRequest,
  CalendarCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Stethoscope,
  Building,
  RefreshCw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { PHC, NotificationItem } from "../types";

export const PHCLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { phcId, logout, user } = useAuth();

  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  useEffect(() => {
    const loadPHCs = async () => {
      try {
        const data = await api.getPHCs();
        setPhcs(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadPHCs();
  }, []);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications({ phc_id: phcId, unread_only: true, limit: 10 });
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, [phcId]);



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const activePHC = phcs.find((p) => p.phc_id === phcId);

  const navLinks = [
    { to: "/phc/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/phc/patient/new", label: "New Patient & Triage", icon: <UserPlus className="w-4 h-4 text-emerald-400" /> },
    { to: "/phc/patients", label: "Patients Directory", icon: <Users className="w-4 h-4" /> },
    { to: "/phc/referrals", label: "My Referrals", icon: <GitPullRequest className="w-4 h-4" /> },
    { to: "/phc/appointments", label: "Appointments", icon: <CalendarCheck className="w-4 h-4" /> },
    { to: "/phc/notifications", label: "Alerts & Notifications", icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-900 text-slate-200 p-4 border-r border-slate-800 shrink-0">
        <div>
          {/* Logo */}
          <Link to="/phc/dashboard" className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-lg text-white leading-none flex items-center gap-1">
                RURAL<span className="text-emerald-400">CARE</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">
                PHC Worker Portal
              </span>
            </div>
          </Link>

          {/* Active PHC Selector Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span>Active PHC Facility</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white mb-1">
              {activePHC ? `${activePHC.phc_name} (${activePHC.phc_id})` : phcId}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {activePHC ? `${activePHC.district}, ${activePHC.state}` : "National Health Grid"}
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {link.icon}
                  {link.label}
                  {link.to === "/phc/notifications" && notifications.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <div className="font-bold text-xs text-white">{user?.userName || "Medical Officer"}</div>
            <div className="text-[10px] text-emerald-400 font-mono">Role: PHC Practitioner</div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-red-950 hover:text-red-300 hover:border-red-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                {activePHC?.phc_name || "Primary Health Center"}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Facility ID: <strong className="text-emerald-700 font-bold">{phcId}</strong> • Member 1 Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/phc/patient/new"
              className="hidden sm:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" /> Register Patient
            </Link>

            {/* Notification Dropdown Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="PHC Alerts"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 z-50 text-xs">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-slate-900">PHC Notifications</span>
                    <span className="text-[10px] text-slate-500">{notifications.length} Unread</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400">No unread alerts</div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.notification_id} className="p-3 hover:bg-slate-50">
                          <div className="font-bold text-red-600">{n.event_type}</div>
                          <p className="text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">Patient: {n.patient_id}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 pt-2 border-t border-slate-100 text-center">
                    <Link
                      to="/phc/notifications"
                      onClick={() => setShowNotifDropdown(false)}
                      className="font-bold text-emerald-600 hover:underline"
                    >
                      View All Alerts &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Modal */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 text-white p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-lg">
                    RURAL<span className="text-emerald-400">CARE</span>
                  </span>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                <nav className="space-y-1 mt-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-slate-800 text-red-400 rounded-xl text-xs font-bold"
              >
                Logout
              </button>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PHCLayout;
