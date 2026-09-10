import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  HeartPulse,
  Search,
  Filter,
  RefreshCw,
  Phone,
  AlertTriangle,
  Building,
  User,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { PHC, Referral } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const PHCReferralsPage: React.FC = () => {
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [selectedPhcId, setSelectedPhcId] = useState<string>("PHC001");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("");
  const [contactModal, setContactModal] = useState<Referral | null>(null);

  const loadReferrals = async (phcId: string) => {
    try {
      setLoading(true);
      const [phcList, refList] = await Promise.all([
        api.getPHCs(),
        api.getPHCReferrals(phcId, {
          status: selectedStatus || undefined,
          severity: selectedSeverity || undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setPhcs(phcList);
      setReferrals(refList);
    } catch (e) {
      console.error("Failed to load referrals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferrals(selectedPhcId);
  }, [selectedPhcId, selectedStatus, selectedSeverity]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadReferrals(selectedPhcId);
  };

  const currentPhc = phcs.find((p) => p.phc_id === selectedPhcId) || {
    phc_id: "PHC001",
    phc_name: "Karaswada Primary Health Centre",
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
            <HeartPulse className="w-4 h-4" />
            PHC Case Management
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            My Referrals Tracker ({currentPhc.phc_name})
          </h1>
          <p className="text-xs text-slate-500">
            Real-time status updates from Higher Hospitals (Accepted, Visited, In Treatment, Completed, No-Show)
          </p>
        </div>

        {/* PHC Selector */}
        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Building className="w-4 h-4 text-slate-500" />
          <span className="text-xs text-slate-600 font-medium">PHC:</span>
          <select
            value={selectedPhcId}
            onChange={(e) => setSelectedPhcId(e.target.value)}
            aria-label="Filter by PHC Facility"
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {phcs.map((p) => (
              <option key={p.phc_id} value={p.phc_id}>
                {p.phc_id} - {p.phc_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search Patient ID, Referral ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 font-medium"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            aria-label="Filter by Severity"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Severities</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="EMERGENCY">EMERGENCY</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            aria-label="Filter by Referral Status"
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
            <option value="REFERRAL_ACCEPTED">Referral Accepted</option>
            <option value="PATIENT_ATTENDED">Patient Attended</option>
            <option value="NOT_ATTENDED">Not Attended (No Show)</option>
            <option value="UNDER_TREATMENT">Under Treatment</option>
            <option value="FOLLOW_UP">Follow Up</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <button
            onClick={() => loadReferrals(selectedPhcId)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Referrals Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            Loading referral records...
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No referral records matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Referral ID</th>
                  <th className="py-3.5 px-4">Department & Test</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Higher Hospital & Slot</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => {
                  const isMissed = r.referral_status === "NOT_ATTENDED" || r.referral_status === "PHC_NOTIFIED";
                  return (
                    <tr
                      key={r.referral_id}
                      className={`hover:bg-slate-50/90 transition ${
                        isMissed ? "bg-rose-50/60" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{r.patient_id}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {r.referral_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{r.required_department}</div>
                        {r.required_test && (
                          <div className="text-[10px] text-slate-500">Test: {r.required_test}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <SeverityBadge severity={r.severity} size="sm" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">
                          {r.selected_hospital_name || r.selected_hospital_id || "Awaiting Selection"}
                        </div>
                        {r.appointment_details ? (
                          <div className="text-[10px] text-emerald-700 font-mono flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {r.appointment_details.date} • {r.appointment_details.start_time}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">No slot linked</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={r.referral_status} size="sm" />
                        {isMissed && (
                          <div className="text-[10px] font-bold text-rose-700 mt-1 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Patient did not attend appointment.
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {isMissed ? (
                          <button
                            onClick={() => setContactModal(r)}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow cursor-pointer transition"
                          >
                            Contact
                          </button>
                        ) : null}
                        <Link
                          to={`/referrals/${r.referral_id}`}
                          className="font-bold text-blue-600 hover:text-blue-800 text-[11px] hover:underline"
                        >
                          Dossier →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Patient Outreach Modal */}
      {contactModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Phone className="w-5 h-5 text-emerald-600" />
                Contact Patient for Missed Appointment
              </h3>
              <button
                onClick={() => setContactModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
              <div><strong>Patient ID:</strong> {contactModal.patient_id}</div>
              <div><strong>Referral ID:</strong> {contactModal.referral_id}</div>
              <div><strong>Hospital:</strong> {contactModal.selected_hospital_name || contactModal.selected_hospital_id}</div>
              <div className="text-rose-600 font-semibold mt-2">
                Status: Patient did not attend appointment.
              </div>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <label className="font-semibold block text-slate-700">Follow-up Notes / Reason for Absence:</label>
              <textarea
                placeholder="e.g. Patient had transport difficulties. Assisted with 108 ambulance coordination and rescheduling..."
                rows={3}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-xs"
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setContactModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  alert("PHC follow-up logged successfully.");
                  setContactModal(null);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow"
              >
                Save Outreach
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
