import { useFloodStore } from "../store/useFloodStore";

const LAYERS: { key: "roads" | "floodDepth" | "uncertainty" | "infra" | "route"; label: string; shortLabel: string }[] = [
  { key: "roads", label: "Road Flood State", shortLabel: "Roads" },
  { key: "floodDepth", label: "Flood Depth Heatmap", shortLabel: "Flood Heatmap" },
  { key: "uncertainty", label: "Uncertainty Halo", shortLabel: "Uncertainty" },
  { key: "infra", label: "Critical Infrastructure", shortLabel: "Facilities" },
  { key: "route", label: "Emergency Route", shortLabel: "Route" },
];

export default function LayerControls() {
  const layerVisibility = useFloodStore((s) => s.layerVisibility);
  const toggleLayer = useFloodStore((s) => s.toggleLayer);

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-darkSurface/85 backdrop-blur-md border border-darkBorder shadow-lg shadow-black/40">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 select-none">
        Layers:
      </span>
      {LAYERS.map((l) => {
        const isVisible = layerVisibility[l.key];
        return (
          <button
            key={l.key}
            onClick={() => toggleLayer(l.key)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 select-none ${
              isVisible
                ? "bg-teal/20 text-tealGlow border border-teal/50 shadow-sm shadow-teal/20 font-semibold"
                : "bg-darkCard/60 text-slate-400 hover:text-slate-200 border border-darkBorder/40 hover:bg-darkCard"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                isVisible ? "bg-tealGlow shadow-[0_0_6px_#00D2E0]" : "bg-slate-600"
              }`}
            />
            {l.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

