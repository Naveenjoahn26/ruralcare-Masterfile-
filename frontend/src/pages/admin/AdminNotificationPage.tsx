import React, { useState, useEffect } from "react";
import {
  Bell,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  RefreshCw,
  Phone,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  X,
  FileText,
} from "lucide-react";
import api from "../../services/api";
import { NotificationItem, PHC, NotificationHealth, TestEmailResponse } from "../../types";

export const AdminNotificationPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [phcs, setPHCs] = useState<PHC[]>([]);
  const [health, setHealth] = useState<NotificationHealth | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedChannel, setSelectedChannel] = useState("ALL");
  const [selectedEvent, setSelectedEvent] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Selected Notification for Detail Modal
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Direct SMTP Test Email state
  const [directRecipient, setDirectRecipient] = useState("priya.devi@example.com");
  const [sendingDirectTest, setSendingDirectTest] = useState(false);
  const [directTestResult, setDirectTestResult] = useState<TestEmailResponse | null>(null);

  // Test Dispatch Form state
  const [testForm, setTestForm] = useState({
    phc_id: "PHC001",
    referral_id: "REF001",
    patient_id: "P1001",
    channel: "EMAIL",
    event_type: "APPOINTMENT_CONFIRMED",
    recipient: "priya.devi@example.com",
    message: "RURALCARE — Appointment Confirmed\n\nDear Priya Devi,\n\nYour appointment has been confirmed at District Hospital.",
    severity: "MEDIUM",
  });
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccessMessage, setTestSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifsData, phcsData, healthData] = await Promise.all([
        api.getNotifications({ limit: 100 }),
        api.getPHCs(),
        api.getNotificationHealth().catch(() => null),
      ]);
      setNotifications(notifsData);
      setPHCs(phcsData);
      if (healthData) setHealth(healthData);
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSendDirectTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingDirectTest(true);
      setDirectTestResult(null);
      const res = await api.sendTestEmail(directRecipient);
      setDirectTestResult(res);
      loadData();
    } catch (err: any) {
      setDirectTestResult({
        success: false,
        mode: health?.mode.toLowerCase() || "error",
        recipient: directRecipient,
        message: err.message || "Failed to trigger test email",
      });
    } finally {
      setSendingDirectTest(false);
    }
  };


  const handleSendTestNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSendingTest(true);
      setTestSuccessMessage(null);
      await api.sendNotification({
        phc_id: testForm.phc_id,
        referral_id: testForm.referral_id,
        patient_id: testForm.patient_id,
        channel: testForm.channel,
        event_type: testForm.event_type,
        recipient: testForm.recipient,
        message: testForm.message,
        severity: testForm.severity,
      });
      setTestSuccessMessage(`Notification successfully dispatched via ${testForm.channel}!`);
      loadData();
    } catch (err: any) {
      alert("Failed to send test notification: " + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  // Filtered notifications
  const filteredNotifications = notifications.filter((n) => {
    if (selectedChannel !== "ALL" && (n.channel || "EMAIL").toUpperCase() !== selectedChannel.toUpperCase()) return false;
    if (selectedEvent !== "ALL" && (n.event_type || "").toUpperCase() !== selectedEvent.toUpperCase()) return false;
    if (selectedStatus !== "ALL" && (n.status || "SENT").toUpperCase() !== selectedStatus.toUpperCase()) return false;
    return true;
  });

  const totalCount = notifications.length;
  const sentCount = notifications.filter((n) => (n.status || "SENT").toUpperCase() === "SENT").length;
  const failedCount = notifications.filter((n) => (n.status || "").toUpperCase() === "FAILED").length;
  const emailCount = notifications.filter((n) => (n.channel || "").toUpperCase() === "EMAIL").length;
  const smsCount = notifications.filter((n) => (n.channel || "").toUpperCase() === "SMS").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
                AUDIT & DISPATCH LOG
              </span>
              <span className="text-slate-400 text-xs font-mono">
                SIH26133 Patient & Provider Notification Center
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Patient Notification & Alert Audit Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Channel-specific delivery records for patient appointment confirmations, hospital triage updates, follow-up reminders, and emergency transfers.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Logs
          </button>
        </div>

        {/* Channels & Delivery Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase">Total Notifications</span>
              <Bell className="w-4 h-4 text-slate-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all channels</div>
          </div>

          <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 uppercase">Successfully Sent</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {sentCount}
            </div>
            <div className="text-[11px] text-emerald-600/70 mt-0.5">Status: SENT</div>
          </div>

          <div className="bg-rose-50/60 p-4 rounded-xl border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-700 uppercase">Delivery Failures</span>
              <XCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">
              {failedCount}
            </div>
            <div className="text-[11px] text-rose-600/70 mt-0.5">Missing/invalid contact</div>
          </div>

          <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-700 uppercase">Working Provider</span>
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-700 mt-1">
              EMAIL ({emailCount})
            </div>
            <div className="text-[11px] text-purple-600/70 mt-0.5">SMS Adapter ({smsCount})</div>
          </div>
        </div>
      </div>

      {/* Provider Health & Live Test Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-3 rounded-xl ${health?.configured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Direct Email Dispatch Service</h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    health?.configured
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {health?.configured ? "SMTP CONFIGURED (LIVE)" : "DEVELOPMENT SIMULATION"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {health?.configured
                  ? `Live direct SMTP dispatch active via port ${health.smtp_port} (${health.smtp_tls ? "STARTTLS" : "Plain/SSL"}). Outgoing sender: ${health.from_email}`
                  : "SMTP credentials not provided in .env. Valid emails are simulated with detailed log tracking for prototype safety."}
              </p>
            </div>
          </div>

          {/* Direct Live Test Email Tool */}
          <form onSubmit={handleSendDirectTestEmail} className="flex items-center gap-2">
            <input
              type="email"
              placeholder="recipient@example.com"
              value={directRecipient}
              onChange={(e) => setDirectRecipient(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 w-56"
            />
            <button
              type="submit"
              disabled={sendingDirectTest}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${sendingDirectTest ? "animate-pulse" : ""}`} />
              {sendingDirectTest ? "Testing..." : "Send Test Email"}
            </button>
          </form>
        </div>

        {directTestResult && (
          <div
            className={`mt-4 p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
              directTestResult.success
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {directTestResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              )}
              <span>
                <strong>Mode: [{directTestResult.mode.toUpperCase()}]</strong> - {directTestResult.message}
                {directTestResult.recipient && ` (Target: ${directTestResult.recipient})`}
              </span>
            </div>
            <button
              onClick={() => setDirectTestResult(null)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Test Dispatcher + Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Test Dispatch Simulator */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Send className="w-4 h-4 text-purple-600" />
            <h2 className="font-bold text-slate-800 text-sm">
              Notification Dispatch Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Trigger an Email or SMS notification through the NotificationService to verify provider dispatch and failure isolation.
          </p>

          {testSuccessMessage && (
            <div className="p-3 mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              {testSuccessMessage}
            </div>
          )}

          <form onSubmit={handleSendTestNotification} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-bold mb-1">Target Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestForm({ ...testForm, channel: "EMAIL" })}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                    testForm.channel === "EMAIL"
                      ? "bg-purple-50 border-purple-500 text-purple-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" /> Email (Active)
                </button>
                <button
                  type="button"
                  onClick={() => setTestForm({ ...testForm, channel: "SMS" })}
                  className={`py-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border cursor-pointer ${
                    testForm.channel === "SMS"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> SMS Adapter
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Event / Message Type</label>
              <select
                value={testForm.event_type}
                onChange={(e) => setTestForm({ ...testForm, event_type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="APPOINTMENT_CONFIRMED">APPOINTMENT_CONFIRMED (Slot Confirmed)</option>
                <option value="REFERRAL_ACCEPTED">REFERRAL_ACCEPTED (Hospital Accepted)</option>
                <option value="PATIENT_ATTENDED">PATIENT_ATTENDED (Patient In Hospital)</option>
                <option value="APPOINTMENT_NOT_ATTENDED">APPOINTMENT_NOT_ATTENDED (Missed Appointment Alert)</option>
                <option value="FOLLOW_UP_REMINDER">FOLLOW_UP_REMINDER (Follow-up Reminder)</option>
                <option value="TREATMENT_COMPLETED">TREATMENT_COMPLETED (Case Closed)</option>
                <option value="EMERGENCY_TRANSFER">EMERGENCY_TRANSFER (108 Ambulance Dispatch)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-bold mb-1">PHC Facility</label>
                <select
                  value={testForm.phc_id}
                  onChange={(e) => setTestForm({ ...testForm, phc_id: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {phcs.map((p) => (
                    <option key={p.phc_id} value={p.phc_id}>
                      {p.phc_id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-600 font-bold mb-1">Patient ID</label>
                <input
                  type="text"
                  value={testForm.patient_id}
                  onChange={(e) => setTestForm({ ...testForm, patient_id: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Recipient Email / Phone</label>
              <input
                type="text"
                value={testForm.recipient}
                onChange={(e) => setTestForm({ ...testForm, recipient: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-bold mb-1">Message Content</label>
              <textarea
                rows={3}
                value={testForm.message}
                onChange={(e) => setTestForm({ ...testForm, message: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Send className="w-3.5 h-3.5" />
              {sendingTest ? "Dispatching..." : "Dispatch Notification"}
            </button>
          </form>
        </div>

        {/* Right Column: Complete Multi-channel Log */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-700" />
              <h2 className="font-bold text-slate-800 text-sm">
                Notifications Audit Log ({filteredNotifications.length})
              </h2>
            </div>

            {/* Filter selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">SENT (Success)</option>
                <option value="FAILED">FAILED (Delivery Issue)</option>
                <option value="PENDING">PENDING</option>
              </select>

              {/* Channel Filter */}
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Channels</option>
                <option value="EMAIL">Email</option>
                <option value="SMS">SMS</option>
              </select>

              {/* Event Filter */}
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="ALL">All Event Types</option>
                <option value="APPOINTMENT_CONFIRMED">APPOINTMENT_CONFIRMED</option>
                <option value="REFERRAL_ACCEPTED">REFERRAL_ACCEPTED</option>
                <option value="PATIENT_ATTENDED">PATIENT_ATTENDED</option>
                <option value="APPOINTMENT_NOT_ATTENDED">APPOINTMENT_NOT_ATTENDED</option>
                <option value="FOLLOW_UP_REMINDER">FOLLOW_UP_REMINDER</option>
                <option value="TREATMENT_COMPLETED">TREATMENT_COMPLETED</option>
                <option value="EMERGENCY_TRANSFER">EMERGENCY_TRANSFER</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Notification ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Referral / PHC</th>
                  <th className="px-4 py-3">Type & Channel</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Sent Time</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notif) => {
                    const isEmail = (notif.channel || "EMAIL").toUpperCase() === "EMAIL";
                    const isSent = (notif.status || "SENT").toUpperCase() === "SENT";
                    const isFailed = (notif.status || "").toUpperCase() === "FAILED";

                    return (
                      <tr key={notif.notification_id} className="hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          {notif.notification_id}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {notif.patient_name || notif.patient_id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            ID: {notif.patient_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-indigo-700 font-bold">
                            {notif.referral_id}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            PHC: {notif.phc_id}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">
                            {notif.message_type || notif.event_type}
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-0.5 ${
                              isEmail
                                ? "bg-purple-100 text-purple-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            {isEmail ? <Mail className="w-2.5 h-2.5" /> : <MessageSquare className="w-2.5 h-2.5" />}
                            {notif.channel || "EMAIL"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-mono text-slate-700 max-w-[140px] truncate" title={notif.recipient || ""}>
                            {notif.recipient || "NO_EMAIL_ON_FILE"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {isSent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              SENT
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              FAILED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {notif.status || "PENDING"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono text-[10px]">
                          {notif.sent_at
                            ? new Date(notif.sent_at).toLocaleString()
                            : notif.created_at
                            ? new Date(notif.created_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedNotification(notif)}
                            className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition cursor-pointer"
                            title="View Full Message"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-slate-400">
                      No notifications found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal for Viewing Full Notification Message */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Notification Message Dossier
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">
                    ID: {selectedNotification.notification_id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedNotification(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400">Recipient:</span>
                <div className="font-bold font-mono text-slate-800 truncate">
                  {selectedNotification.recipient || "NO_EMAIL_ON_FILE"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Status & Channel:</span>
                <div className="font-bold text-slate-800">
                  {selectedNotification.status || "SENT"} • {selectedNotification.channel || "EMAIL"}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Patient:</span>
                <div className="font-bold text-slate-800">
                  {selectedNotification.patient_name || selectedNotification.patient_id} ({selectedNotification.patient_id})
                </div>
              </div>
              <div>
                <span className="text-slate-400">Referral ID:</span>
                <div className="font-bold font-mono text-slate-800">
                  {selectedNotification.referral_id}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold text-xs mb-1.5">
                Full Dispatched Message Body:
              </label>
              <pre className="p-3.5 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {selectedNotification.message}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotificationPage;
