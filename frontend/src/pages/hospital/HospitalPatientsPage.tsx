import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Referral } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const HospitalPatientsPage: React.FC = () => {
  const { hospitalId = "H001" } = useParams<{ hospitalId: string }>();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getReferrals({ hospital_id: hospitalId });
      setReferrals(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [hospitalId]);

  const attendedPatients = referrals.filter((r) =>
    ["PATIENT_ATTENDED", "UNDER_TREATMENT", "FOLLOW_UP", "COMPLETED", "CASE_CLOSED"].includes(
      r.referral_status
    )
  );

  const filtered = attendedPatients.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.patient_id.toLowerCase().includes(q) ||
      r.referral_id.toLowerCase().includes(q) ||
      (r.required_department || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold">
              HOSPITAL PATIENT DIRECTORY
            </span>
            <span className="text-slate-400 text-xs font-mono">Hospital: {hospitalId}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Attended & Treated Patients ({attendedPatients.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Patients who have reported to this hospital, underwent specialist consultation, or are undergoing follow-up treatment.
          </p>
        </div>

        <button
          onClick={loadData}
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
            placeholder="Search patient ID, referral ID, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
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
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Current Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-indigo-600" />
                    Loading patient list...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No attended patients recorded yet for this facility.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-slate-900">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5 font-mono font-bold text-indigo-700">
                      <Link to={`/hospital/${hospitalId}/referral/${r.referral_id}`} className="hover:underline">
                        {r.referral_id}
                      </Link>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{r.phc_name || r.phc_id}</div>
                      <div className="text-[10px] text-slate-400">{r.phc_district}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{r.required_department}</div>
                    </td>
                    <td className="p-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/hospital/${hospitalId}/referral/${r.referral_id}`}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Clinical Dossier
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

export default HospitalPatientsPage;
