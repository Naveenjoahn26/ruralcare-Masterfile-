import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  Search,
  Filter,
  RefreshCw,
  Building,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import { Referral, Hospital } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const AdminAppointmentsPage: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const [refs, hosps] = await Promise.all([
        api.getReferrals(),
        api.getHospitals(),
      ]);
      setReferrals(refs.filter((r) => r.appointment_slot_id || r.appointment_details || r.referral_status === "APPOINTMENT_BOOKED" || r.referral_status === "REFERRAL_ACCEPTED" || r.referral_status === "PATIENT_ATTENDED"));
      setHospitals(hosps);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = referrals.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.referral_id.toLowerCase().includes(q) ||
      r.patient_id.toLowerCase().includes(q) ||
      (r.selected_hospital_name || "").toLowerCase().includes(q) ||
      (r.phc_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
              STATE HEALTH GRID
            </span>
            <span className="text-slate-400 text-xs font-mono">Central Appointments Tracker</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Network Scheduled Appointments ({referrals.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Verified doctor consultation slots booked by rural PHCs across secondary & tertiary hospitals.
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

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search referral ID, patient, hospital, PHC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Target Hospital</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Slot Date & Time</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-blue-600" />
                    Loading appointments...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    No booked appointments found.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      {r.referral_id}
                    </td>
                    <td className="p-3.5 font-bold text-slate-800 font-mono">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">{r.phc_name || r.phc_id}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-800">
                        {r.selected_hospital_name || r.selected_hospital_id}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-medium text-slate-800">{r.required_department}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-800 font-bold">
                      {r.appointment_details ? (
                        <span>
                          {r.appointment_details.date} ({r.appointment_details.start_time} - {r.appointment_details.end_time})
                        </span>
                      ) : (
                        <span>Reserved Slot</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        to={`/admin/referrals`}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> Dossier
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

export default AdminAppointmentsPage;
