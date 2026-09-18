import React from "react";
import { useFloodStore } from "../store/useFloodStore";

export default function BottomAnalyticsRow() {
  const weatherNowcast = useFloodStore((s) => s.weatherNowcast);
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const currentRainfall = useFloodStore((s) => s.currentRainfall);

  // Dynamic or fallback values
  const nowRain = weatherNowcast?.current_rainfall_mm_hr ?? currentRainfall?.intensity ?? 78;
  const forecastData = [
    { label: "Now", value: Math.round(nowRain), type: "observed" },
    { label: "+1h", value: Math.round(nowRain * 0.79), type: "forecast" },
    { label: "+2h", value: Math.round(nowRain * 0.58), type: "forecast" },
    { label: "+3h", value: Math.round(nowRain * 0.36), type: "forecast" },
  ];

  const roadSegments = simulateResult?.road_segments ?? [];
  const totalSegments = roadSegments.length > 0 ? roadSegments.length : 463;
  const realFlooded = roadSegments.filter((r) => r.state === "flooded").length;
  const floodedCount = realFlooded > 0 ? realFlooded : 39;
  const realAtRisk = roadSegments.filter((r) => r.state === "at_risk").length;
  const atRiskCount = realAtRisk > 0 ? realAtRisk : 78;
  const clearCount = Math.max(totalSegments - floodedCount - atRiskCount, 0);

  const floodedPct = Math.round((floodedCount / totalSegments) * 100);
  const atRiskPct = Math.round((atRiskCount / totalSegments) * 100);
  const clearPct = Math.max(100 - floodedPct - atRiskPct, 0);

  const atRiskAreas = [
    { name: "Bellandur", risk: "High", depth: "30 – 50 cm", color: "bg-red-500/20 text-red-400 border-red-500/40" },
    { name: "Marathahalli", risk: "High", depth: "20 – 40 cm", color: "bg-red-500/20 text-red-400 border-red-500/40" },
    { name: "Hebbal", risk: "Moderate", depth: "10 – 25 cm", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
    { name: "Koramangala", risk: "Moderate", depth: "10 – 20 cm", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
    { name: "Yelahanka", risk: "Low", depth: "5 – 15 cm", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" },
  ];

  const liveAlerts = [
    { icon: "⚠️", text: "Heavy rainfall in Bellandur", time: "10 mins ago", type: "amber" },
    { icon: "⚠️", text: "Road waterlogging near ORR", time: "27 mins ago", type: "amber" },
    { icon: "🚨", text: "Hospital access at risk (Marathahalli)", time: "40 mins ago", type: "red" },
    { icon: "ℹ️", text: "Drainage capacity high at Koramangala", time: "1 hour ago", type: "blue" },
    { icon: "⚠️", text: "Alternate route suggested for HSR", time: "1 hour ago", type: "amber" },
  ];

  // Donut chart calculations (circumference = 2 * PI * r)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const clearDash = (clearPct / 100) * circumference;
  const atRiskDash = (atRiskPct / 100) * circumference;
  const floodedDash = (floodedPct / 100) * circumference;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 px-5 py-2.5 bg-[#061120] border-t border-[#11263d]">
      {/* 1. Rainfall Forecast (Next 3 Hours) */}
      <div className="bg-[#0c1e33] border border-[#173454] rounded-xl p-3 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between pb-1.5 border-b border-[#142e4c]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="text-[#00E5FF]">🌧</span>
              <span>Rainfall Forecast (Next 3 Hours)</span>
            </div>
            {/* Legend */}
            <div className="flex items-center gap-2 text-[10px] text-slate-300">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-[#0077b6]" />
                <span>Observed</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-xs bg-[#00e5ff]" />
                <span>Forecast</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="h-28 pt-1 flex items-end justify-between px-2 relative">
            {/* Y Axis Guide Lines */}
            <div className="absolute inset-x-0 top-1 border-b border-slate-800/60 text-[9px] text-slate-600 pl-1">100</div>
            <div className="absolute inset-x-0 top-8 border-b border-slate-800/60 text-[9px] text-slate-600 pl-1">80</div>
            <div className="absolute inset-x-0 top-15 border-b border-slate-800/60 text-[9px] text-slate-600 pl-1">60</div>
            <div className="absolute inset-x-0 top-21 border-b border-slate-800/60 text-[9px] text-slate-600 pl-1">40</div>

            {/* Bars */}
            {forecastData.map((d, i) => {
              const heightPct = Math.min(100, Math.max(10, (d.value / 100) * 100));
              return (
                <div key={i} className="flex flex-col items-center gap-1 z-10 w-12">
                  <span className="text-[11px] font-extrabold text-white">{d.value}</span>
                  <div
                    className={`w-7 rounded-t-md transition-all duration-500 shadow-md ${
                      d.type === "observed"
                        ? "bg-[#0077b6] hover:bg-[#0096c7]"
                        : "bg-gradient-to-t from-[#00b4d8] to-[#00e5ff] shadow-[0_0_10px_rgba(0,229,255,0.4)]"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10.5px] font-semibold text-slate-300">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Top At-Risk Areas */}
      <div className="bg-[#0c1e33] border border-[#173454] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[#142e4c]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="text-red-400">⚠️</span>
              <span>Top At-Risk Areas</span>
            </div>
            <button className="text-[11px] font-medium text-[#00E5FF] hover:underline">
              View All
            </button>
          </div>

          {/* Table */}
          <div className="mt-2.5 overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead>
                <tr className="text-slate-400 text-[10px] font-semibold border-b border-[#142e4c]">
                  <th className="pb-1.5 font-medium">Area</th>
                  <th className="pb-1.5 font-medium">Risk Level</th>
                  <th className="pb-1.5 font-medium text-right">Water Depth (est.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#122842]">
                {atRiskAreas.map((a, i) => (
                  <tr key={i} className="hover:bg-[#0d2645]/40 transition-colors">
                    <td className="py-1.5 font-semibold text-slate-200">{a.name}</td>
                    <td className="py-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold border ${a.color}`}>
                        {a.risk}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-mono text-slate-300 text-[10.5px]">
                      {a.depth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 3. Road Network Status */}
      <div className="bg-[#0c1e33] border border-[#173454] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-white pb-2 border-b border-[#142e4c]">
            <span className="text-slate-300">🛣️</span>
            <span>Road Network Status</span>
          </div>

          {/* Donut Chart & Legend */}
          <div className="mt-2.5 flex items-center justify-around gap-2">
            {/* SVG Donut */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                {/* Background Ring */}
                <circle cx="60" cy="60" r={radius} stroke="#173454" strokeWidth="12" fill="none" />
                {/* Clear (Green) */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#00FF88"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${clearDash} ${circumference}`}
                  strokeDashoffset="0"
                  className="transition-all duration-700"
                />
                {/* At Risk (Orange) */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#F59E0B"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${atRiskDash} ${circumference}`}
                  strokeDashoffset={-clearDash}
                  className="transition-all duration-700"
                />
                {/* Flooded (Red) */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  stroke="#EF4444"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${floodedDash} ${circumference}`}
                  strokeDashoffset={-(clearDash + atRiskDash)}
                  className="transition-all duration-700"
                />
              </svg>
              {/* Donut Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-black text-white leading-tight">{totalSegments}</span>
                <span className="text-[9px] font-medium text-slate-400 leading-tight">Total Segments</span>
              </div>
            </div>

            {/* Legend Stats */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]" />
                <span className="font-bold text-white">{floodedCount}</span>
                <span className="text-slate-300">Flooded</span>
                <span className="text-slate-400 text-[10px]">({floodedPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]" />
                <span className="font-bold text-white">{atRiskCount}</span>
                <span className="text-slate-300">At Risk</span>
                <span className="text-slate-400 text-[10px]">({atRiskPct}%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#00FF88]" />
                <span className="font-bold text-white">{clearCount}</span>
                <span className="text-slate-300">Clear</span>
                <span className="text-slate-400 text-[10px]">({clearPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Alerts */}
      <div className="bg-[#0c1e33] border border-[#173454] rounded-xl p-3.5 flex flex-col justify-between shadow-md">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[#142e4c]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span className="text-red-400">🔔</span>
              <span>Live Alerts</span>
            </div>
            <button className="text-[11px] font-medium text-[#00E5FF] hover:underline">
              View All
            </button>
          </div>

          {/* List of alerts */}
          <div className="mt-2 space-y-2">
            {liveAlerts.map((alert, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-[11px]">
                <div className="flex items-start gap-1.5 min-w-0">
                  <span className="text-xs mt-0.5">{alert.icon}</span>
                  <span className="text-slate-200 truncate font-medium">{alert.text}</span>
                </div>
                <span className="text-[10px] text-slate-400 whitespace-nowrap font-mono">
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
