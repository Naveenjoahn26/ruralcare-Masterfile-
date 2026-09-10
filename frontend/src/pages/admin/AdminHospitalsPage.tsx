import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Search,
  RefreshCw,
  Eye,
  MapPin,
  HeartPulse,
  Stethoscope,
  Phone,
  Ambulance,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Hospital } from "../../types";

export const AdminHospitalsPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const data = await api.getHospitals();
      setHospitals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const filtered = hospitals.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      h.hospital_name.toLowerCase().includes(q) ||
      h.district.toLowerCase().includes(q) ||
      h.hospital_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              TERTIARY CARE GRID
            </span>
            <span className="text-slate-400 text-xs font-mono">Member 3 Endpoints</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Higher District Hospitals Network ({hospitals.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected secondary & tertiary hospitals receiving specialist referrals, diagnostics, and emergency trauma transfers.
          </p>
        </div>

        <button
          onClick={loadHospitals}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospital by name, district, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Grid of Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((hosp) => {
          const res = hosp.emergency_resource;

          return (
            <div
              key={hosp.hospital_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 hover:border-indigo-300 hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded font-mono">
                      {hosp.hospital_id} • {hosp.hospital_type}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-1">
                      {hosp.hospital_name}
                    </h2>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{hosp.district}, {hosp.state}</span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    ONLINE
                  </span>
                </div>

                {/* Emergency & Beds Grid */}
                <div className="grid grid-cols-4 gap-2 pt-4 border-t border-slate-100 text-center text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">ER Beds</div>
                    <div className="font-bold text-slate-800 mt-0.5">{res?.emergency_beds || "-"}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">ICU Beds</div>
                    <div className="font-bold text-red-600 mt-0.5">{res?.icu_beds_available || "-"}</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Oxygen</div>
                    <div className="font-bold text-emerald-600 mt-0.5">
                      {res?.oxygen_available === "YES" ? "READY" : "NO"}
                    </div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">108 Amb</div>
                    <div className="font-bold text-emerald-600 mt-0.5">
                      {res?.ambulance_available === "YES" ? "YES" : "NO"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Ambulance: <strong className="font-mono text-slate-600">{hosp.ambulance_number || "108"}</strong>
                </span>

                <Link
                  to={`/hospital/${hosp.hospital_id}/dashboard`}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" /> Launch Hospital Portal &rarr;
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHospitalsPage;
