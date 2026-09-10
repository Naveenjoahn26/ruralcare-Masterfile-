import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  UserCheck,
  Building2,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  CalendarCheck,
  Printer,
  RefreshCw,
  FileCheck,
  User,
  Mail,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { Referral, Hospital, Doctor, AppointmentSlot } from "../../types";
import { StatusBadge } from "../../components/StatusBadge";
import { SeverityBadge } from "../../components/SeverityBadge";

export const PHCAppointmentBookingPage: React.FC = () => {
  const { referralId: paramReferralId } = useParams<{ referralId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { phcId } = useAuth();

  const queryHospitalId = searchParams.get("hospital_id") || "";
  const queryReferralId = searchParams.get("referral_id") || "";

  const effectiveReferralId = paramReferralId || queryReferralId;

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [selectedReferralId, setSelectedReferralId] = useState<string>(effectiveReferralId);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(queryHospitalId);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("2026-09-07");

  const [referral, setReferral] = useState<Referral | null>(null);
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Referral | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load referrals list for PHC if referralId is not set
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const data = await api.getPHCReferrals(phcId);
        setReferrals(data);

        // Auto-select first referral needing booking if not already selected
        if (!selectedReferralId) {
          const eligible = data.find(
            (r) =>
              r.severity === "MEDIUM" &&
              ["REFERRAL_CREATED", "HOSPITAL_SELECTION_PENDING", "HOSPITAL_SELECTED"].includes(
                r.referral_status
              )
          ) || data[0];
          if (eligible) {
            setSelectedReferralId(eligible.referral_id);
            if (eligible.selected_hospital_id && !selectedHospitalId) {
              setSelectedHospitalId(eligible.selected_hospital_id);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    loadRefs();
  }, [phcId, selectedReferralId]);

  // Load selected referral details
  useEffect(() => {
    if (!selectedReferralId) return;
    const fetchRef = async () => {
      try {
        const data = await api.getReferral(selectedReferralId);
        setReferral(data);
        if (data.selected_hospital_id && !queryHospitalId) {
          setSelectedHospitalId(data.selected_hospital_id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchRef();
  }, [selectedReferralId, queryHospitalId]);

  // Load hospital & slots
  useEffect(() => {
    if (!selectedHospitalId) return;
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedSlotId(""); // Reset slot selection when hospital/doctor/date changes
        const [hospData, slotList] = await Promise.all([
          api.getHospital(selectedHospitalId),
          api.getHospitalSlots(selectedHospitalId, {
            doctor_id: selectedDoctorId || undefined,
            date: selectedDate || undefined,
            status: "", // Retrieve all to show booked vs available
          }),
        ]);
        setHospital(hospData);
        setSlots(slotList);
      } catch (err: any) {
        console.error(err);
        setError("Failed to retrieve hospital slots.");
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [selectedHospitalId, selectedDoctorId, selectedDate]);

  const handleBook = async () => {
    if (!selectedReferralId || !selectedHospitalId || !selectedSlotId) {
      setError("Please select a referral, receiving hospital, and an available slot.");
      return;
    }

    try {
      setBookingLoading(true);
      setError(null);
      const updatedRef = await api.bookAppointment({
        referral_id: selectedReferralId,
        hospital_id: selectedHospitalId,
        slot_id: selectedSlotId,
      });

      setBookingSuccess(updatedRef);
      setReferral(updatedRef);

      // Refresh slots
      const refreshedSlots = await api.getHospitalSlots(selectedHospitalId, {
        doctor_id: selectedDoctorId || undefined,
        date: selectedDate || undefined,
        status: "",
      });
      setSlots(refreshedSlots);
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail ||
          "Failed to book slot. It may have already been reserved. Please select another slot."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSlot = slots.find((s) => s.slot_id === selectedSlotId);
  const isEnabled = !!selectedSlotId && !!selectedReferralId && !bookingLoading;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          to={paramReferralId ? `/phc/referral/${paramReferralId}` : "/phc/dashboard"}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Referral Dossier
        </Link>
        <span className="text-xs font-mono text-slate-500">
          Step 3 of 3: Direct Appointment Slot Reservation
        </span>
      </div>

      {/* Booking Confirmation Receipt (Section 7) */}
      {bookingSuccess && (
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-xl space-y-4 print:shadow-none print:border print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                  Appointment Confirmed Successfully!
                </h2>
                <p className="text-xs text-emerald-100">
                  Referral ID: <strong className="font-mono">{bookingSuccess.referral_id}</strong> • Status: <strong>APPOINTMENT_BOOKED</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 bg-white text-emerald-900 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Referral Slip
              </button>
              <Link
                to={`/phc/referral/${bookingSuccess.referral_id}`}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                View Dossier
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-emerald-700/50 p-4 rounded-xl">
            <div>
              <span className="text-emerald-200">Patient ID:</span>
              <div className="font-bold text-white text-sm font-mono">{bookingSuccess.patient_id}</div>
            </div>
            <div>
              <span className="text-emerald-200">Hospital:</span>
              <div className="font-bold text-white text-sm">{bookingSuccess.selected_hospital_name}</div>
            </div>
            <div>
              <span className="text-emerald-200">Doctor / Specialist:</span>
              <div className="font-bold text-white text-sm">
                {bookingSuccess.appointment_details?.doctor_name || selectedSlot?.doctor_name || "Specialist On Duty"}
              </div>
            </div>
            <div>
              <span className="text-emerald-200">Date & Time Window:</span>
              <div className="font-bold text-white text-sm font-mono">
                {bookingSuccess.appointment_details
                  ? `${bookingSuccess.appointment_details.date} (${bookingSuccess.appointment_details.start_time} - ${bookingSuccess.appointment_details.end_time})`
                  : `${selectedDate} (${selectedSlot?.start_time} - ${selectedSlot?.end_time})`}
              </div>
            </div>
          </div>

          {/* Patient Notification Delivery Status (SIH Requirement 6 & 10) */}
          <div className="pt-3 border-t border-emerald-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {bookingSuccess.notification_status === "SENT" || bookingSuccess.notification_sent ? (
              <div className="flex items-center gap-2 text-emerald-100 bg-emerald-700/60 px-3 py-2 rounded-xl">
                <Mail className="w-4 h-4 text-white shrink-0" />
                <span>
                  <strong>Patient notification sent</strong> via Email to{" "}
                  <span className="font-mono underline text-white">
                    {bookingSuccess.notification_recipient || "patient's registered email"}
                  </span>
                  .
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-100 bg-amber-900/60 border border-amber-500/40 px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span>
                  <strong>Appointment confirmed, but patient notification could not be sent.</strong>{" "}
                  {bookingSuccess.notification_recipient === "NO_EMAIL_ON_FILE" || !bookingSuccess.notification_recipient ? (
                    <span className="text-amber-200">(No valid email address on file for patient)</span>
                  ) : (
                    <span className="text-amber-200 font-mono">({bookingSuccess.notification_recipient})</span>
                  )}
                </span>
              </div>
            )}
            <span className="text-[11px] text-emerald-200 font-mono">
              Channel: <strong>EMAIL</strong> (SIH Prototype)
            </span>
          </div>
        </div>
      )}

      {/* Referral & Hospital Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Referral Picker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Select Patient Referral:
            </label>
            <select
              value={selectedReferralId}
              onChange={(e) => setSelectedReferralId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">-- Choose Referral --</option>
              {referrals.map((r) => (
                <option key={r.referral_id} value={r.referral_id}>
                  {r.referral_id} • Patient: {r.patient_id} ({r.required_department})
                </option>
              ))}
            </select>
          </div>

          {/* Receiving Hospital */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Receiving Hospital:
            </label>
            <input
              type="text"
              readOnly
              value={hospital?.hospital_name || selectedHospitalId || "Awaiting Selection"}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-800 cursor-not-allowed"
            />
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Specialist Doctor:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            >
              <option value="">All Available Specialists</option>
              {hospital?.doctors?.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Appointment Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Slots Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              Available Time Slots at {hospital?.hospital_name || "Hospital"} ({slots.length} Total)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click a green slot to select. Gray slots are booked and unavailable.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded bg-emerald-500"></span> Available
            </span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3 h-3 rounded bg-slate-300"></span> Booked
            </span>
          </div>
        </div>

        {/* Slot Buttons Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading hospital appointment slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No appointment slots scheduled for this doctor/date. Please choose another date or doctor.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {slots.map((s) => {
              const isAvailable = s.status === "AVAILABLE";
              const isSelected = selectedSlotId === s.slot_id;

              return (
                <button
                  key={s.slot_id}
                  disabled={!isAvailable || bookingLoading}
                  onClick={() => setSelectedSlotId(s.slot_id)}
                  type="button"
                  className={`p-3 rounded-xl border text-left transition-all duration-150 relative cursor-pointer ${
                    !isAvailable
                      ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "bg-emerald-600 border-emerald-700 text-white shadow-md ring-2 ring-emerald-300 scale-[1.02]"
                      : "bg-emerald-50/50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <div className="font-mono font-bold text-sm">
                    {s.start_time} - {s.end_time}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-1 ${
                      isSelected ? "text-emerald-100" : isAvailable ? "text-emerald-800 font-medium" : "text-slate-400"
                    }`}
                  >
                    {s.doctor_name || "Specialist"}
                  </div>
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                      isSelected ? "text-emerald-200" : isAvailable ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {s.status}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            {selectedSlotId ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Selected Slot: <strong className="font-mono text-slate-900">{selectedSlotId}</strong>
                  {selectedSlot && (
                    <span className="ml-1 text-slate-500">
                      ({selectedSlot.start_time} - {selectedSlot.end_time}, Dr. {selectedSlot.doctor_name || "Specialist"})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">No slot selected yet. Click an available slot above.</span>
            )}
          </div>

          <button
            onClick={handleBook}
            disabled={!isEnabled}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl shadow-md transition cursor-pointer ${
              isEnabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {bookingLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Reserving Slot...
              </>
            ) : !selectedSlotId ? (
              <>
                <Clock className="w-4 h-4" /> Select an Available Slot
              </>
            ) : (
              <>
                <CalendarCheck className="w-4 h-4" /> Confirm & Book Appointment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PHCAppointmentBookingPage;
