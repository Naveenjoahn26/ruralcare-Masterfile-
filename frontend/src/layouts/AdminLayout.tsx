import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  Building,
  CalendarCheck,
  Ambulance,
  Bell,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  RefreshCw,
  Stethoscope,
  Radio,
  FileCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

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

  const navLinks = [
    { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: "/admin/referrals", label: "Referral Monitor", icon: <Activity className="w-4 h-4" /> },
    { to: "/admin/phcs", label: "PHC Network", icon: <Stethoscope className="w-4 h-4" /> },
    { to: "/admin/hospitals", label: "Higher Hospitals", icon: <Building className="w-4 h-4" /> },
    { to: "/admin/appointments", label: "Appointments", icon: <CalendarCheck className="w-4 h-4" /> },
    { to: "/admin/emergencies", label: "Emergency Transfers", icon: <Ambulance className="w-4 h-4 text-red-400" /> },
    { to: "/admin/notifications", label: "Notifications Log", icon: <Bell className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-950 text-slate-200 p-4 border-r border-slate-800 shrink-0">
        <div>
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-lg text-white leading-none flex items-center gap-1">
                RURAL<span className="text-cyan-400">CARE</span>
              </div>
              <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">
                Central Admin Portal
              </span>
            </div>
          </Link>

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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Actions */}
        <div className="pt-4 border-t border-slate-900 space-y-3">
          <button
            onClick={handleResetSeed}
            disabled={isResetting}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-[11px] font-bold border border-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? "animate-spin text-cyan-400" : ""}`} />
            Reseed Datasets
          </button>

          <div className="px-2">
            <div className="font-bold text-xs text-white">{user?.userName || "State Administrator"}</div>
            <div className="text-[10px] text-blue-400 font-mono">Role: Central Commander</div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-red-950 hover:text-red-300 text-slate-400 border border-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
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
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></span>
                <h1 className="text-base font-black text-slate-900 leading-tight">
                  State Health Mission Command Hub
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                SIH26133 Central Orchestration Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/admin/referrals"
              className="hidden sm:flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Activity className="w-3.5 h-3.5" /> Live Monitor
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-950 text-white p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-lg">
                    RURAL<span className="text-cyan-400">CARE</span>
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
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-900"
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-slate-900 text-red-400 rounded-xl text-xs font-bold"
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

export default AdminLayout;
