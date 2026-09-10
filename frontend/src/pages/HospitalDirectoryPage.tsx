import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Stethoscope,
  FlaskConical,
  Pill,
  Bed,
  Ambulance,
  Phone,
  Search,
  RefreshCw,
  Clock,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";
import { Hospital } from "../types";

export const HospitalDirectoryPage: React.FC = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [search, setSearch] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const list = await api.getHospitals({
        district: districtFilter || undefined,
        search: search || undefined,
      });
      setHospitals(list);
      if (list.length > 0 && !selectedHospital) {
        const detail = await api.getHospital(list[0].hospital_id);
        setSelectedHospital(detail);
      }
    } catch (e) {
      console.error("Failed to load hospitals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitals();
  }, [districtFilter]);

  const handleSelectHospital = async (hId: string) => {
    try {
      const detail = await api.getHospital(hId);
      setSelectedHospital(detail);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded w-fit mb-2 border border-blue-200">
            <Building2 className="w-3.5 h-3.5" /> Higher Hospital Network Directory
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Secondary & Tertiary Healthcare Facilities
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Registered government medical colleges and district hospitals in Tamil Nadu cluster.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl font-medium">
          Connected Facilities: <strong>{hospitals.length}</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search hospitals by name, city, or district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchHospitals()}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
        >
          <option value="">All Districts</option>
          <option value="Tiruppur">Tiruppur District</option>
          <option value="Coimbatore">Coimbatore District</option>
        </select>

        <button
          onClick={fetchHospitals}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Search className="w-3.5 h-3.5" /> Search
        </button>
      </div>

      {/* Two Column Layout: Hospital List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of Hospitals */}
        <div className="space-y-3 lg:col-span-1 max-h-[700px] overflow-y-auto pr-1">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs bg-white rounded-xl border">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-600" />
              Loading hospital directory...
            </div>
          ) : (
            hospitals.map((h) => {
              const isSelected = selectedHospital?.hospital_id === h.hospital_id;
              return (
                <div
                  key={h.hospital_id}
                  onClick={() => handleSelectHospital(h.hospital_id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? "bg-blue-50 border-blue-500 shadow-sm"
                      : "bg-white hover:bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-xs">{h.hospital_name}</h3>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {h.hospital_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                    <MapPin className="w-3 h-3 text-rose-500" /> {h.district}, {h.state}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {h.hospital_type}
                    </span>
                    {h.emergency_service === "YES" && (
                      <span className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-200">
                        24x7 ER
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Hospital Detail Dossier */}
        <div className="lg:col-span-2">
          {selectedHospital ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
              {/* Title & Coordinates */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {selectedHospital.hospital_id}
                    </span>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {selectedHospital.hospital_type}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {selectedHospital.hospital_name}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {selectedHospital.district}, {selectedHospital.state}
                    </span>
                    <span className="font-mono text-slate-400">
                      GPS: {selectedHospital.latitude}, {selectedHospital.longitude}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 text-xs">
                  {selectedHospital.contact_number && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Phone className="w-3.5 h-3.5 text-slate-500" /> {selectedHospital.contact_number}
                    </span>
                  )}
                  {selectedHospital.ambulance_number && (
                    <span className="flex items-center gap-1 font-bold text-red-700">
                      <Ambulance className="w-3.5 h-3.5" /> Ambulance: {selectedHospital.ambulance_number}
                    </span>
                  )}
                </div>
              </div>

              {/* Emergency Readiness Section */}
              {selectedHospital.emergency_resource && (
                <div className="p-4 bg-red-50/50 rounded-xl border border-red-200/80 space-y-3">
                  <h3 className="font-bold text-red-950 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    <Ambulance className="w-4 h-4 text-red-600" /> Emergency Trauma Readiness
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-lg border border-red-100">
                      <span className="text-slate-500">Emergency Beds</span>
                      <div className="font-bold text-red-900 text-sm">
                        {selectedHospital.emergency_resource.emergency_beds} Beds
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-red-100">
                      <span className="text-slate-500">ICU Bed Capacity</span>
                      <div className="font-bold text-indigo-900 text-sm">
                        {selectedHospital.emergency_resource.icu_beds_available} ICU Beds
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-red-100">
                      <span className="text-slate-500">Oxygen Ready</span>
                      <div className="font-bold text-emerald-700 text-sm">
                        {selectedHospital.emergency_resource.oxygen_available}
                      </div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-red-100">
                      <span className="text-slate-500">Estimated Wait</span>
                      <div className="font-bold text-slate-900 text-sm">
                        ~{selectedHospital.emergency_resource.estimated_wait_minutes} Mins
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Departments & Doctors */}
              <div>
                <h3 className="font-bold text-slate-900 text-xs mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <Stethoscope className="w-4 h-4 text-blue-600" /> Active Departments & Doctors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedHospital.doctors?.map((doc) => (
                    <div key={doc.doctor_id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="font-bold text-slate-800">{doc.doctor_name}</div>
                      <div className="text-slate-500">{doc.specialization}</div>
                      <div className="text-[10px] font-semibold text-emerald-700 mt-1">
                        ● {doc.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnostic Tests & Medicines */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Tests */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-purple-600" /> Diagnostic Tests
                  </h4>
                  <div className="space-y-1.5">
                    {selectedHospital.tests?.map((t) => (
                      <div key={t.test_id} className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{t.test_name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            t.availability === "AVAILABLE"
                              ? "bg-emerald-100 text-emerald-800"
                              : t.availability === "LIMITED"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {t.availability}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Medicines */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-600" /> Medicine Stock Status
                  </h4>
                  <div className="space-y-1.5">
                    {selectedHospital.medicines?.map((m) => (
                      <div key={m.medicine_id} className="flex items-center justify-between">
                        <span className="font-medium text-slate-700">{m.medicine_name}</span>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                          {m.stock_status.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border">
              Select a hospital from the left to view detailed resources and schedules.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
