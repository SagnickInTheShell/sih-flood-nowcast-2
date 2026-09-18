import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import BottomAnalyticsRow from "./components/BottomAnalyticsRow";
import CitizenAlertView from "./components/CitizenAlertView";
import ExplainabilityPanel from "./components/ExplainabilityPanel";
import Header from "./components/Header";
import KpiStatsRow from "./components/KpiStatsRow";
import MapView from "./components/MapView";
import RouteComparisonPanel from "./components/RouteComparisonPanel";
import ScenarioSlider from "./components/ScenarioSlider";
import SidebarNav, { NavSection } from "./components/SidebarNav";
import UncertaintyPanel from "./components/UncertaintyPanel";
import { useFloodStore } from "./store/useFloodStore";

function Dashboard() {
  const loadInitial = useFloodStore((s) => s.loadInitial);
  const error = useFloodStore((s) => s.error);

  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [rightTab, setRightTab] = useState<"routing" | "scenario" | "ml_intel">("routing");

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function handleNavSelect(section: NavSection) {
    setActiveSection(section);
    if (section === "scenarios") {
      setRightTab("scenario");
    } else if (section === "routing") {
      setRightTab("routing");
    } else if (section === "analytics" || section === "infrastructure") {
      setRightTab("ml_intel");
    } else {
      setRightTab("routing");
    }
  }

  return (
    <div className="h-screen bg-[#061120] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* 1. Top Header */}
      <Header />

      {/* 2. Top KPI Stat Tiles Row (4 reference tiles) */}
      <KpiStatsRow />

      {/* Error alert toast */}
      {error && (
        <div className="bg-red-950/90 border-y border-red-500/50 text-red-200 text-xs px-5 py-2 flex items-center justify-between">
          <span>Notice: {error}</span>
          <button
            onClick={() => useFloodStore.setState({ error: null })}
            className="text-red-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* 3. Main Workspace: Left Sidebar Nav + Central Map Area + Right Panel */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <SidebarNav activeSection={activeSection} onSelectSection={handleNavSelect} />

        {/* Central Map & Bottom Analytics */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Central Map (with top pill bar, layer checklist, callouts, compass) */}
          <div className="relative flex-1 min-h-[360px] bg-[#061120] overflow-hidden">
            <MapView />
          </div>

          {/* 4. Bottom Row (4 Cards matching reference) */}
          <BottomAnalyticsRow />

          {/* 5. Dashboard Footer Bar */}
          <footer className="bg-[#050e1a] px-5 py-2 border-t border-[#11263d] flex items-center justify-between text-xs text-slate-400 flex-wrap gap-3">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-[#00E5FF]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
              </svg>
              <span className="font-bold text-white tracking-wider">NIMBUS</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-300 text-[11px]">
                Urban Flood Nowcasting and Rerouting System
              </span>
            </div>

            <div className="flex items-center gap-5 text-[11px] text-slate-300 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span>📊</span>
                <span>Data-Driven Decisions</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>🛡️</span>
                <span>Resilient Communities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Faster Emergency Response</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span>🌱</span>
                <span>For a Safer Tomorrow</span>
              </div>
            </div>
          </footer>
        </div>

        {/* 6. Right Panel: Emergency Routing & Scenario Simulator */}
        <aside className="w-80 xl:w-92 flex-shrink-0 bg-[#071326] border-l border-[#11263d] flex flex-col overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b border-[#11263d] bg-[#09182b] p-1.5 gap-1">
            <button
              onClick={() => setRightTab("routing")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "routing"
                  ? "bg-[#0091ea] text-white shadow-[0_0_10px_rgba(0,145,234,0.4)] border border-[#40c4ff]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c223a]"
              }`}
            >
              <span>🧭</span>
              <span>Routing</span>
            </button>
            <button
              onClick={() => setRightTab("scenario")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "scenario"
                  ? "bg-[#0091ea] text-white shadow-[0_0_10px_rgba(0,145,234,0.4)] border border-[#40c4ff]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c223a]"
              }`}
            >
              <span>⚙️</span>
              <span>Scenarios</span>
            </button>
            <button
              onClick={() => setRightTab("ml_intel")}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                rightTab === "ml_intel"
                  ? "bg-[#0091ea] text-white shadow-[0_0_10px_rgba(0,145,234,0.4)] border border-[#40c4ff]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0c223a]"
              }`}
            >
              <span>🔬</span>
              <span>ML Intel</span>
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5">
            {rightTab === "routing" ? (
              <RouteComparisonPanel />
            ) : rightTab === "scenario" ? (
              <ScenarioSlider />
            ) : (
              <div className="space-y-3">
                <UncertaintyPanel />
                <ExplainabilityPanel />
              </div>
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
