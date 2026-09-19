import { useEffect, useRef, useState } from "react";
import { useFloodStore } from "../store/useFloodStore";

export default function ScenarioSlider() {
  const scenarios = useFloodStore((s) => s.scenarios);
  const selectedPresetId = useFloodStore((s) => s.selectedPresetId);
  const runScenario = useFloodStore((s) => s.runScenario);
  const runCustomRainfall = useFloodStore((s) => s.runCustomRainfall);
  const loading = useFloodStore((s) => s.loading);
  const currentRainfall = useFloodStore((s) => s.currentRainfall);
  const simulateResult = useFloodStore((s) => s.simulateResult);

  const [intensity, setIntensity] = useState(currentRainfall?.intensity ?? 60);
  const [duration, setDuration] = useState(currentRainfall?.duration ?? 90);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentRainfall) {
      setIntensity(currentRainfall.intensity);
      setDuration(currentRainfall.duration);
    }
  }, [currentRainfall]);

  const isCustom = selectedPresetId === null;

  const handleIntensityChange = (val: number) => {
    setIntensity(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      runCustomRainfall(val, duration);
    }, 450);
  };

  const handleDurationChange = (val: number) => {
    setDuration(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      runCustomRainfall(intensity, val);
    }, 450);
  };

  const handleApply = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    runCustomRainfall(intensity, duration);
  };

  // Metrics from simulation result
  const floodedCount = simulateResult?.road_segments?.filter((r) => r.state === "flooded").length ?? 0;
  const atRiskCount = simulateResult?.road_segments?.filter((r) => r.state === "at_risk").length ?? 0;
  const maxDepthM = simulateResult?.node_predictions?.length
    ? Math.max(...simulateResult.node_predictions.map((n) => n.depth_m_mean))
    : 0;
  const maxDepthCm = Math.round(maxDepthM * 100);

  return (
    <div className="space-y-3.5 select-none">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rainfall Scenarios</h2>
        {loading && (
          <div className="text-[11px] text-[#00e5ff] font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00e5ff] animate-ping" />
            Computing GNN...
          </div>
        )}
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 gap-2">
        {scenarios.map((s) => {
          const isActive = selectedPresetId === s.scenario_id;
          return (
            <button
              key={s.scenario_id}
              onClick={() => {
                setIntensity(s.rainfall_intensity_mm_hr);
                setDuration(s.duration_min);
                runScenario(s.scenario_id);
              }}
              aria-pressed={isActive}
              className={`text-left text-xs p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-[#0091ea]/20 text-white border-[#00b0ff] shadow-lg shadow-[#0091ea]/25"
                  : "bg-[#091b30] text-slate-300 border-[#143254] hover:border-[#00b0ff]/50 hover:bg-[#0c223c]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{s.label}</span>
                {isActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0091ea] text-white">
                    Active
                  </span>
                )}
              </div>
              <div className={`text-[11px] mt-1 ${isActive ? "text-[#00e5ff]" : "text-slate-400"}`}>
                {s.rainfall_intensity_mm_hr} mm/hr &middot; {s.duration_min} min storm
              </div>
            </button>
          );
        })}
      </div>

      {/* Live / Custom Rainfall Sliders */}
      <div
        className={`p-3.5 rounded-xl border transition-all space-y-3 ${
          isCustom
            ? "border-[#00b0ff]/60 bg-[#0091ea]/10 shadow-lg shadow-[#0091ea]/15"
            : "border-[#143254] bg-[#091b30]/80 hover:bg-[#091b30]"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Custom Storm Intensity</span>
          {isCustom && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#0091ea] text-white px-2 py-0.5 rounded-full">
              Custom Active
            </span>
          )}
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Rainfall Intensity</span>
            <span className="text-[#00e5ff] font-bold">{intensity} mm/hr</span>
          </div>
          <input
            type="range"
            min={5}
            max={150}
            step={5}
            value={intensity}
            onChange={(e) => handleIntensityChange(Number(e.target.value))}
            className="w-full accent-[#00e5ff] mt-1.5 h-1.5 bg-[#061424] rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Storm Duration</span>
            <span className="text-[#00e5ff] font-bold">{duration} min</span>
          </div>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={duration}
            onChange={(e) => handleDurationChange(Number(e.target.value))}
            className="w-full accent-[#00e5ff] mt-1.5 h-1.5 bg-[#061424] rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={handleApply}
          disabled={loading}
          className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-[#0091ea] to-[#00b0ff] hover:from-[#00b0ff] hover:to-[#40c4ff] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_12px_rgba(0,145,234,0.35)] transition-all cursor-pointer disabled:opacity-50"
        >
          <span>⚡</span>
          <span>{loading ? "Simulating Inundation..." : "Apply Storm Simulation"}</span>
        </button>
      </div>

      {/* Live Simulation Impact Card */}
      {simulateResult && (
        <div className="p-3 rounded-xl bg-[#091b30] border border-[#143254] space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span>Inundation & Risk Status</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
              GNN Output
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/40">
              <div className="text-base font-extrabold text-red-400">{floodedCount}</div>
              <div className="text-[10px] font-semibold text-slate-400">Flooded</div>
            </div>
            <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/40">
              <div className="text-base font-extrabold text-amber-400">{atRiskCount}</div>
              <div className="text-[10px] font-semibold text-slate-400">At-Risk</div>
            </div>
            <div className="p-2 rounded-lg bg-cyan-950/40 border border-[#00e5ff]/40">
              <div className="text-base font-extrabold text-[#00e5ff]">{maxDepthCm} cm</div>
              <div className="text-[10px] font-semibold text-slate-400">Peak Depth</div>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 text-center pt-0.5">
            Routes adapt automatically to avoid newly flooded corridors.
          </div>
        </div>
      )}
    </div>
  );
}
