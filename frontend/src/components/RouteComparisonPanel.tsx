import { useFloodStore } from "../store/useFloodStore";

export default function RouteComparisonPanel() {
  const route = useFloodStore((s) => s.route);
  const criticalInfra = useFloodStore((s) => s.criticalInfra);
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const computeRoute = useFloodStore((s) => s.computeRoute);
  const loading = useFloodStore((s) => s.loading);

  const atRiskIds = new Set(simulateResult?.at_risk_infra_ids ?? []);
  const targetInfra =
    criticalInfra.find((i) => atRiskIds.has(i.infra_id)) ?? criticalInfra[0];

  // Quick dispatch helper targeting the vulnerable facility
  function handleQuickDispatch() {
    if (!targetInfra) return;
    // Compute from a standard anchor / ward entrance
    computeRoute(
      { lat: targetInfra.lat - 0.008, lng: targetInfra.lng - 0.008 },
      { lat: targetInfra.lat, lng: targetInfra.lng }
    );
  }

  const risk = route?.critical_access_risk;

  return (
    <div className="space-y-3.5">
      {/* Panel Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Emergency Routing
        </h2>
        {route ? (
          risk ? (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
              Cutoff Risk
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              Safe Route Available
            </span>
          )
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-slate-700">
            Standby
          </span>
        )}
      </div>

      {/* Critical Access Risk Alert Banner (integrated directly in panel) */}
      {risk && (
        <div className="bg-red-950/70 border border-red-500/60 rounded-xl p-3 text-white space-y-1.5 shadow-lg shadow-red-950/40">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <span className="text-base" aria-hidden="true">&#9888;</span>
            <span>Critical Access Risk</span>
          </div>
          <div className="text-xs font-semibold text-slate-100">{risk.infra_name}</div>
          <div className="text-[11px] text-red-200/90 leading-relaxed">
            {risk.message}
          </div>
          <div className="pt-1 text-[11px] font-semibold text-amber-300 flex items-center justify-between border-t border-red-900/60">
            <span>Access Redundancy Score:</span>
            <span className="bg-red-900 px-2 py-0.5 rounded text-white font-mono">
              {risk.access_redundancy_score}
            </span>
          </div>
        </div>
      )}

      {/* Destination & Origin Cards */}
      <div className="bg-darkCard/70 border border-darkBorder rounded-xl p-3 space-y-2.5">
        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-tealGlow mt-1 ring-2 ring-tealGlow/30" />
          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold text-slate-500">From</div>
            <div className="text-xs font-semibold text-slate-200">
              {route ? "Incident Origin (Map Pin)" : "Select origin on map"}
            </div>
          </div>
        </div>

        <div className="h-4 border-l-2 border-dashed border-darkBorder ml-1.5" />

        <div className="flex items-start gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 mt-1 ring-2 ring-amber-400/30" />
          <div className="flex-1">
            <div className="text-[10px] uppercase font-bold text-slate-500">To (Hospital / Facility)</div>
            <div className="text-xs font-semibold text-amber-300">
              {targetInfra?.name ?? "Nearest Emergency Hospital"}
            </div>
            {targetInfra && (
              <div className="text-[10px] text-slate-400 capitalize">
                {targetInfra.infra_type.replace(/_/g, " ")}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Route Computed Data */}
      {route ? (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-2.5">
              <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
                Flood-Aware ETA
              </div>
              <div className="text-lg font-black text-emerald-300 mt-0.5">
                {Math.round(route.eta_seconds)}s
              </div>
              <div className="text-[10px] text-emerald-400/80">
                {(route.eta_seconds / 60).toFixed(1)} min
              </div>
            </div>

            <div className="bg-darkCard/60 border border-darkBorder rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                Naive Baseline
              </div>
              <div className="text-lg font-black text-slate-300 mt-0.5">
                {Math.round(route.baseline_eta_seconds)}s
              </div>
              <div className="text-[10px] text-slate-400/80">
                {(route.baseline_eta_seconds / 60).toFixed(1)} min
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-darkCard/40 border border-darkBorder/60 rounded-lg p-2.5 leading-relaxed">
            {route.eta_seconds <= route.baseline_eta_seconds
              ? `${Math.abs(Math.round(route.eta_seconds - route.baseline_eta_seconds))}s faster than naive baseline route.`
              : `+${Math.round(route.eta_seconds - route.baseline_eta_seconds)}s detour trades transit time for flood safety.`}
          </div>

          {route.avoided_flooded_segments.length > 0 && (
            <div className="text-[11px] text-amber-300 font-medium bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Avoided {route.avoided_flooded_segments.length} flooded/at-risk road segment(s) on baseline path.
            </div>
          )}
        </div>
      ) : (
        <div className="p-3 bg-darkCard/40 border border-darkBorder rounded-xl text-center space-y-2">
          <p className="text-xs text-slate-400 leading-relaxed">
            Click anywhere on the map to compute a flood-aware emergency route to the ward's facility.
          </p>
          <button
            onClick={handleQuickDispatch}
            disabled={loading || !targetInfra}
            className="w-full py-2 px-3 rounded-lg bg-teal/20 hover:bg-teal/30 text-tealGlow border border-teal/40 hover:border-teal font-semibold text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Dispatch Test Emergency Route
          </button>
        </div>
      )}
    </div>
  );
}

