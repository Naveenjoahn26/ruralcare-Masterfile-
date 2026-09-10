import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
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
  ShieldAlert,
} from "lucide-react";
import api from "../services/api";
import {
  Referral,
  Hospital,
  Doctor,
  AppointmentSlot,
} from "../types";
import { StatusBadge } from "../components/StatusBadge";
import { SeverityBadge } from "../components/SeverityBadge";

export const AppointmentBookingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const referralIdParam = searchParams.get("referral_id") || "";
  const hospitalIdParam = searchParams.get("hospital_id") || "";

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  const [selectedReferralId, setSelectedReferralId] = useState<string>(referralIdParam);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(hospitalIdParam);
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

  // Load initial dropdown data and auto-select active referral if not provided
  useEffect(() => {
    const init = async () => {
      try {
        const [refList, hospList] = await Promise.all([
          api.getReferrals(),
          api.getHospitals(),
        ]);
        setReferrals(refList);
        setHospitals(hospList);

        // If referral ID is not in URL, auto-select first medium referral that needs booking
        if (!referralIdParam) {
          const pendingRef = refList.find(
            (r) =>
              r.severity === "MEDIUM" &&
              r.referral_status !== "COMPLETED" &&
              r.referral_status !== "CASE_CLOSED"
          );
          if (pendingRef) {
            setSelectedReferralId(pendingRef.referral_id);
            if (pendingRef.selected_hospital_id && !hospitalIdParam) {
              setSelectedHospitalId(pendingRef.selected_hospital_id);
            }
          }
        }

        if (!selectedHospitalId && !hospitalIdParam && hospList.length > 0) {
          setSelectedHospitalId(hospList[0].hospital_id);
        }
      } catch (e) {
        console.error("Error initializing appointment booking", e);
      }
    };
    init();
  }, [referralIdParam, hospitalIdParam]);

  // Load referral details when selected
  useEffect(() => {
    if (!selectedReferralId) {
      setReferral(null);
      return;
    }
    const fetchRef = async () => {
      try {
        const data = await api.getReferral(selectedReferralId);
        setReferral(data);
        if (data.selected_hospital_id && !hospitalIdParam) {
          setSelectedHospitalId(data.selected_hospital_id);
        }
      } catch (e) {
        console.error("Failed to load referral details", e);
      }
    };
    fetchRef();
  }, [selectedReferralId, hospitalIdParam]);

  // Load hospital and available slots
  useEffect(() => {
    if (!selectedHospitalId) return;
    const fetchHospitalSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        setSelectedSlotId(""); // Reset slot selection when hospital/doctor/date changes to prevent cross-hospital mismatch
        const [hospDetail, slotList] = await Promise.all([
          api.getHospital(selectedHospitalId),
          api.getHospitalSlots(selectedHospitalId, {
            doctor_id: selectedDoctorId || undefined,
            date: selectedDate || undefined,
            status: "", // Retrieve all to show booked status visually
          }),
        ]);
        setHospital(hospDetail);
        setSlots(slotList);
      } catch (err: any) {
        console.error(err);
        setError("Failed to retrieve appointment slots from hospital.");
      } finally {
        setLoading(false);
      }
    };
    fetchHospitalSlots();
  }, [selectedHospitalId, selectedDoctorId, selectedDate]);

  // Handle slot click
  const handleSlotSelect = (slotId: string) => {
    setSelectedSlotId(slotId);
    setError(null);

    // If referral is not yet selected, attempt to auto-select the first available one
    if (!selectedReferralId && referrals.length > 0) {
      const firstMedium = referrals.find((r) => r.severity === "MEDIUM") || referrals[0];
      if (firstMedium) {
        setSelectedReferralId(firstMedium.referral_id);
      }
    }
  };

  // Handle booking submission
  const handleBookAppointment = async () => {
    if (!selectedReferralId) {
      setError("Please select a referral record before confirming booking.");
      return;
    }
    if (!selectedHospitalId) {
      setError("Please select a target hospital.");
      return;
    }
    if (!selectedSlotId) {
      setError("Please select an available appointment time slot.");
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

      // Refresh slots to reflect new booked status
      const refreshedSlots = await api.getHospitalSlots(selectedHospitalId, {
        doctor_id: selectedDoctorId || undefined,
        date: selectedDate || undefined,
        status: "",
      });
      setSlots(refreshedSlots);
    } catch (err: any) {
      console.error("Booking error:", err);
      setError(
        err.response?.data?.detail ||
          "Failed to book slot. The slot may have already been reserved. Please select another slot."
      );
    } finally {
      setBookingLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedSlot = slots.find((s) => s.slot_id === selectedSlotId);
  const isButtonEnabled = !!selectedSlotId && !!selectedReferralId && !bookingLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded w-fit mb-2 border border-emerald-200">
            <CalendarCheck className="w-3.5 h-3.5" /> Direct Slot Reservation & Double-Booking Guard
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Appointment Slot Booking
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Reserve verified doctor consultation time windows at receiving higher hospitals for MEDIUM referrals.
          </p>
        </div>

        {referral && (
          <div className="flex items-center gap-2">
            <SeverityBadge severity={referral.severity} />
            <StatusBadge status={referral.referral_status} />
          </div>
        )}
      </div>

      {/* Booking Success Receipt Card */}
      {bookingSuccess && (
        <div className="bg-emerald-600 text-white p-6 rounded-2xl shadow-lg space-y-4 print:shadow-none print:border print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-500">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-bold">
                <FileCheck className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
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
                to={`/referrals/${bookingSuccess.referral_id}`}
                className="bg-emerald-800 hover:bg-emerald-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
              >
                View Dossier
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-emerald-700/50 p-4 rounded-xl">
            <div>
              <span className="text-emerald-200">Patient ID</span>
              <div className="font-bold text-white text-sm font-mono">{bookingSuccess.patient_id}</div>
            </div>
            <div>
              <span className="text-emerald-200">Higher Hospital</span>
              <div className="font-bold text-white text-sm">{bookingSuccess.selected_hospital_name}</div>
            </div>
            <div>
              <span className="text-emerald-200">Doctor / Slot</span>
              <div className="font-bold text-white text-sm">
                {bookingSuccess.appointment_details?.doctor_name || selectedSlot?.doctor_name || "Specialist Assigned"}
              </div>
            </div>
            <div>
              <span className="text-emerald-200">Date & Time Window</span>
              <div className="font-bold text-white text-sm font-mono">
                {bookingSuccess.appointment_details
                  ? `${bookingSuccess.appointment_details.date} (${bookingSuccess.appointment_details.start_time} - ${bookingSuccess.appointment_details.end_time})`
                  : `${selectedDate} (${selectedSlot?.start_time} - ${selectedSlot?.end_time})`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Referral & Hospital Selector Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Referral Dropdown */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
              <span>Select Patient Referral:</span>
              {!selectedReferralId && (
                <span className="text-amber-600 text-[10px] font-semibold">Required</span>
              )}
            </label>
            <select
              value={selectedReferralId}
              onChange={(e) => setSelectedReferralId(e.target.value)}
              className={`w-full p-2.5 bg-slate-50 border rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition ${
                !selectedReferralId ? "border-amber-300 ring-1 ring-amber-400" : "border-slate-200"
              }`}
            >
              <option value="">-- Choose Referral --</option>
              {referrals.map((r) => (
                <option key={r.referral_id} value={r.referral_id}>
                  {r.referral_id} • Patient: {r.patient_id} ({r.severity} - {r.required_department})
                </option>
              ))}
            </select>
          </div>

          {/* Hospital Dropdown */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Receiving Hospital:
            </label>
            <select
              value={selectedHospitalId}
              onChange={(e) => setSelectedHospitalId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              {hospitals.map((h) => (
                <option key={h.hospital_id} value={h.hospital_id}>
                  {h.hospital_name} ({h.district})
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Filter by Doctor:
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            >
              <option value="">All Available Specialists</option>
              {hospital?.doctors?.map((doc) => (
                <option key={doc.doctor_id} value={doc.doctor_id}>
                  {doc.doctor_name} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector */}
          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Appointment Date:
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Selected Referral Summary Ribbon */}
        {referral && (
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">
                Patient: <span className="font-mono text-blue-700">{referral.patient_id}</span>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Origin PHC: <strong className="text-slate-800">{referral.phc_name || referral.phc_id}</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">
                Dept: <strong className="text-slate-800">{referral.required_department}</strong>
              </span>
              {referral.required_test && (
                <>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Test: <strong className="text-slate-800">{referral.required_test}</strong>
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SeverityBadge severity={referral.severity} />
              <StatusBadge status={referral.referral_status} />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Available Slots Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Available Time Slots for {hospital?.hospital_name || "Selected Hospital"} ({slots.length} Total)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a green available slot to reserve. Red/Gray slots are already booked.
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

        {/* Slot Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
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
                  onClick={() => handleSlotSelect(s.slot_id)}
                  type="button"
                  className={`p-3 rounded-xl border text-left transition-all duration-150 relative cursor-pointer ${
                    !isAvailable
                      ? "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                      : isSelected
                      ? "bg-blue-600 border-blue-700 text-white shadow-md ring-2 ring-blue-300 scale-[1.02]"
                      : "bg-emerald-50/50 hover:bg-emerald-100/80 border-emerald-300 text-emerald-900"
                  }`}
                >
                  <div className="font-mono font-bold text-sm">
                    {s.start_time} - {s.end_time}
                  </div>
                  <div
                    className={`text-[11px] truncate mt-1 ${
                      isSelected ? "text-blue-100" : isAvailable ? "text-emerald-700 font-medium" : "text-slate-400"
                    }`}
                  >
                    {s.doctor_name || "Specialist"}
                  </div>
                  <div
                    className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${
                      isSelected ? "text-blue-200" : isAvailable ? "text-emerald-600" : "text-slate-400"
                    }`}
                  >
                    {s.status}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Action Button Strip */}
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
            onClick={handleBookAppointment}
            disabled={!isButtonEnabled}
            className={`flex items-center gap-2 px-6 py-3 text-xs font-bold rounded-xl shadow-md transition cursor-pointer ${
              isButtonEnabled
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50"
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {bookingLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Reserving Slot...
              </>
            ) : !selectedReferralId ? (
              <>
                <ShieldAlert className="w-4 h-4 text-amber-500" /> Select a Referral to Book
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

export default AppointmentBookingPage;
