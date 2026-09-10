import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useParams, Outlet } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Users,
  GitPullRequest,
  CalendarCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Building,
  RefreshCw,
  Clock,
  HeartPulse,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { Hospital } from "../types";

export const HospitalLayout: React.FC = () => {
  const { hospitalId: routeHospitalId } = useParams<{ hospitalId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { hospitalId, logout, user } = useAuth();

  const activeHospId = routeHospitalId || hospitalId || "H001";

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [currentHospital, setCurrentHospital] = useState<Hospital | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const loadHospitals = async () => {
      try {
        const data = await api.getHospitals();
        setHospitals(data);
        const curr = data.find((h) => h.hospital_id === activeHospId);
        setCurrentHospital(curr || null);
      } catch (e) {
        console.error(e);
      }
    };
    loadHospitals();
  }, [activeHospId]);



  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navLinks = [
    { to: `/hospital/${activeHospId}/dashboard`, label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { to: `/hospital/${activeHospId}/referrals`, label: "Incoming Referrals Queue", icon: <GitPullRequest className="w-4 h-4 text-indigo-400" /> },
    { to: `/hospital/${activeHospId}/patients`, label: "Attended Patients", icon: <Users className="w-4 h-4" /> },
    { to: `/hospital/${activeHospId}/followups`, label: "Follow-up Registry", icon: <CalendarCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col justify-between w-64 bg-slate-900 text-slate-200 p-4 border-r border-slate-800 shrink-0">
        <div>
          {/* Logo */}
          <Link to={`/hospital/${activeHospId}/dashboard`} className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-lg text-white leading-none flex items-center gap-1">
                RURAL<span className="text-indigo-400">CARE</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                Higher Hospital Portal
              </span>
            </div>
          </Link>

          {/* Active Hospital Selector Card */}
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6">
            <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
              <span>Selected Hospital</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            </div>
            <div className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-white mb-1">
              {currentHospital ? `${currentHospital.hospital_name} (${currentHospital.hospital_id})` : activeHospId}
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono">
              {currentHospital ? `${currentHospital.district} • ${currentHospital.hospital_type}` : ""}
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
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User profile & Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="px-2">
            <div className="font-bold text-xs text-white">{user?.userName || "Specialist Doctor"}</div>
            <div className="text-[10px] text-indigo-400 font-mono">Role: Hospital Specialist</div>
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
                {currentHospital?.hospital_name || "District Hospital"}
              </h1>
              <p className="text-xs text-slate-500 font-mono">
                Facility ID: <strong className="text-indigo-700 font-bold">{activeHospId}</strong> • Member 3 Clinical Integration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={`/hospital/${activeHospId}/referrals`}
              className="hidden sm:flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
            >
              <GitPullRequest className="w-3.5 h-3.5" /> Incoming Referrals Queue
            </Link>
          </div>
        </header>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex">
            <div className="w-64 bg-slate-900 text-white p-4 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <span className="font-black text-lg">
                    RURAL<span className="text-indigo-400">CARE</span>
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

export default HospitalLayout;
