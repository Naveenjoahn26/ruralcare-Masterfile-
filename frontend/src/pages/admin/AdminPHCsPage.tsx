import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building,
  MapPin,
  Users,
  ExternalLink,
  PlusCircle,
  Search,
  Activity,
  RefreshCw,
  Compass,
  Stethoscope,
} from "lucide-react";
import api from "../../services/api";
import { PHC, Referral, PatientRecordReference } from "../../types";

export const AdminPHCsPage: React.FC = () => {
  const navigate = useNavigate();
  const [phcs, setPHCs] = useState<PHC[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [patients, setPatients] = useState<PatientRecordReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [phcsData, refsData, patientsData] = await Promise.all([
        api.getPHCs(),
        api.getReferrals(),
        api.listPatients({ limit: 200 }),
      ]);
      setPHCs(phcsData);
      setReferrals(refsData);
      setPatients(patientsData);
    } catch (e) {
      console.error("Failed to load PHC directory", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPHCs = phcs.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.phc_name.toLowerCase().includes(q) ||
      p.phc_id.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                NETWORK TOPOLOGY
              </span>
              <span className="text-slate-400 text-xs font-mono">
                Member 1 Integration Endpoints
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Primary Health Centers Network ({phcs.length})
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Connected rural primary care nodes feeding referral demand and patient telemetry into the Central Platform.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <Link
              to="/phc/patient/new"
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              Register Patient
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 pt-4 border-t border-slate-100 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search PHC by name, district, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>
      </div>

      {/* PHC Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPHCs.map((phc) => {
          const phcReferrals = referrals.filter((r) => r.phc_id === phc.phc_id);
          const phcPatients = patients.filter((p) => p.phc_id === phc.phc_id);
          const emergencyCount = phcReferrals.filter((r) => r.severity === "EMERGENCY").length;

          return (
            <div
              key={phc.phc_id}
              className="bg-white rounded-xl shadow-sm border border-slate-200 hover:border-emerald-300 hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xs">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm leading-tight">
                        {phc.phc_name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        ID: {phc.phc_id}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {phc.district}, {phc.state}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                    <Compass className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {phc.latitude.toFixed(4)}° N, {phc.longitude.toFixed(4)}° E
                    </span>
                  </div>
                </div>

                {/* Volume Stats */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center mb-4">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Patients</div>
                    <div className="text-sm font-black text-slate-800">{phcPatients.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Referrals</div>
                    <div className="text-sm font-black text-blue-600">{phcReferrals.length}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Emergency</div>
                    <div className="text-sm font-black text-red-600">{emergencyCount}</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => navigate(`/phc?phc_id=${phc.phc_id}`)}
                  className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Launch PHC Portal
                </button>
                <Link
                  to={`/phc/patient/new?phc_id=${phc.phc_id}`}
                  className="p-1.5 text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg transition"
                  title="Register new patient at this PHC"
                >
                  <PlusCircle className="w-4 h-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminPHCsPage;
