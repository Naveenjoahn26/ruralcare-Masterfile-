import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Ambulance,
  CalendarCheck,
  Building2,
  Eye,
} from "lucide-react";
import api from "../services/api";
import { Referral, PHC } from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";

export const ReferralListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>(
    searchParams.get("severity") || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParams.get("status") || ""
  );
  const [phcFilter, setPhcFilter] = useState<string>(
    searchParams.get("phc_id") || ""
  );

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const [refs, phcList] = await Promise.all([
        api.getReferrals({
          severity: severityFilter || undefined,
          status: statusFilter || undefined,
          phc_id: phcFilter || undefined,
          search: search || undefined,
        }),
        api.getPHCs(),
      ]);
      setReferrals(refs);
      setPhcs(phcList);
    } catch (e) {
      console.error("Error fetching referrals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [severityFilter, statusFilter, phcFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReferrals();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Referral Directory
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Manage, match, and route patient referrals from Primary Health Centres.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/matching"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Building2 className="w-4 h-4" /> Match Hospital
          </Link>
          <Link
            to="/simulator"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <Plus className="w-4 h-4 text-emerald-400" /> Create Referral
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient ID, Referral ID, or Department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Severities</option>
              <option value="MEDIUM">Medium</option>
              <option value="EMERGENCY">Emergency</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="REFERRAL_CREATED">Referral Created</option>
              <option value="HOSPITAL_SELECTION_PENDING">Selection Pending</option>
              <option value="HOSPITAL_SELECTED">Hospital Selected</option>
              <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
              <option value="EMERGENCY_TRANSFER">Emergency Transfer</option>
              <option value="PATIENT_ATTENDED">Patient Attended</option>
              <option value="NOT_ATTENDED">Not Attended</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={phcFilter}
              onChange={(e) => setPhcFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All PHCs</option>
              {phcs.map((p) => (
                <option key={p.phc_id} value={p.phc_id}>
                  {p.phc_name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSeverityFilter("");
                setStatusFilter("");
                setPhcFilter("");
              }}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Referrals Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient ID</th>
                <th className="p-3.5">PHC Center</th>
                <th className="p-3.5">Severity</th>
                <th className="p-3.5">Required Department & Test</th>
                <th className="p-3.5">Assigned Hospital</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Fetching referral records...
                  </td>
                </tr>
              ) : referrals.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No referrals match the current query criteria.
                  </td>
                </tr>
              ) : (
                referrals.map((r) => (
                  <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-mono font-bold text-blue-700">
                      <Link to={`/referrals/${r.referral_id}`} className="hover:underline">
                        {r.referral_id}
                      </Link>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-slate-800">
                      {r.patient_id}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{r.phc_name || r.phc_id}</div>
                      <div className="text-[10px] text-slate-500">{r.phc_district}</div>
                    </td>
                    <td className="p-3.5">
                      <SeverityBadge severity={r.severity} />
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-slate-900">{r.required_department}</div>
                      {r.required_test && (
                        <div className="text-[10px] text-slate-500">Test: {r.required_test}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {r.selected_hospital_name ? (
                        <div className="font-semibold text-slate-900">
                          {r.selected_hospital_name}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3.5">
                      <StatusBadge status={r.referral_status} />
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                      {r.created_date}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          to={`/referrals/${r.referral_id}`}
                          title="View Details"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Match button for medium cases pending selection */}
                        {r.severity === "MEDIUM" &&
                          (r.referral_status === "REFERRAL_CREATED" ||
                            r.referral_status === "HOSPITAL_SELECTION_PENDING") && (
                            <Link
                              to={`/matching?referral_id=${r.referral_id}`}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] transition"
                            >
                              Match
                            </Link>
                          )}

                        {/* Select hospital button if matched */}
                        {r.severity === "MEDIUM" &&
                          r.referral_status === "HOSPITAL_SELECTION_PENDING" && (
                            <Link
                              to={`/selection/${r.referral_id}`}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] transition"
                            >
                              Select
                            </Link>
                          )}

                        {/* Book appointment button if hospital selected */}
                        {r.severity === "MEDIUM" &&
                          r.referral_status === "HOSPITAL_SELECTED" &&
                          r.selected_hospital_id && (
                            <Link
                              to={`/appointments/book?referral_id=${r.referral_id}&hospital_id=${r.selected_hospital_id}`}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition flex items-center gap-1"
                            >
                              <CalendarCheck className="w-3.5 h-3.5" /> Book
                            </Link>
                          )}

                        {/* Emergency transfer button */}
                        {r.severity === "EMERGENCY" &&
                          r.referral_status !== "EMERGENCY_TRANSFER" &&
                          r.referral_status !== "COMPLETED" && (
                            <Link
                              to={`/emergency/${r.referral_id}`}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-bold text-[11px] transition flex items-center gap-1"
                            >
                              <Ambulance className="w-3.5 h-3.5" /> Dispatch
                            </Link>
                          )}
                      </div>
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
