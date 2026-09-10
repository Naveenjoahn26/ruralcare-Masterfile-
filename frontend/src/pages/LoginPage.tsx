import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Activity,
  Stethoscope,
  ShieldCheck,
  Building,
  ArrowLeft,
  Lock,
  User,
  KeyRound,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading, role, hospitalId } = useAuth();

  const [selectedRole, setSelectedRole] = useState<"PHC" | "HOSPITAL" | "ADMIN">("PHC");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && role) {
      const dashboardPath =
        role === "PHC" ? "/phc/dashboard" :
        role === "HOSPITAL" ? `/hospital/${hospitalId || 'H001'}/dashboard` :
        "/admin/dashboard";
      navigate(dashboardPath, { replace: true });
    }
  }, [isLoading, isAuthenticated, role, hospitalId, navigate]);

  // Clear errors on tab switch, but don't auto-fill credentials
  useEffect(() => {
    setUsername("");
    setPassword("");
    setError("");
  }, [selectedRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await login(username, password);
      
      const from = location.state?.from?.pathname || (
        selectedRole === "PHC" ? "/phc/dashboard" :
        selectedRole === "HOSPITAL" ? "/hospital/H001/dashboard" :
        "/admin/dashboard"
      );
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid username or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-black text-lg text-white">
                RURAL<span className="text-cyan-400">CARE</span>
              </span>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Login Form Container */}
      <main className="max-w-md w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-cyan-500/30 text-cyan-400 mx-auto mb-2">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Healthcare Portal Login
            </h1>
            <p className="text-xs text-slate-400">
              Select your operational role to access your dedicated clinical interface.
            </p>
          </div>

          {/* Role Tab Selector */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSelectedRole("PHC")}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                selectedRole === "PHC"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>PHC Staff</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("HOSPITAL")}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                selectedRole === "HOSPITAL"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Hospital</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole("ADMIN")}
              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                selectedRole === "ADMIN"
                  ? "bg-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Central Admin</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Username:
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Password:</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition font-mono"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-xl font-bold text-xs text-white shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isSubmitting ? "opacity-70 scale-100 cursor-not-allowed" : "hover:scale-[1.02]"
              } ${
                selectedRole === "PHC"
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                  : selectedRole === "HOSPITAL"
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `Sign In to ${selectedRole === "PHC" ? "PHC Portal" : selectedRole === "HOSPITAL" ? "Hospital Portal" : "Admin Command"}`
              )}
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[11px] text-slate-500">
              Role-based access controls for National Health Grid (SIH26133).
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/40 py-4 text-center text-xs text-slate-500">
        RURALCARE • Connected Care from PHC to Higher Hospital
      </footer>
    </div>
  );
};

export default LoginPage;
