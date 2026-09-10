import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Mail,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { NotificationItem } from "../../types";

export const PHCNotificationsPage: React.FC = () => {
  const { phcId } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifs = async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications({ phc_id: phcId, limit: 100 });
      setNotifications(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifs();
  }, [phcId]);

  const markRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold">
              PHC ALERTS & BROADCASTS
            </span>
            <span className="text-slate-400 text-xs font-mono">Facility: {phcId}</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Notifications & Outreach Alerts ({notifications.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time notifications dispatched by higher hospitals, missed appointment notices, and booking receipts.
          </p>
        </div>

        <button
          onClick={loadNotifs}
          disabled={loading}
          className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications recorded for this facility.
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.notification_id}
              className={`p-4 hover:bg-slate-50 transition flex items-start justify-between gap-4 ${
                !n.is_read ? "bg-purple-50/20" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    n.event_type === "PATIENT_NOT_ATTENDED"
                      ? "bg-amber-100 text-amber-700"
                      : n.event_type === "EMERGENCY_TRANSFER"
                      ? "bg-red-100 text-red-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  <Bell className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{n.event_type}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Ref: {n.referral_id} • Patient: {n.patient_id}
                    </span>
                    {!n.is_read && (
                      <span className="px-1.5 py-0.2 rounded-full bg-purple-500 text-white text-[9px] font-bold">
                        NEW
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{n.message}</p>

                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                    <span>Channel: {n.channel || "SMS"}</span>
                    <span>•</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => markRead(n.notification_id)}
                  title="Mark as read"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PHCNotificationsPage;
