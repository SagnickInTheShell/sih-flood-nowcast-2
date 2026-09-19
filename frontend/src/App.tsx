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

  const [activeSection, setActiveSection] = useState<NavSection>("routing");
  const [rightTab, setRightTab] = useState<"routing" | "scenario" | "ml_intel">("routing");
  const [kpiCollapsed, setKpiCollapsed] = useState(false);
  const [analyticsCollapsed, setAnalyticsCollapsed] = useState(false);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  function handleNavSelect(section: NavSection) {
    setActiveSection(section);
    // Section IDs map directly to right-panel tabs
    if (section === "scenarios") setRightTab("scenario");
    else if (section === "ml_intel") setRightTab("ml_intel");
    else setRightTab("routing");
  }

  return (
    <div className="h-screen bg-[#061120] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* 1. Top Header */}
      <Header />

      {/* 2. Top KPI Stat Tiles Row — collapsible */}
      <KpiStatsRow isCollapsed={kpiCollapsed} onToggle={() => setKpiCollapsed((v) => !v)} />

      {/* Error alert toast */}
      {error && (
        <div className="bg-red-950/90 border-y border-red-500/50 text-red-200 text-xs px-5 py-2 flex items-center justify-between">
          <span>Notice: {error}</span>
          <button onClick={() => useFloodStore.setState({ error: null })} className="text-red-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* 3. Main Workspace */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <SidebarNav activeSection={activeSection} onSelectSection={handleNavSelect} />

        {/* Central Map & Bottom Analytics */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Map fills remaining space */}
          <div className="relative flex-1 min-h-0 bg-[#061120] overflow-hidden">
            <MapView />
          </div>

          {/* Bottom Analytics Row — collapsible */}
          <BottomAnalyticsRow
            isCollapsed={analyticsCollapsed}
            onToggle={() => setAnalyticsCollapsed((v) => !v)}
          />
        </div>

        {/* Right Panel: Emergency Routing & Scenario Simulator */}
        <aside className="w-80 xl:w-88 flex-shrink-0 bg-[#071326] border-l border-[#11263d] flex flex-col overflow-hidden">
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
