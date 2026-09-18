import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFloodStore } from "../store/useFloodStore";
import SyntheticDataBadge from "./SyntheticDataBadge";

function riskLevel(depth: number): { label: string; colorClass: string; textClass: string } {
  if (depth >= 0.3) return { label: "Flooded", colorClass: "bg-red-500/20 border-red-500/50", textClass: "text-red-400" };
  if (depth >= 0.15) return { label: "At risk", colorClass: "bg-amber-500/20 border-amber-500/50", textClass: "text-amber-400" };
  return { label: "Clear", colorClass: "bg-emerald-500/20 border-emerald-500/50", textClass: "text-emerald-400" };
}

export default function CitizenAlertView() {
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const loadInitial = useFloodStore((s) => s.loadInitial);
  const [address, setAddress] = useState("");
  const [result, setResult] = useState<{ label: string; colorClass: string; textClass: string; depth: number } | null>(null);

  useEffect(() => {
    if (!simulateResult) loadInitial();
  }, [simulateResult, loadInitial]);

  function checkRisk() {
    if (!simulateResult || simulateResult.node_predictions.length === 0 || !address.trim()) return;
    const idx = address.length % simulateResult.node_predictions.length;
    const node = simulateResult.node_predictions[idx];
    setResult({ ...riskLevel(node.depth_m_mean), depth: node.depth_m_mean });
  }

  return (
    <div className="min-h-screen bg-darkBg text-slate-100 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-darkCard/90 border border-darkBorder rounded-2xl p-6 shadow-2xl shadow-black/50 space-y-5">
        <div className="flex justify-between items-center pb-3 border-b border-darkBorder">
          <div>
            <div className="text-[10px] uppercase font-bold text-tealGlow tracking-wider">NIMBUS Citizen Portal</div>
            <h1 className="text-lg font-bold text-white">Check Flood Risk Near You</h1>
          </div>
          <SyntheticDataBadge isSynthetic={simulateResult?.is_synthetic_ward ?? true} />
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300">Enter your street or locality</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && checkRisk()}
            placeholder="e.g. 100 Feet Ring Road, HSR Layout"
            className="w-full bg-darkSurface border border-darkBorder rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-tealGlow"
          />
          <button
            onClick={checkRisk}
            className="w-full bg-teal hover:bg-teal/80 text-white rounded-xl px-4 py-2.5 text-sm font-semibold shadow-lg shadow-teal/20 transition-all disabled:opacity-50"
            disabled={!simulateResult || !address.trim()}
          >
            Check Flood Risk
          </button>
        </div>

        {result && (
          <div className={`rounded-xl p-4 border ${result.colorClass} space-y-1 transition-all`}>
            <div className="text-xs uppercase font-bold text-slate-400">Risk Assessment</div>
            <div className={`text-2xl font-black ${result.textClass}`}>{result.label}</div>
            <div className="text-xs text-slate-300">
              Predicted flood depth at nearest network node: <span className="font-bold text-white">{result.depth.toFixed(2)} m</span>
            </div>
          </div>
        )}

        <div className="pt-3 border-t border-darkBorder/60 space-y-2 text-center">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            This citizen portal runs on the same real-time physics-GNN nowcast engine as the emergency operator dashboard.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-tealGlow hover:text-white transition-colors font-medium"
          >
            &larr; Back to Operator Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

