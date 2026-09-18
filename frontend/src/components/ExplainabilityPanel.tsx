import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../api/client";
import { useFloodStore } from "../store/useFloodStore";

const FACTOR_LABEL: Record<string, string> = {
  rainfall_intensity: "Rainfall Intensity",
  local_slope: "Local Slope",
  drainage_capacity: "Drain Capacity",
};

export default function ExplainabilityPanel() {
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const selectedNodeId = useFloodStore((s) => s.selectedNodeId);
  const [factors, setFactors] = useState<{ factor: string; depth_delta_m: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nodeId =
    selectedNodeId ??
    simulateResult?.node_predictions.reduce((max, n) => (n.depth_m_mean > max.depth_m_mean ? n : max), simulateResult.node_predictions[0])
      ?.node_id;

  useEffect(() => {
    if (!nodeId || !simulateResult) return;
    setError(null);
    api
      .explain(nodeId, 60, 90)
      .then((res) => setFactors(res.factors))
      .catch((e) => setError((e as Error).message));
  }, [nodeId, simulateResult]);

  if (!simulateResult) return null;

  return (
    <div className="bg-darkCard/80 border border-darkBorder rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tealGlow" />
          Explainability Ablation &middot; Node {nodeId}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded bg-teal/10 text-tealGlow border border-teal/30">
          Physics Baseline
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
        Factor ablation: each variable held at network median to isolate flood contribution.
      </p>

      {error && <div className="text-xs text-red-400 p-2 bg-red-950/40 rounded-lg">{error}</div>}

      {factors && (
        <div style={{ width: "100%", height: 110 }}>
          <ResponsiveContainer>
            <BarChart
              data={factors.map((f) => ({ ...f, label: FACTOR_LABEL[f.factor] ?? f.factor }))}
              layout="vertical"
              margin={{ top: 4, right: 12, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E3A5F" opacity={0.5} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#1E3A5F" unit="m" />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#1E3A5F" width={90} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0B1A2F",
                  borderColor: "#1E3A5F",
                  borderRadius: "8px",
                  fontSize: "11px",
                  color: "#F1F5F9",
                }}
                formatter={(v: number) => [`${v.toFixed(3)} m`, "Depth Delta"]}
              />
              <Bar dataKey="depth_delta_m" fill="#00A8B5" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

