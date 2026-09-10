import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CalendarCheck,
  Search,
  RefreshCw,
  Eye,
  FileText,
  Calendar,
  Clock,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import api from "../../services/api";
import { Referral } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const HospitalFollowupsPage: React.FC = () => {
  const { hospitalId = "H001" } = useParams<{ hospitalId: string }>();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Find clinical cares with follow_up_required
  const followUpCases = referrals.filter(
    (r) =>
      r.referral_status === "FOLLOW_UP" ||
      r.clinical_cares?.some((c) => c.follow_up_required)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
              FOLLOW-UP REGISTRY
            </span>
            <span className="text-slate-400 text-xs font-mono">Hospital: {hospitalId}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Scheduled Patient Follow-ups ({followUpCases.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registry of patients flagged for secondary review, diagnostic re-testing, and chronic care monitoring.
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

      {/* Follow-up Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Referral ID</th>
                <th className="p-3.5">Patient</th>
                <th className="p-3.5">Origin PHC</th>
                <th className="p-3.5">Follow-up Date</th>
                <th className="p-3.5">Specialist Notes</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-teal-600" />
                    Loading follow-up cases...
                  </td>
                </tr>
              ) : followUpCases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No follow-up consultations currently scheduled.
                  </td>
                </tr>
              ) : (
                followUpCases.map((r) => {
                  const latestCare = r.clinical_cares?.[r.clinical_cares.length - 1];

                  return (
                    <tr key={r.referral_id} className="hover:bg-slate-50 transition">
                      <td className="p-3.5 font-mono font-bold text-indigo-700">
                        <Link to={`/hospital/${hospitalId}/referral/${r.referral_id}`} className="hover:underline">
                          {r.referral_id}
                        </Link>
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 font-mono">
                        {r.patient_id}
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-slate-800">{r.phc_name || r.phc_id}</div>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-amber-700">
                        {latestCare?.follow_up_date || "2026-10-15"}
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <p className="line-clamp-2 text-slate-700">
                          {latestCare?.follow_up_notes || latestCare?.diagnosis || "Review progress with diagnostic results."}
                        </p>
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.referral_status} />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          to={`/hospital/${hospitalId}/referral/${r.referral_id}`}
                          className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1"
                        >
                          <Stethoscope className="w-3 h-3" /> Update Care
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HospitalFollowupsPage;
