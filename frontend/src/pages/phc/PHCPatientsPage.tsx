import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Calendar,
  Activity,
  RefreshCw,
  Eye,
  FileText,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { PatientRecordReference, PHC } from "../../types";

export const PHCPatientsPage: React.FC = () => {
  const { phcId } = useAuth();
  const [patients, setPatients] = useState<PatientRecordReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadPatients = async () => {
    try {
      setLoading(true);
      const data = await api.listPatients({ phc_id: phcId, limit: 100 });
      setPatients(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [phcId]);

  const filteredPatients = patients.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.patient_id.toLowerCase().includes(q) ||
      (p.contact_number && p.contact_number.includes(q)) ||
      (p.preliminary_diagnosis && p.preliminary_diagnosis.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
              PHC PATIENT REGISTRY
            </span>
            <span className="text-slate-400 text-xs font-mono">Facility: {phcId}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Registered Patients ({patients.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Primary care records, preliminary diagnoses, vitals, and consultation histories for this PHC.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPatients}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            to="/phc/patient/new"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <UserPlus className="w-4 h-4" /> New Patient
          </Link>
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient by name, ID, phone, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Patients Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Patient ID</th>
                <th className="p-3.5">Full Name</th>
                <th className="p-3.5">Age / Gender</th>
                <th className="p-3.5">Contact Number</th>
                <th className="p-3.5">Preliminary Diagnosis</th>
                <th className="p-3.5">Registered Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-emerald-600" />
                    Loading patient records...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No patients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map((p) => (
                  <tr key={p.patient_id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {p.patient_id}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800">
                      {p.full_name}
                    </td>
                    <td className="p-3.5">
                      {p.age} yrs • {p.gender}
                    </td>
                    <td className="p-3.5 font-mono text-[11px]">
                      {p.contact_number || "—"}
                    </td>
                    <td className="p-3.5">
                      <span className="font-medium text-slate-700">
                        {p.preliminary_diagnosis || p.symptoms || "General Care"}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      {p.registered_date}
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/phc/patient/${p.patient_id}`}
                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Triage / Refer
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

export default PHCPatientsPage;
