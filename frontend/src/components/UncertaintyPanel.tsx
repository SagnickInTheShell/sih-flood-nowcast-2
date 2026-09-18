import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useFloodStore } from "../store/useFloodStore";

export default function UncertaintyPanel() {
  const simulateResult = useFloodStore((s) => s.simulateResult);
  const selectedNodeId = useFloodStore((s) => s.selectedNodeId);

  if (!simulateResult || simulateResult.node_predictions.length === 0) return null;

  const node =
    simulateResult.node_predictions.find((n) => n.node_id === selectedNodeId) ??
    simulateResult.node_predictions.reduce((max, n) => (n.depth_m_mean > max.depth_m_mean ? n : max));

  const data = [
    { label: "-1σ", depth: Number(Math.max(node.depth_m_mean - node.depth_m_std, 0).toFixed(3)) },
    { label: "Mean", depth: Number(node.depth_m_mean.toFixed(3)) },
    { label: "+1σ", depth: Number((node.depth_m_mean + node.depth_m_std).toFixed(3)) },
  ];

  return (
    <div className="bg-darkCard/80 border border-darkBorder rounded-xl p-4 flex flex-col justify-between shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-tealGlow" />
          Uncertainty Distribution &middot; Node {node.node_id}
        </h2>
        <span className="text-[10px] px-2 py-0.5 rounded bg-teal/10 text-tealGlow border border-teal/30">
          GNN ±1σ
        </span>
      </div>

      <div style={{ width: "100%", height: 110 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="uncertaintyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D2E0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#00A8B5" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#1E3A5F" />
            <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} stroke="#1E3A5F" unit="m" width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0B1A2F",
                borderColor: "#1E3A5F",
                borderRadius: "8px",
                fontSize: "11px",
                color: "#F1F5F9",
              }}
              formatter={(v: number) => [`${v.toFixed(3)} m`, "Water Depth"]}
            />
            <Area
              type="monotone"
              dataKey="depth"
              stroke="#00D2E0"
              strokeWidth={2}
              fill="url(#uncertaintyGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-400 italic leading-relaxed border-t border-darkBorder/60 pt-2 mt-2">
        {simulateResult.model_caveat}
      </p>
    </div>
  );
}

