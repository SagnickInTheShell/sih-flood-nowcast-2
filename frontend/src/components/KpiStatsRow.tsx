import { useFloodStore } from "../store/useFloodStore";

export default function KpiStatsRow() {
  const currentRainfall = useFloodStore((s) => s.currentRainfall);
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const criticalInfra = useFloodStore((s) => s.criticalInfra);

  const roadSegments = simulateResult?.road_segments ?? [];
  const totalRoads = roadSegments.length;

  const floodedCount = roadSegments.filter((r) => r.state === "flooded").length;
  const atRiskCount = roadSegments.filter((r) => r.state === "at_risk").length;
  const highRiskCount = floodedCount + atRiskCount;

  const atRiskInfraIds = simulateResult?.at_risk_infra_ids ?? [];
  const totalInfra = criticalInfra.length;
  const atRiskInfraCount = atRiskInfraIds.length;

  // Mini sparkline bar heights derived proportionally from rainfall intensity
  const intensity = currentRainfall?.intensity ?? 60;
  const barHeights = [
    Math.min(100, Math.max(20, intensity * 0.3)),
    Math.min(100, Math.max(30, intensity * 0.5)),
    Math.min(100, Math.max(45, intensity * 0.75)),
    Math.min(100, Math.max(60, intensity * 0.9)),
    Math.min(100, Math.max(75, intensity * 1.1)),
    Math.min(100, Math.max(50, intensity * 0.8)),
    Math.min(100, Math.max(85, intensity * 1.2)),
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-5 py-3.5 bg-darkBg/95 border-b border-darkBorder">
      {/* 1. Rainfall Setting */}
      <div className="bg-darkCard/80 hover:bg-darkCard transition-all border border-darkBorder rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-tealGlow" />
            Rainfall Nowcast
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-white">{intensity}</span>
            <span className="text-xs font-semibold text-tealGlow">mm/hr</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {currentRainfall?.duration ?? 90} min storm duration
          </div>
        </div>
        <div className="flex items-end gap-1 h-9 px-2">
          {barHeights.map((h, i) => (
            <div
              key={i}
              className="w-1.5 rounded-t bg-gradient-to-t from-teal/40 to-tealGlow transition-all duration-300"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* 2. High Risk Zones */}
      <div className="bg-darkCard/80 hover:bg-darkCard transition-all border border-darkBorder rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-riskAmber" />
            High Risk Zones
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-amber-300">{highRiskCount}</span>
            <span className="text-xs text-slate-400">segments</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {totalRoads > 0 ? `of ${totalRoads} monitored segments` : "Computing..."}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      {/* 3. Flooded Roads */}
      <div className="bg-darkCard/80 hover:bg-darkCard transition-all border border-darkBorder rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-riskRed" />
            Flooded Roads
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black tracking-tight text-red-400">{floodedCount}</span>
            <span className="text-xs text-slate-400">
              {totalRoads > 0 ? `of ${totalRoads} total roads` : "roads"}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {totalRoads > 0 ? `${((floodedCount / totalRoads) * 100).toFixed(0)}% impassable` : "Awaiting data"}
          </div>
        </div>
        <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>
      </div>

      {/* 4. Critical Infrastructure Status (REAL count of 0-redundancy nodes, never fake 100%) */}
      <div className="bg-darkCard/80 hover:bg-darkCard transition-all border border-darkBorder rounded-xl p-3.5 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                atRiskInfraCount > 0 ? "bg-riskRed animate-ping" : "bg-safeGreen"
              }`}
            />
            Critical Infrastructure
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-2xl font-black tracking-tight ${
                atRiskInfraCount > 0 ? "text-red-400" : "text-emerald-400"
              }`}
            >
              {atRiskInfraCount}
            </span>
            <span className="text-xs text-slate-400">of {totalInfra || 0} at risk</span>
          </div>
          <div className="text-[11px] text-slate-400 font-medium">
            {atRiskInfraCount > 0
              ? `${atRiskInfraCount} facility cutoff warning`
              : `${totalInfra || 0} facilities accessible`}
          </div>
        </div>
        <div
          className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            atRiskInfraCount > 0
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
