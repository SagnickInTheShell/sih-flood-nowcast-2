import React from "react";

export type NavSection = "routing" | "scenarios" | "ml_intel";

interface SidebarNavProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

const navItems: { id: NavSection; label: string; icon: JSX.Element }[] = [
  {
    id: "routing",
    label: "Emergency Routing",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  {
    id: "scenarios",
    label: "Scenario Simulator",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
  },
  {
    id: "ml_intel",
    label: "ML Intelligence",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
      </svg>
    ),
  },
];

export default function SidebarNav({ activeSection, onSelectSection }: SidebarNavProps) {
  return (
    <aside className="w-44 flex-shrink-0 bg-[#071326] border-r border-[#11263d] flex flex-col p-2.5 select-none">
      <nav className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#00b4d8]/20 to-[#0077b6]/30 text-white border border-[#00e5ff]/50 shadow-[0_0_12px_rgba(0,229,255,0.2)] font-semibold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#0d223a]/60 border border-transparent"
              }`}
            >
              <span className={isActive ? "text-[#00E5FF]" : "text-slate-500"}>
                {item.icon}
              </span>
              <span className="leading-snug text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
