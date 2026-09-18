import { useState } from "react";
import { useFloodStore } from "../store/useFloodStore";

export default function ScenarioSlider() {
  const scenarios = useFloodStore((s) => s.scenarios);
  const selectedPresetId = useFloodStore((s) => s.selectedPresetId);
  const runScenario = useFloodStore((s) => s.runScenario);
  const runCustomRainfall = useFloodStore((s) => s.runCustomRainfall);
  const loading = useFloodStore((s) => s.loading);
  const currentRainfall = useFloodStore((s) => s.currentRainfall);

  const [intensity, setIntensity] = useState(currentRainfall?.intensity ?? 60);
  const [duration, setDuration] = useState(currentRainfall?.duration ?? 90);
  const isCustom = selectedPresetId === null;

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Simulation Scenario</h2>
        {loading && (
          <div className="text-[11px] text-tealGlow font-medium flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-tealGlow animate-ping" />
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
              className={`text-left text-xs p-3 rounded-xl border transition-all ${
                isActive
                  ? "bg-teal/20 text-white border-teal shadow-lg shadow-teal/20"
                  : "bg-darkCard/70 text-slate-300 border-darkBorder hover:border-teal/50 hover:bg-darkCard"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{s.label}</span>
                {isActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal text-white">
                    Active
                  </span>
                )}
              </div>
              <div className={`text-[11px] mt-1 ${isActive ? "text-tealGlow" : "text-slate-400"}`}>
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
            ? "border-teal/50 bg-teal/10 shadow-lg shadow-teal/10"
            : "border-darkBorder bg-darkCard/40 hover:bg-darkCard/60"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live / Custom Storm</span>
          {isCustom && (
            <span className="text-[10px] font-bold uppercase tracking-wider bg-teal text-white px-2 py-0.5 rounded-full">
              Live Slider
            </span>
          )}
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Rainfall Intensity</span>
            <span className="text-tealGlow font-bold">{intensity} mm/hr</span>
          </div>
          <input
            type="range"
            min={5}
            max={150}
            step={5}
            value={intensity}
            onChange={(e) => setIntensity(Number(e.target.value))}
            onMouseUp={() => runCustomRainfall(intensity, duration)}
            onTouchEnd={() => runCustomRainfall(intensity, duration)}
            className="w-full accent-teal mt-1.5 h-1.5 bg-darkSurface rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Storm Duration</span>
            <span className="text-tealGlow font-bold">{duration} min</span>
          </div>
          <input
            type="range"
            min={15}
            max={180}
            step={15}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            onMouseUp={() => runCustomRainfall(intensity, duration)}
            onTouchEnd={() => runCustomRainfall(intensity, duration)}
            className="w-full accent-teal mt-1.5 h-1.5 bg-darkSurface rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}

