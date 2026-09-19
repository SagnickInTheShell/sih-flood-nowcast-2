import React, { useState } from "react";
import { useFloodStore, VehicleType } from "../store/useFloodStore";

const LOCATION_PRESETS = [
  { label: "HSR Layout, Bengaluru",      lat: 12.9185, lng: 77.6590 },
  { label: "Koramangala, Bengaluru",     lat: 12.9279, lng: 77.6271 },
  { label: "Bellandur Gate",             lat: 12.9259, lng: 77.6790 },
  { label: "Silk Board, Bengaluru",      lat: 12.9173, lng: 77.6234 },
  { label: "Sarjapur Road",              lat: 12.9102, lng: 77.6862 },
  { label: "Marathahalli",              lat: 12.9591, lng: 77.6974 },
  { label: "BTM Layout, Bengaluru",      lat: 12.9165, lng: 77.6101 },
  { label: "Indiranagar, Bengaluru",     lat: 12.9784, lng: 77.6408 },
  { label: "Whitefield, Bengaluru",      lat: 12.9698, lng: 77.7500 },
  { label: "Electronic City",            lat: 12.8406, lng: 77.6770 },
  { label: "Manipal Hospital Old Airport Rd", lat: 12.9550, lng: 77.6480 },
  { label: "St. John's Hospital",        lat: 12.9255, lng: 77.6188 },
  { label: "Narayana Health City",       lat: 12.8943, lng: 77.6402 },
  { label: "Sakra World Hospital",       lat: 12.9352, lng: 77.6897 },
  { label: "Jayadeva Hospital",          lat: 12.9161, lng: 77.6099 },
];

// ─── Reusable location-picker row ───────────────────────────────────────────
function LocationRow({
  icon,
  label,
  displayLabel,
  isPicking,
  accentClass,
  iconBgClass,
  onPickToggle,
  onPresetSelect,
}: {
  icon: string;
  label: string;
  displayLabel: string;
  isPicking: boolean;
  accentClass: string;
  iconBgClass: string;
  onPickToggle: () => void;
  onPresetSelect: (p: (typeof LOCATION_PRESETS)[0]) => void;
}) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="space-y-1.5">
      {/* Label row */}
      <div className="flex items-center gap-2.5">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${iconBgClass}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9.5px] uppercase font-bold text-slate-400">{label}</div>
          <div className={`text-xs font-semibold truncate ${accentClass}`} title={displayLabel}>
            {displayLabel}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1.5 pl-8 relative">
        {/* Pick on Map */}
        <button
          onClick={() => { onPickToggle(); setShowDropdown(false); }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold transition-all border ${
            isPicking
              ? "bg-[#00e5ff]/20 border-[#00e5ff] text-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.25)]"
              : "bg-[#0d2645] border-[#1b436e] text-slate-300 hover:border-[#00e5ff]/50 hover:text-[#00e5ff]"
          }`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="10" r="3" strokeWidth={2} />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
          </svg>
          {isPicking ? "Picking…" : "Pick on Map"}
        </button>

        {/* Presets dropdown */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold bg-[#0d2645] border border-[#1b436e] text-slate-300 hover:border-[#0091ea]/60 hover:text-slate-100 transition-all"
          >
            <span>Presets</span>
            <svg className={`w-3 h-3 transition-transform ${showDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full mt-1 w-60 z-50 bg-[#071d35] border border-[#1b436e] rounded-xl shadow-2xl overflow-hidden">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-2.5 pb-1">
                Bengaluru Locations
              </div>
              <div className="max-h-48 overflow-y-auto">
                {LOCATION_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => { onPresetSelect(p); setShowDropdown(false); }}
                    className="w-full text-left px-3 py-2 text-[11px] text-slate-200 hover:bg-[#0091ea]/20 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="text-[10px]">📍</span>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────────────────
export default function RouteComparisonPanel() {
  const route = useFloodStore((s) => s.route);
  const criticalInfra = useFloodStore((s) => s.criticalInfra);
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const computeRoute = useFloodStore((s) => s.computeRoute);
  const vehicleType = useFloodStore((s) => s.vehicleType);
  const setVehicleType = useFloodStore((s) => s.setVehicleType);
  const selectedRouteId = useFloodStore((s) => s.selectedRouteId);
  const setSelectedRouteId = useFloodStore((s) => s.setSelectedRouteId);
  const loading = useFloodStore((s) => s.loading);

  const routeStart = useFloodStore((s) => s.routeStart);
  const routeStartLabel = useFloodStore((s) => s.routeStartLabel);
  const setRouteStart = useFloodStore((s) => s.setRouteStart);
  const isPickingStartOnMap = useFloodStore((s) => s.isPickingStartOnMap);
  const setIsPickingStartOnMap = useFloodStore((s) => s.setIsPickingStartOnMap);

  const routeEnd = useFloodStore((s) => s.routeEnd);
  const routeEndLabel = useFloodStore((s) => s.routeEndLabel);
  const setRouteEnd = useFloodStore((s) => s.setRouteEnd);
  const isPickingEndOnMap = useFloodStore((s) => s.isPickingEndOnMap);
  const setIsPickingEndOnMap = useFloodStore((s) => s.setIsPickingEndOnMap);

  const [isNavigating, setIsNavigating] = useState(false);

  const atRiskIds = new Set(simulateResult?.at_risk_infra_ids ?? []);
  const defaultHospital =
    criticalInfra.find((i) => i.name.toLowerCase().includes("hospital") || i.infra_type === "hospital") ??
    criticalInfra.find((i) => atRiskIds.has(i.infra_id)) ??
    criticalInfra[0];

  // Resolved end coord: use store routeEnd if set, otherwise fall back to first hospital
  const resolvedEnd = routeEnd ?? (defaultHospital
    ? { lat: defaultHospital.lat, lng: defaultHospital.lng }
    : { lat: 12.9550, lng: 77.6480 });

  const vehicles: { id: VehicleType; label: string; icon: string }[] = [
    { id: "ambulance", label: "Ambulance", icon: "🚑" },
    { id: "fire",      label: "Fire",      icon: "🚒" },
    { id: "rescue",    label: "Rescue",    icon: "🛟" },
    { id: "police",    label: "Police",    icon: "🚓" },
  ];

  const handleVehicleChange = (v: VehicleType) => {
    setVehicleType(v);
    computeRoute(routeStart, resolvedEnd, v);
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    computeRoute(routeStart, resolvedEnd, vehicleType);
  };

  const handleSwap = () => {
    // Swap start ↔ end (labels and coords)
    const newStart = resolvedEnd;
    const newStartLabel = routeEndLabel;
    const newEnd = routeStart;
    const newEndLabel = routeStartLabel;
    setRouteStart(newStart, newStartLabel);
    setRouteEnd(newEnd, newEndLabel);
    computeRoute(newStart, newEnd, vehicleType, newStartLabel, newEndLabel);
  };

  const handleStartPreset = (p: (typeof LOCATION_PRESETS)[0]) => {
    setRouteStart({ lat: p.lat, lng: p.lng }, p.label);
    computeRoute({ lat: p.lat, lng: p.lng }, resolvedEnd, vehicleType, p.label);
  };

  const handleEndPreset = (p: (typeof LOCATION_PRESETS)[0]) => {
    setRouteEnd({ lat: p.lat, lng: p.lng }, p.label);
    computeRoute(routeStart, { lat: p.lat, lng: p.lng }, vehicleType, undefined, p.label);
  };

  // Route display
  const backendRoutes = route?.routes ?? [];
  const avoidedCount = route?.avoided_flooded_segments?.length ?? 3;

  const defaultRoutes = [
    {
      id: "recommended",
      name: "Recommended (Safest)",
      timeText: "28 min",
      distText: "12.4 km",
      summaryText: `Avoids ${avoidedCount > 0 ? avoidedCount : 3} flooded segments`,
    },
    {
      id: "shortest",
      name: "Shortest (Not Safe)",
      timeText: "21 min",
      distText: "9.1 km",
      summaryText: "Passes through flooded area",
    },
    {
      id: "alternate",
      name: "Alternate Route",
      timeText: "34 min",
      distText: "14.7 km",
      summaryText: "Moderate risk",
    },
  ];

  const displayRoutes = backendRoutes.length >= 2
    ? backendRoutes.map((r) => ({
        id: r.id,
        name: r.name,
        timeText: `${r.eta_minutes} min`,
        distText: `${r.distance_km} km`,
        summaryText: r.summary,
      }))
    : defaultRoutes;

  const risk = route?.critical_access_risk;

  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-100">Emergency Routing</h2>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/40 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
          Safe Route Available
        </span>
      </div>

      {/* Critical Access Risk */}
      {risk && (
        <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-3 text-white space-y-1">
          <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
            <span>⚠️</span><span>Critical Access Risk</span>
          </div>
          <div className="text-xs font-semibold text-slate-100">{risk.infra_name}</div>
          <div className="text-[11px] text-red-200/90 leading-relaxed">{risk.message}</div>
        </div>
      )}

      {/* Vehicle Profile Switcher */}
      <div className="grid grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#081729] border border-[#142e4c]">
        {vehicles.map((v) => {
          const isActive = vehicleType === v.id;
          return (
            <button
              key={v.id}
              onClick={() => handleVehicleChange(v.id)}
              className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? "bg-[#0091ea] text-white shadow-[0_0_10px_rgba(0,145,234,0.5)] border border-[#40c4ff]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c223c]"
              }`}
            >
              <span>{v.icon}</span>
              <span className="truncate">{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* From / To card */}
      <div className="bg-[#091b30] border border-[#143254] rounded-xl p-3 space-y-3 shadow-inner">
        {/* FROM */}
        <LocationRow
          icon="🔵"
          label="From — Start Point"
          displayLabel={routeStartLabel}
          isPicking={isPickingStartOnMap}
          accentClass="text-[#00e5ff]"
          iconBgClass="bg-[#0091ea]/20 border border-[#00b0ff]/60"
          onPickToggle={() => setIsPickingStartOnMap(!isPickingStartOnMap)}
          onPresetSelect={handleStartPreset}
        />

        {/* Divider + Swap */}
        <div className="border-t border-[#132c45] relative flex items-center justify-center">
          <button
            onClick={handleSwap}
            title="Swap Start ↔ End"
            className="absolute w-7 h-7 rounded-full bg-[#0d2645] border border-[#1b436e] hover:border-[#c084fc] text-slate-300 hover:text-[#c084fc] flex items-center justify-center transition-all shadow"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* TO */}
        <LocationRow
          icon="🟢"
          label="To — Destination"
          displayLabel={routeEndLabel}
          isPicking={isPickingEndOnMap}
          accentClass="text-emerald-300"
          iconBgClass="bg-emerald-950/40 border border-emerald-500/60"
          onPickToggle={() => setIsPickingEndOnMap(!isPickingEndOnMap)}
          onPresetSelect={handleEndPreset}
        />
      </div>

      {/* Route Options */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">
        Route Options
      </div>

      <div className="space-y-2">
        {displayRoutes.map((r) => {
          const isSelected = selectedRouteId === r.id;
          return (
            <div
              key={r.id}
              onClick={() => setSelectedRouteId(r.id)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? r.id === "recommended"
                    ? "bg-[#271047]/90 border-[#a855f7] shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                    : r.id === "shortest"
                    ? "bg-red-950/40 border-red-500 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                    : "bg-[#2b220d]/80 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "bg-[#091b30] border-[#143254] hover:border-[#1e4a7a]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {r.id === "recommended" ? (
                    <span className="text-[#c084fc] text-sm font-bold">★</span>
                  ) : r.id === "shortest" ? (
                    <span className="text-red-400 text-sm">⚠️</span>
                  ) : (
                    <span className="text-amber-400 text-sm">🔄</span>
                  )}
                  <div className="text-xs font-bold text-white">{r.name}</div>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? r.id === "recommended"
                        ? "border-[#c084fc] bg-[#c084fc] text-black"
                        : r.id === "shortest"
                        ? "border-red-400 bg-red-400 text-white"
                        : "border-amber-400 bg-amber-400 text-black"
                      : "border-slate-500 bg-transparent"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <span className="font-extrabold text-white">{r.timeText}</span>
                <span className="text-slate-400">&bull;</span>
                <span className="text-slate-300 font-mono text-[11px]">{r.distText}</span>
                <span className="text-slate-400">&bull;</span>
                <span
                  className={`text-[11px] font-medium truncate ${
                    r.id === "recommended"
                      ? "text-purple-300 font-semibold"
                      : r.id === "shortest"
                      ? "text-red-400 font-semibold"
                      : "text-amber-300"
                  }`}
                >
                  {r.summaryText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Navigation */}
      <button
        onClick={handleStartNavigation}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0091ea] to-[#00b0ff] hover:from-[#00b0ff] hover:to-[#40c4ff] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,145,234,0.45)] hover:shadow-[0_0_20px_rgba(0,176,255,0.65)] transition-all cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span>{isNavigating ? "Active Navigation En Route" : "Start Navigation"}</span>
      </button>

      {/* Footer */}
      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-0.5">
        <svg className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Route updates automatically with new data</span>
      </div>
    </div>
  );
}
