import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Filter,
  Search,
  Building,
  Calendar,
  Eye,
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Ambulance,
  Stethoscope,
  RefreshCw,
  Share2,
} from "lucide-react";
import api from "../../services/api";
import { Referral, PHC, Hospital, ReferralEvent, ClinicalCare } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";
import { ReferralTimeline } from "../../components/ReferralTimeline";

export const AdminReferralMonitor: React.FC = () => {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [phcs, setPHCs] = useState<PHC[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedPHC, setSelectedPHC] = useState("ALL");
  const [selectedHospital, setSelectedHospital] = useState("ALL");

  // Selected Referral for slide-over dossier
  const [activeDossier, setActiveDossier] = useState<Referral | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [refsData, phcsData, hospitalsData] = await Promise.all([
        api.getReferrals(),
        api.getPHCs(),
        api.getHospitals(),
      ]);
      setReferrals(refsData);
      setPHCs(phcsData);
      setHospitals(hospitalsData);
    } catch (e) {
      console.error("Failed to load referral monitor data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openDossier = async (referralId: string) => {
    try {
      setLoadingDossier(true);
      const fullRef = await api.getReferral(referralId);
      setActiveDossier(fullRef);
    } catch (e) {
      console.error("Failed to fetch referral details", e);
    } finally {
      setLoadingDossier(false);
    }
  };

  // Filtered referrals
  const filteredReferrals = referrals.filter((ref) => {
    if (selectedSeverity !== "ALL" && ref.severity !== selectedSeverity) return false;
    if (selectedStatus !== "ALL" && ref.referral_status !== selectedStatus) return false;
    if (selectedPHC !== "ALL" && ref.phc_id !== selectedPHC) return false;
    if (selectedHospital !== "ALL" && ref.selected_hospital_id !== selectedHospital) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = ref.referral_id.toLowerCase().includes(q);
      const matchPatient = ref.patient_id.toLowerCase().includes(q);
      const matchDept = (ref.required_department || "").toLowerCase().includes(q);
      const matchPHC = (ref.phc_name || ref.phc_id).toLowerCase().includes(q);
      const matchHosp = (ref.selected_hospital_name || ref.selected_hospital_id || "").toLowerCase().includes(q);
      if (!matchId && !matchPatient && !matchDept && !matchPHC && !matchHosp) return false;
    }

    return true;
  });

  // Quick stats
  const emergencyCount = referrals.filter((r) => r.severity === "EMERGENCY").length;
  const bookedCount = referrals.filter((r) => r.referral_status === "APPOINTMENT_BOOKED").length;
  const attendedCount = referrals.filter(
    (r) =>
      r.referral_status === "PATIENT_ATTENDED" ||
      r.referral_status === "UNDER_TREATMENT" ||
      r.referral_status === "FOLLOW_UP" ||
      r.referral_status === "COMPLETED"
  ).length;
  const missedCount = referrals.filter((r) => r.referral_status === "NOT_ATTENDED").length;

  return (
    <div className="space-y-6">
      {/* Header & Quick stats */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                AUDIT & TRACKING
              </span>
              <span className="text-slate-400 text-xs font-mono">Central Journey Registry</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Network Referral Journey Monitor
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Live tracking and complete clinical dossier audit of all rural patient transitions across the state grid.
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
              to="/admin/dashboard"
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              Command Center
            </Link>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-100">
          <button
            onClick={() => {
              setSelectedSeverity("ALL");
              setSelectedStatus("ALL");
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedSeverity === "ALL" && selectedStatus === "ALL"
                ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                : "bg-slate-50/50 border-slate-200 hover:bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 uppercase">All Referrals</div>
            <div className="text-xl font-black text-slate-800 mt-0.5">{referrals.length}</div>
          </button>

          <button
            onClick={() => {
              setSelectedSeverity("EMERGENCY");
              setSelectedStatus("ALL");
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedSeverity === "EMERGENCY"
                ? "bg-red-50 border-red-300 ring-2 ring-red-500/20"
                : "bg-slate-50/50 border-slate-200 hover:bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-1">
              <Ambulance className="w-3 h-3" /> Emergency 108
            </div>
            <div className="text-xl font-black text-red-600 mt-0.5">{emergencyCount}</div>
          </button>

          <button
            onClick={() => {
              setSelectedSeverity("ALL");
              setSelectedStatus("APPOINTMENT_BOOKED");
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === "APPOINTMENT_BOOKED"
                ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20"
                : "bg-slate-50/50 border-slate-200 hover:bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-blue-500 uppercase flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Booked Slots
            </div>
            <div className="text-xl font-black text-blue-600 mt-0.5">{bookedCount}</div>
          </button>

          <button
            onClick={() => {
              setSelectedSeverity("ALL");
              setSelectedStatus("NOT_ATTENDED");
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === "NOT_ATTENDED"
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20"
                : "bg-slate-50/50 border-slate-200 hover:bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-rose-500 uppercase flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Missed Care
            </div>
            <div className="text-xl font-black text-rose-600 mt-0.5">{missedCount}</div>
          </button>

          <button
            onClick={() => {
              setSelectedSeverity("ALL");
              setSelectedStatus("COMPLETED");
            }}
            className={`p-3 rounded-xl border text-left transition cursor-pointer ${
              selectedStatus === "COMPLETED"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20"
                : "bg-slate-50/50 border-slate-200 hover:bg-white"
            }`}
          >
            <div className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </div>
            <div className="text-xl font-black text-emerald-600 mt-0.5">{attendedCount}</div>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID, patient, dept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          {/* Severity */}
          <div>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">All Severities</option>
              <option value="NORMAL">Normal (Local)</option>
              <option value="MEDIUM">Medium (Specialist)</option>
              <option value="EMERGENCY">Emergency (108)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPOINTMENT_BOOKED">Appointment Booked</option>
              <option value="REFERRAL_ACCEPTED">Referral Accepted</option>
              <option value="PATIENT_ATTENDED">Patient Attended</option>
              <option value="UNDER_TREATMENT">Under Treatment</option>
              <option value="FOLLOW_UP">Follow Up</option>
              <option value="NOT_ATTENDED">Not Attended (Missed)</option>
              <option value="EMERGENCY_TRANSFER">Emergency Transfer</option>
              <option value="COMPLETED">Completed</option>
              <option value="CASE_CLOSED">Case Closed</option>
            </select>
          </div>

          {/* PHC Filter */}
          <div>
            <select
              value={selectedPHC}
              onChange={(e) => setSelectedPHC(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">All Origin PHCs</option>
              {phcs.map((p) => (
                <option key={p.phc_id} value={p.phc_id}>
                  {p.phc_name} ({p.phc_id})
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Filter */}
          <div>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            >
              <option value="ALL">All Target Hospitals</option>
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.hospital_name} ({h.hospital_id})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Referrals Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Referral ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Origin PHC</th>
                <th className="px-4 py-3">Target Hospital</th>
                <th className="px-4 py-3">Required Care</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Current Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.length > 0 ? (
                filteredReferrals.map((ref) => (
                  <tr
                    key={ref.referral_id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => openDossier(ref.referral_id)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-blue-700">
                      {ref.referral_id}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      {ref.patient_id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {ref.phc_name || ref.phc_id}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {ref.phc_id}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {ref.selected_hospital_name ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {ref.selected_hospital_name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {ref.selected_hospital_id}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">
                        {ref.required_department}
                      </div>
                      {ref.required_test && (
                        <div className="text-[10px] text-slate-400">
                          Test: {ref.required_test}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SeverityBadge severity={ref.severity} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ref.referral_status} />
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">
                      {new Date(ref.created_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openDossier(ref.referral_id)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded transition cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Dossier
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No referrals match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Patient Clinical Dossier Drawer */}
      {activeDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
            {/* Dossier Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white sticky top-0 z-10 flex items-center justify-between border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30">
                    {activeDossier.referral_id}
                  </span>
                  <SeverityBadge severity={activeDossier.severity} />
                </div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Patient Clinical Dossier • {activeDossier.patient_id}
                </h2>
              </div>
              <button
                onClick={() => setActiveDossier(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="p-6 space-y-6 flex-1">
              {/* Route Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Origin PHC Facility
                  </span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {activeDossier.phc_name || activeDossier.phc_id}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    ID: {activeDossier.phc_id}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">
                    Target Hospital Facility
                  </span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {activeDossier.selected_hospital_name || (
                      <span className="text-slate-400 italic">Not Selected</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {activeDossier.selected_hospital_id
                      ? `ID: ${activeDossier.selected_hospital_id}`
                      : ""}
                  </div>
                </div>

                <div className="col-span-2 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      Speciality Required
                    </span>
                    <div className="font-bold text-slate-800">
                      {activeDossier.required_department}
                      {activeDossier.required_test ? ` • Test: ${activeDossier.required_test}` : ""}
                    </div>
                  </div>
                  <div>
                    <StatusBadge status={activeDossier.referral_status} />
                  </div>
                </div>
              </div>

              {/* Reason / Notes */}
              {activeDossier.reason && (
                <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-800 uppercase mb-1">
                    PHC Clinical Reason / Chief Complaints
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {activeDossier.reason}
                  </p>
                </div>
              )}

              {/* Hospital Specialist Clinical Care Records */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Higher Hospital Clinical Care Notes
                  </h3>
                </div>

                {activeDossier.clinical_cares && activeDossier.clinical_cares.length > 0 ? (
                  <div className="space-y-3">
                    {activeDossier.clinical_cares.map((care, idx) => (
                      <div
                        key={care.care_id || idx}
                        className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 text-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-900">
                            Dr. {care.doctor_name || "Specialist On Duty"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(care.created_at).toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400">
                            Specialist Diagnosis
                          </div>
                          <p className="text-slate-800 font-medium">{care.diagnosis}</p>
                        </div>

                        {care.test_results && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              Diagnostic Test Results
                            </div>
                            <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 mt-0.5">
                              {care.test_results}
                            </p>
                          </div>
                        )}

                        {care.prescriptions && (
                          <div>
                            <div className="text-[10px] uppercase font-bold text-slate-400">
                              Prescribed Medications
                            </div>
                            <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 mt-0.5">
                              {care.prescriptions}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-blue-200/60">
                          <span className="text-[11px] font-bold text-slate-600">
                            Outcome Status: <strong className="text-blue-700">{care.outcome_status}</strong>
                          </span>
                          {care.follow_up_date && (
                            <span className="text-[11px] text-amber-700 font-medium">
                              Follow-up: {care.follow_up_date}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-400">
                    No specialist clinical care notes recorded yet. Pending hospital consultation.
                  </div>
                )}
              </div>

              {/* Referral Events Timeline */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    Complete State Transition Audit Trail
                  </h3>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <ReferralTimeline events={activeDossier.events || []} />
                </div>
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Link
                to={`/referrals/${activeDossier.referral_id}`}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Open Full Dedicated Page &rarr;
              </Link>
              <button
                onClick={() => setActiveDossier(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReferralMonitor;
