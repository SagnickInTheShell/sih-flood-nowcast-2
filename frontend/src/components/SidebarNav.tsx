import React from "react";
import { Link } from "react-router-dom";
import { useFloodStore } from "../store/useFloodStore";

export type NavSection =
  | "dashboard"
  | "live_map"
  | "nowcast"
  | "flood_risk"
  | "routing"
  | "infrastructure"
  | "alerts"
  | "analytics"
  | "reports"
  | "scenarios"
  | "settings";

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export default function SidebarNav({ activeSection, onSelectSection }: SidebarNavProps) {
  const navItems: {
    id: NavSection;
    label: string;
    badge?: number;
    icon: JSX.Element;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "live_map",
      label: "Live Map",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      id: "nowcast",
      label: "Nowcast & Forecast",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h10a4 4 0 001.5-7.7A5 5 0 008.2 8 4 4 0 003 15z" />
        </svg>
      ),
    },
    {
      id: "flood_risk",
      label: "Flood Risk",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      id: "routing",
      label: "Emergency Routing",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
    },
    {
      id: "infrastructure",
      label: "Infrastructure",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      id: "alerts",
      label: "Alerts",
      badge: 5,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
    {
      id: "analytics",
      label: "Data Analytics",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      id: "reports",
      label: "Reports",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: "scenarios",
      label: "Scenario Simulator",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-56 flex-shrink-0 bg-[#071326] border-r border-[#11263d] flex flex-col justify-between p-3 select-none">
      {/* Navigation Links */}
      <div className="space-y-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#00b4d8]/20 to-[#0077b6]/30 text-white border border-[#00e5ff]/50 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0d223a]/60 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? "text-[#00E5FF]" : "text-slate-400"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Skyline Illustration & Team Card */}
      <div className="pt-3 border-t border-[#11263d]/80 space-y-3">
        {/* City Skyline SVG Silhouette */}
        <div className="px-2 opacity-50">
          <svg className="w-full h-9 text-[#00b4d8]" viewBox="0 0 200 40" fill="currentColor">
            <path d="M 0 40 L 0 32 L 10 32 L 10 24 L 22 24 L 22 18 L 30 18 L 30 28 L 42 28 L 42 12 L 52 12 L 52 35 L 68 35 L 68 15 L 75 15 L 75 26 L 85 26 L 85 8 L 98 8 L 98 32 L 115 32 L 115 20 L 125 20 L 125 36 L 140 36 L 140 14 L 150 14 L 150 25 L 165 25 L 165 10 L 175 10 L 175 30 L 190 30 L 190 22 L 200 22 L 200 40 Z" />
            <path d="M 25 38 Q 60 22 95 38 Q 130 22 165 38 Q 185 28 200 38" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
          <div className="text-[11px] font-semibold italic text-slate-400 text-center tracking-wide mt-1">
            "Safer Cities Stronger Tomorrows."
          </div>
        </div>

        {/* Expecto Patronum Team Card */}
        <div className="p-2.5 rounded-xl bg-[#0c1f36] border border-[#173454] flex items-center gap-2.5 shadow-inner">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00b4d8] to-[#0077b6] flex items-center justify-center text-white text-xs font-bold shadow-sm">
            👥
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-white leading-tight">Expecto Patronum</div>
            <div className="text-[9.5px] text-slate-400 font-mono leading-tight">Team ID: SIH26085</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
