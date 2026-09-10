import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  UserPlus,
  Stethoscope,
  Activity,
  Ambulance,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Building,
  Heart,
  FileText,
  User,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { PHC, MatchingHospitalResult, AppointmentSlot } from "../../types";

export const PHCPatientRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get("patient_id");

  const [phcs, setPhcs] = useState<PHC[]>([]);
  const [selectedPhcId, setSelectedPhcId] = useState<string>("PHC001");

  // Patient Demographics
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("Male");
  const [contactNumber, setContactNumber] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");

  // Vitals
  const [bpSystolic, setBpSystolic] = useState("120");
  const [bpDiastolic, setBpDiastolic] = useState("80");
  const [pulseRate, setPulseRate] = useState("76");
  const [spo2, setSpo2] = useState("98");
  const [temperature, setTemperature] = useState("98.6");
  const [weightKg, setWeightKg] = useState("65");
  const [bloodGlucose, setBloodGlucose] = useState("110");

  // Clinical Consultation
  const [symptoms, setSymptoms] = useState("");
  const [preliminaryDiagnosis, setPreliminaryDiagnosis] = useState("");
  const [phcDoctorNotes, setPhcDoctorNotes] = useState("");
  const [prescriptionsSummary, setPrescriptionsSummary] = useState("");

  // Severity & Referral Triage
  const [severity, setSeverity] = useState<"NORMAL" | "MEDIUM" | "EMERGENCY">("MEDIUM");
  const [requiredDepartment, setRequiredDepartment] = useState("Cardiology");
  const [requiredTest, setRequiredTest] = useState("ECG");

  // Matching & Booking State
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchedHospitals, setMatchedHospitals] = useState<MatchingHospitalResult[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [hospitalSlots, setHospitalSlots] = useState<AppointmentSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Success state
  const [successResult, setSuccessResult] = useState<{
    type: "NORMAL" | "MEDIUM" | "EMERGENCY";
    patientId: string;
    referralId?: string;
    hospitalName?: string;
    slotDetails?: string;
  } | null>(null);

  useEffect(() => {
    const fetchPhcs = async () => {
      try {
        const list = await api.getPHCs();
        setPhcs(list);
      } catch (e) {
        console.error(e);
      }
    };
    fetchPhcs();

    if (preselectedPatientId) {
      api.getPatient(preselectedPatientId).then((p) => {
        setFullName(p.full_name);
        setAge(p.age);
        setGender(p.gender);
        setSelectedPhcId(p.phc_id);
        setContactNumber(p.contact_number || "");
        setEmail(p.email || "");
        setAddress(p.address || "");
        setBloodGroup(p.blood_group || "O+");
        setSymptoms(p.symptoms || "");
        setPreliminaryDiagnosis(p.preliminary_diagnosis || "");
        setPhcDoctorNotes(p.phc_doctor_notes || "");
        setPrescriptionsSummary(p.prescriptions_summary || "");
      }).catch(console.error);
    }
  }, [preselectedPatientId]);

  // When user switches to MEDIUM, auto-fetch hospital matches
  const handleFindHospitals = async () => {
    try {
      setMatchingLoading(true);
      const res = await api.matchMedium({
        phc_id: selectedPhcId,
        required_department: requiredDepartment,
        required_test: requiredTest || undefined,
      });
      setMatchedHospitals(res.hospitals);
      if (res.hospitals.length > 0) {
        const top = res.recommended_hospital || res.hospitals[0];
        setSelectedHospitalId(top.hospital_id);
        loadHospitalSlots(top.hospital_id);
      }
    } catch (e) {
      console.error("Matching error:", e);
    } finally {
      setMatchingLoading(false);
    }
  };

  const loadHospitalSlots = async (hospitalId: string) => {
    try {
      setSlotsLoading(true);
      const slots = await api.getHospitalSlots(hospitalId, { status: "AVAILABLE" });
      setHospitalSlots(slots);
      if (slots.length > 0) {
        setSelectedSlotId(slots[0].slot_id);
      } else {
        setSelectedSlotId("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleHospitalSelect = (hospId: string) => {
    setSelectedHospitalId(hospId);
    loadHospitalSlots(hospId);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Create or Register Patient
      const vitalsObj = {
        blood_pressure: `${bpSystolic}/${bpDiastolic} mmHg`,
        pulse_rate: `${pulseRate} bpm`,
        spo2: `${spo2}%`,
        temperature: `${temperature} °F`,
        weight_kg: Number(weightKg) || 60,
        blood_glucose_random: `${bloodGlucose} mg/dL`,
      };

      let patientId = preselectedPatientId;
      if (!patientId) {
        const newPatient = await api.createPatient({
          full_name: fullName || "Anonymous Patient",
          age: Number(age) || 45,
          gender,
          phc_id: selectedPhcId,
          contact_number: contactNumber || "+91 98421-00000",
          email: email || undefined,
          address: address || undefined,
          blood_group: bloodGroup,
          vitals: vitalsObj,
          symptoms,
          preliminary_diagnosis: preliminaryDiagnosis,
          phc_doctor_notes: phcDoctorNotes,
          prescriptions_summary: prescriptionsSummary,
        });
        patientId = newPatient.patient_id;
      }

      // 2. Handle Case by Severity
      if (severity === "NORMAL") {
        // Record local PHC consultation
        await api.recordLocalConsultation(patientId, {
          symptoms,
          diagnosis: preliminaryDiagnosis || "General ailment handled locally",
          prescriptions: prescriptionsSummary || "Standard PHC supportive medication",
          doctor_notes: phcDoctorNotes || "Advised home rest and diet. Follow-up if symptoms persist.",
        });

        setSuccessResult({
          type: "NORMAL",
          patientId,
        });
      } else if (severity === "MEDIUM") {
        // Create Medium Referral
        const ref = await api.createReferral({
          patient_id: patientId,
          phc_id: selectedPhcId,
          severity: "MEDIUM",
          required_department: requiredDepartment,
          required_test: requiredTest || undefined,
          reason: preliminaryDiagnosis || symptoms,
        });

        // Record hospital preference & book appointment
        if (selectedHospitalId && selectedSlotId) {
          await api.recordHospitalSelection(ref.referral_id, selectedHospitalId);
          await api.bookAppointment({
            referral_id: ref.referral_id,
            hospital_id: selectedHospitalId,
            slot_id: selectedSlotId,
          });
        }

        const chosenHosp = matchedHospitals.find((h) => h.hospital_id === selectedHospitalId);
        const chosenSlot = hospitalSlots.find((s) => s.slot_id === selectedSlotId);

        setSuccessResult({
          type: "MEDIUM",
          patientId,
          referralId: ref.referral_id,
          hospitalName: chosenHosp?.hospital_name || selectedHospitalId,
          slotDetails: chosenSlot ? `${chosenSlot.date} at ${chosenSlot.start_time}` : undefined,
        });
      } else if (severity === "EMERGENCY") {
        // Create Emergency Referral
        const ref = await api.createReferral({
          patient_id: patientId,
          phc_id: selectedPhcId,
          severity: "EMERGENCY",
          required_department: requiredDepartment || "General Medicine",
          required_test: requiredTest || undefined,
          reason: `CRITICAL EMERGENCY: ${preliminaryDiagnosis || symptoms}`,
        });

        // Run emergency auto-match to get top emergency facility
        const emMatch = await api.matchEmergency({
          phc_id: selectedPhcId,
          required_department: requiredDepartment,
          required_test: requiredTest || undefined,
          referral_id: ref.referral_id,
        });

        const topEmHospId = emMatch.recommended_hospital?.hospital_id || "H002";
        const topEmHospName = emMatch.recommended_hospital?.hospital_name || "District Hospital";

        // Dispatch emergency transfer immediately
        await api.initiateEmergencyTransfer(
          ref.referral_id,
          topEmHospId,
          `Critical transfer for ${fullName || patientId}. 108 Emergency ambulance dispatched.`
        );

        setSuccessResult({
          type: "EMERGENCY",
          patientId,
          referralId: ref.referral_id,
          hospitalName: topEmHospName,
        });
      }
    } catch (err: any) {
      alert("Error processing consultation: " + (err?.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (successResult) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        <div
          className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center shadow-lg ${
            successResult.type === "EMERGENCY"
              ? "bg-red-600 text-white animate-pulse"
              : successResult.type === "MEDIUM"
              ? "bg-blue-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {successResult.type === "EMERGENCY" ? (
            <Ambulance className="w-8 h-8" />
          ) : (
            <CheckCircle2 className="w-8 h-8" />
          )}
        </div>

        <div>
          <span
            className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
              successResult.type === "EMERGENCY"
                ? "bg-red-100 text-red-800"
                : successResult.type === "MEDIUM"
                ? "bg-blue-100 text-blue-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {successResult.type === "EMERGENCY"
              ? "EMERGENCY TRANSFER DISPATCHED"
              : successResult.type === "MEDIUM"
              ? "REFERRAL & APPOINTMENT CONFIRMED"
              : "LOCAL PHC CONSULTATION COMPLETED"}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-3">
            {successResult.type === "EMERGENCY"
              ? "Emergency 108 Transfer Initiated"
              : successResult.type === "MEDIUM"
              ? "Connected Referral Created"
              : "Patient Care Record Saved"}
          </h2>
          <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
            {successResult.type === "EMERGENCY"
              ? "High-priority alert and auto-triage dispatch generated for the higher hospital emergency department."
              : successResult.type === "MEDIUM"
              ? "The referral dossier and confirmed appointment slot are now synced across the Central Platform."
              : "Patient treated locally at PHC level. No higher hospital referral required."}
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-xs text-left space-y-2">
          <div className="flex justify-between border-b border-slate-200 pb-2">
            <span className="text-slate-500">Patient ID:</span>
            <span className="font-mono font-bold text-slate-900">{successResult.patientId}</span>
          </div>
          {successResult.referralId && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Referral ID:</span>
              <span className="font-mono font-bold text-blue-600">{successResult.referralId}</span>
            </div>
          )}
          {successResult.hospitalName && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Higher Hospital:</span>
              <span className="font-semibold text-slate-800">{successResult.hospitalName}</span>
            </div>
          )}
          {successResult.slotDetails && (
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Confirmed Appointment:</span>
              <span className="font-mono font-bold text-emerald-700">{successResult.slotDetails}</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setSuccessResult(null);
              setFullName("");
              setSymptoms("");
              setPreliminaryDiagnosis("");
              setPhcDoctorNotes("");
              setPrescriptionsSummary("");
            }}
            className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Register Another Patient
          </button>
          <button
            onClick={() => navigate("/phc")}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow transition"
          >
            Go to PHC Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider">
            <Stethoscope className="w-4 h-4" />
            PHC Doctor & Worker Interface
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Patient Registration & Clinical Triage
          </h1>
          <p className="text-xs text-slate-500">
            Record patient vitals, enter doctor diagnosis, and route by severity (Normal / Medium / Emergency)
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
          <Building className="w-4 h-4 text-slate-500" />
          <select
            value={selectedPhcId}
            onChange={(e) => setSelectedPhcId(e.target.value)}
            aria-label="Select PHC Facility"
            className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
          >
            {phcs.map((p) => (
              <option key={p.phc_id} value={p.phc_id}>
                {p.phc_id} - {p.phc_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Section 1: Patient Demographics */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <User className="w-4 h-4 text-blue-600" />
          1. Patient Demographics & Contact
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Full Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Ramesh Kumar"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Age *</label>
            <input
              type="number"
              required
              min={1}
              max={120}
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(Number(e.target.value) || "")}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              aria-label="Patient Gender"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Contact Number (SMS)</label>
            <input
              type="text"
              placeholder="+91 98421-xxxxx"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
              aria-label="Patient Blood Group"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Vitals */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Activity className="w-4 h-4 text-emerald-600" />
          2. Patient Vital Signs (PHC Nurse / Worker Entry)
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Blood Pressure (Systolic/Diastolic)</label>
            <div className="flex items-center gap-1">
              <input
                type="text"
                placeholder="120"
                value={bpSystolic}
                onChange={(e) => setBpSystolic(e.target.value)}
                className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
              />
              <span className="text-slate-400">/</span>
              <input
                type="text"
                placeholder="80"
                value={bpDiastolic}
                onChange={(e) => setBpDiastolic(e.target.value)}
                className="w-1/2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Pulse Rate (bpm)</label>
            <input
              type="text"
              placeholder="76"
              value={pulseRate}
              onChange={(e) => setPulseRate(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">SpO2 (%)</label>
            <input
              type="text"
              placeholder="98"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-emerald-600"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Temperature (°F)</label>
            <input
              type="text"
              placeholder="98.6"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Clinical Consultation & Doctor Severity Triage */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Stethoscope className="w-4 h-4 text-indigo-600" />
          3. PHC Doctor Consultation & Severity Triage
        </h2>

        <div className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Presenting Symptoms *</label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Exertional chest tightness, shortness of breath on stairs for 3 days..."
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Preliminary Diagnosis</label>
            <input
              type="text"
              placeholder="e.g. Suspected Angina / Ischemic Heart Disease"
              value={preliminaryDiagnosis}
              onChange={(e) => setPreliminaryDiagnosis(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          {/* Severity Decision Radios */}
          <div className="space-y-2 pt-2">
            <label className="font-bold text-xs uppercase tracking-wider text-slate-800 block">
              PHC Doctor Clinical Severity Routing *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  severity === "NORMAL"
                    ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value="NORMAL"
                  checked={severity === "NORMAL"}
                  onChange={() => setSeverity("NORMAL")}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-emerald-800">NORMAL (Local Care)</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Handled completely at PHC. Doctor advice & prescriptions recorded locally. No hospital referral.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  severity === "MEDIUM"
                    ? "border-blue-500 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value="MEDIUM"
                  checked={severity === "MEDIUM"}
                  onChange={() => {
                    setSeverity("MEDIUM");
                    handleFindHospitals();
                  }}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-blue-800">MEDIUM (Referral & Booking)</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Requires higher hospital consultation. Intelligent hospital matching & appointment booking.
                  </div>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                  severity === "EMERGENCY"
                    ? "border-red-500 bg-red-50/50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <input
                  type="radio"
                  name="severity"
                  value="EMERGENCY"
                  checked={severity === "EMERGENCY"}
                  onChange={() => setSeverity("EMERGENCY")}
                  className="mt-1"
                />
                <div>
                  <div className="font-bold text-red-800">EMERGENCY (Auto-Transfer)</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">
                    Critical condition. Auto-triage to optimal hospital (ICU beds, oxygen, ambulance). Immediate 108 transfer.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Section for MEDIUM: Hospital Matching & Appointment Booking */}
      {severity === "MEDIUM" && (
        <div className="bg-white p-6 rounded-2xl border border-blue-200 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                4. Intelligent Hospital Matching & Slot Selection (MEDIUM)
              </h2>
              <p className="text-xs text-slate-500">
                Algorithmically ranked suitable hospitals based on specialty, tests, doctors, and distance
              </p>
            </div>
            <button
              type="button"
              onClick={handleFindHospitals}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${matchingLoading ? "animate-spin" : ""}`} />
              Refresh Matching
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Required Department</label>
              <select
                value={requiredDepartment}
                onChange={(e) => setRequiredDepartment(e.target.value)}
                aria-label="Required Medical Department"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              >
                <option value="Cardiology">Cardiology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="General Medicine">General Medicine</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Required Diagnostic Test</label>
              <select
                value={requiredTest}
                onChange={(e) => setRequiredTest(e.target.value)}
                aria-label="Required Diagnostic Test"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              >
                <option value="ECG">ECG</option>
                <option value="X-Ray">X-Ray</option>
                <option value="Blood Test">Blood Test</option>
                <option value="CT Scan">CT Scan</option>
                <option value="None">None Required</option>
              </select>
            </div>
          </div>

          {/* Hospital Options */}
          <div className="space-y-3">
            <label className="font-bold text-xs text-slate-800 block">
              Ranked Hospital Recommendations:
            </label>
            {matchingLoading ? (
              <div className="py-8 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                Calculating distance & resource availability...
              </div>
            ) : matchedHospitals.length === 0 ? (
              <div className="p-4 bg-slate-50 text-slate-500 rounded-xl text-xs text-center">
                Click "Refresh Matching" to evaluate nearby higher hospitals.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchedHospitals.map((h, idx) => (
                  <div
                    key={h.hospital_id}
                    onClick={() => handleHospitalSelect(h.hospital_id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                      selectedHospitalId === h.hospital_id
                        ? "border-blue-600 bg-blue-50/60 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">
                          #{idx + 1}
                        </span>
                        {h.hospital_name}
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Score: {h.score}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{h.district} • {h.distance_km} km from PHC</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarCheck className="w-3 h-3 text-slate-400" />
                        <span>{h.available_slots_count} available appointment slots</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Slots Selector */}
          {selectedHospitalId && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="font-bold text-xs text-slate-800 block flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Select Appointment Time Slot:
              </label>

              {slotsLoading ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading available slots...</div>
              ) : hospitalSlots.length === 0 ? (
                <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs">
                  No open slots found for this hospital. Please select another facility.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {hospitalSlots.map((s) => (
                    <button
                      key={s.slot_id}
                      type="button"
                      onClick={() => setSelectedSlotId(s.slot_id)}
                      className={`p-2.5 rounded-xl border text-xs text-center transition cursor-pointer ${
                        selectedSlotId === s.slot_id
                          ? "border-blue-600 bg-blue-600 text-white font-bold shadow"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="font-semibold">{s.date}</div>
                      <div className="text-[11px] opacity-90">{s.start_time} - {s.end_time}</div>
                      {s.doctor_name && <div className="text-[10px] mt-0.5 truncate">{s.doctor_name}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dynamic Section for EMERGENCY: Urgent Dispatch Banner */}
      {severity === "EMERGENCY" && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-lg space-y-3">
          <div className="flex items-center gap-3">
            <Ambulance className="w-8 h-8 text-red-600 animate-pulse" />
            <div>
              <h2 className="text-base font-black text-red-900">
                CRITICAL EMERGENCY PROTOCOL ACTIVE
              </h2>
              <p className="text-xs text-red-700">
                The Central Platform will immediately evaluate ICU beds, oxygen supply, and ambulance standby.
                Patient choice and routine appointment slots are bypassed for urgent life-saving transfer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => navigate("/phc")}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-white shadow-xl transition cursor-pointer ${
            severity === "EMERGENCY"
              ? "bg-red-600 hover:bg-red-700 shadow-red-900/30"
              : severity === "MEDIUM"
              ? "bg-blue-600 hover:bg-blue-700 shadow-blue-900/30"
              : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30"
          }`}
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing Consultation...
            </>
          ) : severity === "EMERGENCY" ? (
            <>
              <Ambulance className="w-4 h-4" />
              Initiate Emergency 108 Transfer
            </>
          ) : severity === "MEDIUM" ? (
            <>
              <CalendarCheck className="w-4 h-4" />
              Confirm Referral & Book Slot
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Complete Local PHC Care
            </>
          )}
        </button>
      </div>
    </form>
  );
};
