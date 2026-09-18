import { useFloodStore } from "../store/useFloodStore";

export default function RoadStatusCard() {
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const roadSegments = simulateResult?.road_segments ?? [];
  const total = roadSegments.length;

  const flooded = roadSegments.filter((r) => r.state === "flooded").length;
  const atRisk = roadSegments.filter((r) => r.state === "at_risk").length;
  const clear = roadSegments.filter((r) => r.state === "clear").length;

  // SVG Donut calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;

  const floodedPct = total > 0 ? flooded / total : 0;
  const atRiskPct = total > 0 ? atRisk / total : 0;
  const clearPct = total > 0 ? clear / total : 1;

  const floodedStroke = floodedPct * circumference;
  const atRiskStroke = atRiskPct * circumference;
  const clearStroke = clearPct * circumference;

  const atRiskOffset = -floodedStroke;
  const clearOffset = -(floodedStroke + atRiskStroke);

  return (
    <div className="bg-darkCard/80 border border-darkBorder rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tealGlow" />
          Network Road Status
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded bg-darkSurface text-slate-300 border border-darkBorder">
          Real Topology
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 py-1">
        {/* Donut Chart */}
        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background Ring */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#1E3A5F"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Clear (Green) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#10B981"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${clearStroke} ${circumference}`}
              strokeDashoffset={clearOffset}
            />
            {/* At Risk (Amber) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#F59E0B"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${atRiskStroke} ${circumference}`}
              strokeDashoffset={atRiskOffset}
            />
            {/* Flooded (Red) */}
            <circle
              cx="50"
              cy="50"
              r={radius}
              stroke="#EF4444"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${floodedStroke} ${circumference}`}
              strokeDashoffset={0}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-white">{total}</span>
            <span className="text-[9px] uppercase font-bold text-slate-500">Roads</span>
          </div>
        </div>

        {/* Legend / Metrics */}
        <div className="flex-1 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Flooded</span>
            </div>
            <div className="font-bold text-white">
              {flooded} <span className="text-[10px] text-slate-500 font-normal">({(floodedPct * 100).toFixed(0)}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>At Risk</span>
            </div>
            <div className="font-bold text-white">
              {atRisk} <span className="text-[10px] text-slate-500 font-normal">({(atRiskPct * 100).toFixed(0)}%)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Clear</span>
            </div>
            <div className="font-bold text-white">
              {clear} <span className="text-[10px] text-slate-500 font-normal">({(clearPct * 100).toFixed(0)}%)</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-slate-400 pt-1.5 border-t border-darkBorder/60 flex items-center justify-between">
        <span>GNN Hydraulic State Classification</span>
        <span className="text-tealGlow font-medium">Real-time</span>
      </div>
    </div>
  );
}
