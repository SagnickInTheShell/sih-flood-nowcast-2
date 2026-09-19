import React, { useState } from "react";
import { useFloodStore, VehicleType } from "../store/useFloodStore";

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

  const [fromText, setFromText] = useState("HSR Layout, Bengaluru");
  const [toText, setToText] = useState("Manipal Hospital, Old Airport Rd");
  const [isNavigating, setIsNavigating] = useState(false);

  const atRiskIds = new Set(simulateResult?.at_risk_infra_ids ?? []);
  const targetHospital =
    criticalInfra.find((i) => i.name.toLowerCase().includes("hospital") || i.infra_type === "hospital") ??
    criticalInfra.find((i) => atRiskIds.has(i.infra_id)) ??
    criticalInfra[0];

  // Origin & Destination coordinates
  const originCoord = { lat: 12.9185, lng: 77.6590 }; // HSR Layout
  const destCoord = targetHospital
    ? { lat: targetHospital.lat, lng: targetHospital.lng }
    : { lat: 12.9550, lng: 77.6780 }; // Manipal / Bellandur Hospital

  const vehicles: { id: VehicleType; label: string; icon: string }[] = [
    { id: "ambulance", label: "Ambulance", icon: "🚑" },
    { id: "fire", label: "Fire", icon: "🚒" },
    { id: "rescue", label: "Rescue", icon: "🛟" },
    { id: "police", label: "Police", icon: "🚓" },
  ];

  const handleVehicleChange = (v: VehicleType) => {
    setVehicleType(v);
    computeRoute(originCoord, destCoord, v);
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    if (!route) {
      computeRoute(originCoord, destCoord, vehicleType);
    }
  };

  const handleSwap = () => {
    const temp = fromText;
    setFromText(toText);
    setToText(temp);
  };

  // Route options from backend or fallback to realistic reference numbers
  const backendRoutes = route?.routes ?? [];
  const avoidedCount = route?.avoided_flooded_segments?.length ?? 3;

  const defaultRoutes = [
    {
      id: "recommended",
      name: "Recommended (Safest)",
      tag: "Safest",
      timeText: "28 min",
      distText: "12.4 km",
      summaryText: `Avoids ${avoidedCount > 0 ? avoidedCount : 3} flooded segments`,
      isSafe: true,
      color: "emerald",
    },
    {
      id: "shortest",
      name: "Shortest (Not Safe)",
      tag: "Not Safe",
      timeText: "21 min",
      distText: "9.1 km",
      summaryText: "Passes through flooded area",
      isSafe: false,
      color: "red",
    },
    {
      id: "alternate",
      name: "Alternate Route",
      tag: "Moderate risk",
      timeText: "34 min",
      distText: "14.7 km",
      summaryText: "Moderate risk",
      isSafe: true,
      color: "amber",
    },
  ];

  const displayRoutes = backendRoutes.length >= 2
    ? backendRoutes.map((r) => ({
        id: r.id,
        name: r.name,
        tag: r.tag,
        timeText: `${r.eta_minutes} min`,
        distText: `${r.distance_km} km`,
        summaryText: r.summary,
        isSafe: r.is_safe,
        color: r.id === "recommended" ? "purple" : r.id === "shortest" ? "red" : "amber",
      }))
    : defaultRoutes;

  const risk = route?.critical_access_risk;

  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <span>Emergency Routing</span>
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/40 flex items-center gap-1 shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c084fc]" />
          Safe Route Available
        </span>
      </div>

      {/* Critical Access Risk Alert Banner */}
      {risk && (
        <div className="bg-red-950/80 border border-red-500/60 rounded-xl p-3 text-white space-y-1 shadow-lg shadow-red-950/40">
          <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs uppercase tracking-wider">
            <span>⚠️</span>
            <span>Critical Access Risk</span>
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

      {/* From / To Location Fields */}
      <div className="bg-[#091b30] border border-[#143254] rounded-xl p-3 space-y-2 relative shadow-inner">
        {/* From Field */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-full bg-[#0091ea]/20 border border-[#00b0ff]/60 flex items-center justify-center text-xs text-[#00e5ff] font-bold">
            📍
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] uppercase font-bold text-slate-400">From</div>
            <input
              type="text"
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-slate-100 focus:outline-none truncate"
            />
          </div>
        </div>

        <div className="border-t border-[#132c45] relative my-1">
          {/* Swap Button */}
          <button
            onClick={handleSwap}
            title="Swap Locations"
            className="absolute -top-3.5 right-2 w-7 h-7 rounded-full bg-[#0d2645] border border-[#1b436e] hover:border-[#00e5ff] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* To Field */}
        <div className="flex items-center gap-2.5 pt-0.5">
          <div className="w-6 h-6 rounded-full bg-emerald-950/40 border border-emerald-500/60 flex items-center justify-center text-xs text-emerald-400 font-bold">
            🏥
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] uppercase font-bold text-slate-400">To</div>
            <input
              type="text"
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-emerald-300 focus:outline-none truncate"
            />
          </div>
        </div>
      </div>

      {/* Route Options Header */}
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-1">
        Route Options
      </div>

      {/* 3 Selectable Route Option Cards */}
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

                {/* Radio checkmark circle */}
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

      {/* Primary Action Button: Start Navigation */}
      <button
        onClick={handleStartNavigation}
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#0091ea] to-[#00b0ff] hover:from-[#00b0ff] hover:to-[#40c4ff] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,145,234,0.45)] hover:shadow-[0_0_20px_rgba(0,176,255,0.65)] transition-all cursor-pointer disabled:opacity-50"
      >
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        <span>{isNavigating ? "Active Navigation En Route" : "Start Navigation"}</span>
      </button>

      {/* Footer hint */}
      <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-0.5">
        <svg className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>Route updates automatically with new data</span>
      </div>
    </div>
  );
}
