import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function Header() {
  const [timeString, setTimeString] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12 || 12;
      setTimeString(`${day}, ${date} ${month} ${year} ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-[#071326]/95 backdrop-blur-md text-white px-5 py-2 border-b border-[#132d4b] flex items-center justify-between gap-3 z-30 shadow-lg select-none">
      {/* Left: Brand */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <svg className="w-8 h-8 text-[#00E5FF] drop-shadow-[0_0_10px_rgba(0,229,255,0.7)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
          </svg>
          <div>
            <div className="text-base font-black tracking-widest bg-gradient-to-r from-white via-[#E0F7FA] to-[#00E5FF] bg-clip-text text-transparent leading-tight">
              NIMBUS
            </div>
            <div className="text-[10px] text-[#00E5FF] font-medium tracking-wide leading-tight">
              Predict. Reroute. Save Lives.
            </div>
          </div>
        </div>

        <div className="hidden lg:block h-7 w-px bg-slate-700/60" />

        <div className="hidden md:block">
          <h1 className="text-[13px] font-bold text-slate-100 leading-snug">Urban Flood Nowcasting & Rerouting</h1>
          <p className="text-[11px] text-slate-400">Real-time flood intelligence · Bengaluru</p>
        </div>
      </div>

      {/* Right: Status controls */}
      <div className="flex items-center gap-2.5">
        {/* Live time */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d223a]/80 border border-[#183554] text-xs text-slate-300 font-mono">
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{timeString}</span>
        </div>

        {/* Live Data Badge */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#0a2730] border border-[#00e5ff]/30 text-xs text-slate-200">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FF88] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FF88]" />
          </span>
          <span className="font-semibold text-white">Live</span>
          <span className="hidden sm:inline text-slate-500">|</span>
          <span className="hidden sm:inline text-[11px] text-slate-300">IMD · NCMRWF · OSM</span>
        </div>

        {/* Citizen View */}
        <Link
          to="/citizen"
          className="hidden xl:inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-[#00E5FF] border border-[#00e5ff]/30 hover:border-[#00e5ff] transition-all font-medium"
        >
          👁 Citizen View
        </Link>
      </div>
    </header>
  );
}
