import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Send,
  Building,
  Activity,
  Code,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  UserX,
  FileCode,
} from "lucide-react";
import api from "../services/api";
import { PHC, Referral } from "../types";

export const IntegrationSimulatorPage: React.FC = () => {
  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  // Member 1 Simulation State
  const [m1PatientId, setM1PatientId] = useState<string>("PAT005");
  const [m1PhcId, setM1PhcId] = useState<string>("PHC001");
  const [m1Severity, setM1Severity] = useState<"MEDIUM" | "EMERGENCY">("MEDIUM");
  const [m1Dept, setM1Dept] = useState<string>("Cardiology");
  const [m1Test, setM1Test] = useState<string>("ECG");
  const [m1Reason, setM1Reason] = useState<string>("Patient reports exertional breathlessness and chest tightness.");
  const [m1Response, setM1Response] = useState<any>(null);
  const [m1Loading, setM1Loading] = useState(false);

  // Member 3 Simulation State
  const [m3ReferralId, setM3ReferralId] = useState<string>("");
  const [m3Status, setM3Status] = useState<any>("PATIENT_ATTENDED");
  const [m3Notes, setM3Notes] = useState<string>("Patient examined at OPD. Diagnostic tests conducted.");
  const [m3Response, setM3Response] = useState<any>(null);
  const [m3Loading, setM3Loading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [phcList, refList] = await Promise.all([api.getPHCs(), api.getReferrals()]);
        setPhcs(phcList);
        setReferrals(refList);
        if (refList.length > 0) {
          setM3ReferralId(refList[0].referral_id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadData();
  }, []);

  // Run Member 1 Simulation
  const handleSimulateMember1 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setM1Loading(true);
      const res = await api.createReferral({
        patient_id: m1PatientId,
        phc_id: m1PhcId,
        severity: m1Severity,
        required_department: m1Dept,
        required_test: m1Test || undefined,
        reason: m1Reason,
      });
      setM1Response(res);
      // Refresh referrals list
      const refList = await api.getReferrals();
      setReferrals(refList);
      setM3ReferralId(res.referral_id);
    } catch (err: any) {
      setM1Response(err.response?.data || { error: err.message });
    } finally {
      setM1Loading(false);
    }
  };

  // Run Member 3 Simulation
  const handleSimulateMember3 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3ReferralId) return;
    try {
      setM3Loading(true);
      const res = await api.updateHospitalStatus(m3ReferralId, m3Status, m3Notes);
      setM3Response(res);
      const refList = await api.getReferrals();
      setReferrals(refList);
    } catch (err: any) {
      setM3Response(err.response?.data || { error: err.message });
    } finally {
      setM3Loading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded w-fit mb-2 border border-amber-200">
            <GitBranch className="w-3.5 h-3.5" /> SIH Interoperability Sandbox & Testbed
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Member 1 & Member 3 Integration Simulator
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Test and verify REST API integration contracts for PHC referral dispatch and Higher Hospital status webhooks.
          </p>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          <ExternalLink className="w-4 h-4 text-emerald-400" /> Interactive OpenAPI Swagger Docs
        </a>
      </div>

      {/* Integration Workflow Diagram Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-300">
          Architecture & Boundary Separation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-400">MEMBER 1: PHC Portal</span>
              <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded">Upstream</span>
            </div>
            <p className="text-slate-300 text-[11px] font-sans">
              PHC worker logs in, inputs vitals, doctor decides severity. Dispatches referral to Central Platform via:
            </p>
            <div className="bg-slate-950 p-2 rounded text-emerald-400 text-[11px]">
              POST /api/v1/referrals
            </div>
          </div>

          <div className="p-4 bg-blue-950/80 rounded-xl border border-blue-600 space-y-2 ring-2 ring-blue-500/50">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-300">MEMBER 2: Central Platform</span>
              <span className="text-[10px] bg-blue-900 text-blue-200 px-2 py-0.5 rounded">Current Hub</span>
            </div>
            <p className="text-slate-200 text-[11px] font-sans">
              Matches nearby higher hospitals, calculates Haversine scores, records patient preference, reserves doctor slots, manages ER triage.
            </p>
            <div className="bg-slate-950 p-2 rounded text-cyan-300 text-[11px]">
              POST /api/v1/matching/medium
            </div>
          </div>

          <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400">MEMBER 3: Higher Hospital</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded">Downstream</span>
            </div>
            <p className="text-slate-300 text-[11px] font-sans">
              Receives referral dossier, fetches patient PHC history, conducts treatment, sends status callbacks:
            </p>
            <div className="bg-slate-950 p-2 rounded text-emerald-400 text-[11px]">
              PATCH /api/v1/referrals/:id/hospital-status
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Forms Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MEMBER 1 SIMULATOR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-sky-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Simulate Member 1: Send Referral from PHC
              </h3>
            </div>
            <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
              POST /api/v1/referrals
            </span>
          </div>

          <form onSubmit={handleSimulateMember1} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Patient ID:</label>
                <input
                  type="text"
                  value={m1PatientId}
                  onChange={(e) => setM1PatientId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Originating PHC:</label>
                <select
                  value={m1PhcId}
                  onChange={(e) => setM1PhcId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {phcs.map((p) => (
                    <option key={p.phc_id} value={p.phc_id}>
                      {p.phc_name} ({p.phc_id})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Severity Classification:</label>
                <select
                  value={m1Severity}
                  onChange={(e) => setM1Severity(e.target.value as any)}
                  className={`w-full p-2 rounded-lg font-bold border ${
                    m1Severity === "EMERGENCY" ? "bg-red-50 text-red-700 border-red-300" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Required Department:</label>
                <select
                  value={m1Dept}
                  onChange={(e) => setM1Dept(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Required Test (Optional):</label>
                <input
                  type="text"
                  value={m1Test}
                  onChange={(e) => setM1Test(e.target.value)}
                  placeholder="e.g. ECG, X-Ray, CT Scan"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Clinical Reason:</label>
                <input
                  type="text"
                  value={m1Reason}
                  onChange={(e) => setM1Reason(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={m1Loading}
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {m1Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Referral Payload from Member 1
            </button>
          </form>

          {/* Response payload viewer */}
          {m1Response && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">API Response Payload:</span>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                {JSON.stringify(m1Response, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* MEMBER 3 SIMULATOR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">
                Simulate Member 3: Higher Hospital Status Callback
              </h3>
            </div>
            <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              PATCH /api/v1/referrals/:id/hospital-status
            </span>
          </div>

          <form onSubmit={handleSimulateMember3} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Target Referral:</label>
              <select
                value={m3ReferralId}
                onChange={(e) => setM3ReferralId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium"
              >
                {referrals.map((r) => (
                  <option key={r.referral_id} value={r.referral_id}>
                    {r.referral_id} - Patient {r.patient_id} ({r.referral_status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">
                Clinical Event / Attendance Status:
              </label>
              <select
                value={m3Status}
                onChange={(e) => setM3Status(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
              >
                <option value="PATIENT_ATTENDED">PATIENT_ATTENDED (Patient checked in at hospital)</option>
                <option value="NOT_ATTENDED">NOT_ATTENDED (No-show! Will trigger PHC alert)</option>
                <option value="UNDER_TREATMENT">UNDER_TREATMENT (Consultation / tests in progress)</option>
                <option value="FOLLOW_UP">FOLLOW_UP (Follow-up consultation required)</option>
                <option value="COMPLETED">COMPLETED (Treatment finished / patient discharged)</option>
                <option value="CASE_CLOSED">CASE_CLOSED (Case formally closed)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Doctor / Hospital Note:</label>
              <textarea
                rows={2}
                value={m3Notes}
                onChange={(e) => setM3Notes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={m3Loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {m3Loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Status Callback from Member 3
            </button>
          </form>

          {/* Response payload viewer */}
          {m3Response && (
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">API Response Payload:</span>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48">
                {JSON.stringify(m3Response, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
