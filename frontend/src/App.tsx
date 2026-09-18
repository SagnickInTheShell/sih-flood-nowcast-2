import { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import CitizenAlertView from "./components/CitizenAlertView";
import ExplainabilityPanel from "./components/ExplainabilityPanel";
import Header from "./components/Header";
import KpiStatsRow from "./components/KpiStatsRow";
import LayerControls from "./components/LayerControls";
import Legend from "./components/Legend";
import MapView from "./components/MapView";
import RoadStatusCard from "./components/RoadStatusCard";
import RouteComparisonPanel from "./components/RouteComparisonPanel";
import ScenarioSlider from "./components/ScenarioSlider";
import SidebarNav, { NavSection } from "./components/SidebarNav";
import UncertaintyPanel from "./components/UncertaintyPanel";
import { useFloodStore } from "./store/useFloodStore";

function Dashboard() {
  const loadInitial = useFloodStore((s) => s.loadInitial);
  const error = useFloodStore((s) => s.error);

  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [rightTab, setRightTab] = useState<"routing" | "scenario">("routing");

  const bottomSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function handleNavSelect(section: NavSection) {
    setActiveSection(section);
    if (section === "scenarios") {
      setRightTab("scenario");
    } else if (section === "routing") {
      setRightTab("routing");
    } else if (section === "uncertainty" || section === "explainability") {
      bottomSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="h-screen bg-darkBg text-slate-100 flex flex-col overflow-hidden select-none">
      {/* 1. Top Header */}
      <Header />

      {/* 2. Top KPI Stat Tiles Row (strictly real computed data) */}
      <KpiStatsRow />

      {/* Error alert toast */}
      {error && (
        <div className="bg-red-950/90 border-y border-red-500/50 text-red-200 text-xs px-5 py-2 flex items-center justify-between">
          <span>Simulation Notice: {error}</span>
          <button
            onClick={() => useFloodStore.setState({ error: null })}
            className="text-red-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Sidebar + Central Map + Right Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <SidebarNav activeSection={activeSection} onSelectSection={handleNavSelect} />

        {/* Center Map Area & Bottom Analytics Cards */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Central Map */}
          <div className="relative flex-1 min-h-[380px] bg-[#060d17] overflow-hidden border-b border-darkBorder">
            <MapView />

            {/* Floating Top Layer Toggles on Central Map */}
            <div className="absolute top-4 left-4 z-10">
              <LayerControls />
            </div>

            {/* Click-to-route hint badge */}
            <div className="absolute top-4 right-14 z-10 hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-darkSurface/80 backdrop-blur-md border border-darkBorder/60 text-[11px] text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Click map to route to vulnerable facility</span>
            </div>

            {/* Map Legend (Bottom-left of map) */}
            <Legend />
          </div>

          {/* 4. Bottom Row: Uncertainty, Explainability & Road Status Cards */}
          <div
            ref={bottomSectionRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-3.5 p-4 bg-darkSurface/95 border-t border-darkBorder"
          >
            <UncertaintyPanel />
            <ExplainabilityPanel />
            <RoadStatusCard />
          </div>

          {/* Footer */}
          <footer className="bg-darkBg px-5 py-2.5 border-t border-darkBorder/60 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-tealGlow">NIMBUS</span>
              <span className="text-slate-600">|</span>
              <span>Disaster Intelligence &middot; Smarter Routing &middot; Safer Communities</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-[10px]">SMART INDIA HACKATHON 2026</span>
              <span className="w-1.5 h-1.5 rounded-full bg-teal" />
              <span className="text-emerald-400 font-medium text-[10px]">GNN Live Engine</span>
            </div>
          </footer>
        </div>

        {/* 5. Right Panel: Emergency Routing & Scenario Controls */}
        <aside className="w-84 xl:w-96 flex-shrink-0 bg-darkSurface/95 border-l border-darkBorder flex flex-col overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-darkBorder bg-darkCard/40 p-1">
            <button
              onClick={() => setRightTab("routing")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "routing"
                  ? "bg-teal/20 text-tealGlow border border-teal/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Emergency Routing
            </button>
            <button
              onClick={() => setRightTab("scenario")}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "scenario"
                  ? "bg-teal/20 text-tealGlow border border-teal/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Scenario Controls
            </button>
          </div>

          {/* Panel Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {rightTab === "routing" ? (
              <RouteComparisonPanel />
            ) : (
              <ScenarioSlider />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/citizen" element={<CitizenAlertView />} />
    </Routes>
  );
}

