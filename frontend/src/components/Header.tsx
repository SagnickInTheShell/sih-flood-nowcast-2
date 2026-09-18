import { Link } from "react-router-dom";
import { useFloodStore } from "../store/useFloodStore";
import SyntheticDataBadge from "./SyntheticDataBadge";

export default function Header() {
  const isSynthetic = useFloodStore((s) => s.simulateResult?.is_synthetic_ward ?? true);

  return (
    <header className="bg-darkSurface/90 backdrop-blur-md text-white px-5 py-3 border-b border-darkBorder flex items-center justify-between flex-wrap gap-4 relative z-20">
      <div className="flex items-center gap-3.5">
        {/* Nimbus Brand Icon */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal/20 via-navySoft to-darkCard border border-teal/40 flex items-center justify-center shadow-lg shadow-teal/10">
          <svg className="w-6 h-6 text-tealGlow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h10a4 4 0 001.5-7.7A5 5 0 008.2 8 4 4 0 003 15z"
            />
          </svg>
        </div>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span className="text-tealGlow tracking-wider">NIMBUS</span>
              <span className="text-white/40 font-normal">|</span>
              <span className="text-slate-200 text-sm md:text-base font-medium">
                Urban Flood Nowcasting and Rerouting System
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs">
            <span className="text-teal font-medium tracking-wide">Predict. Reroute. Save Lives.</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400 text-[11px]">
              Team Expecto Patronum &middot; SIH26085
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SyntheticDataBadge isSynthetic={isSynthetic} />

        <Link
          to="/citizen"
          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-teal/10 hover:bg-teal/20 text-tealGlow border border-teal/30 hover:border-teal transition-all font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Citizen View
        </Link>
      </div>
    </header>
  );
}

