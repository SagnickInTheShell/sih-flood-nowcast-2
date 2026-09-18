import { stateColor, stateLabel } from "../theme";

export default function Legend() {
  return (
    <div className="absolute bottom-4 left-4 bg-darkSurface/90 backdrop-blur-md rounded-xl shadow-2xl border border-darkBorder px-3.5 py-3 text-xs space-y-2 z-10 select-none">
      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] flex items-center justify-between gap-3">
        <span>Map Legend</span>
        <span className="w-1.5 h-1.5 rounded-full bg-tealGlow" />
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Road States</div>
        {Object.entries(stateColor).map(([key, [r, g, b]]) => (
          <div key={key} className="flex items-center gap-2 text-slate-300">
            <span
              className="inline-block w-3 h-3 rounded-full ring-1 ring-white/10 shadow-sm"
              style={{ backgroundColor: `rgb(${r},${g},${b})` }}
            />
            <span className="text-xs">{stateLabel[key]}</span>
          </div>
        ))}
      </div>

      <div className="pt-2 border-t border-darkBorder/60 space-y-1.5 text-slate-300">
        <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Key Markers</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-gold ring-1 ring-amber-400/40 shadow-sm shadow-gold/20" />
          <span className="text-xs">Critical Infrastructure</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-1 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/20" />
          <span className="text-xs">Flood-Aware Safe Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-4 h-1 rounded-full bg-slate-400 opacity-60" />
          <span className="text-xs">Naive Baseline Route</span>
        </div>
      </div>
    </div>
  );
}

