import React, { useEffect, useRef, useState } from "react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, PathLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useFloodStore, VehicleType } from "../store/useFloodStore";
import { stateColor } from "../theme";

const ANCHOR = { lat: 12.9280, lng: 77.6700 }; // Bellandur center
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const hasCenteredRef = useRef(false);

  const simulateResult = useFloodStore((s) => s.simulateResult);
  const criticalInfra = useFloodStore((s) => s.criticalInfra);
  const route = useFloodStore((s) => s.route);
  const selectedRouteId = useFloodStore((s) => s.selectedRouteId);
  const vehicleType = useFloodStore((s) => s.vehicleType);
  const layerVisibility = useFloodStore((s) => s.layerVisibility);
  const toggleLayer = useFloodStore((s) => s.toggleLayer);
  const activeMapPill = useFloodStore((s) => s.activeMapPill);
  const setActiveMapPill = useFloodStore((s) => s.setActiveMapPill);
  const searchQuery = useFloodStore((s) => s.searchQuery);
  const setSearchQuery = useFloodStore((s) => s.setSearchQuery);
  const computeRoute = useFloodStore((s) => s.computeRoute);

  const [layersOpen, setLayersOpen] = useState(true);

  // Map Filter Pills
  const mapPills = [
    "Live Map",
    "Rainfall",
    "Flood Risk",
    "Road Status",
    "Drainage Network",
    "Facilities",
    "Forecast (0-3h)",
  ];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [ANCHOR.lng, ANCHOR.lat],
      zoom: 13.8,
      attributionControl: false,
    });

    const overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);
    mapRef.current = map;
    overlayRef.current = overlay;

    map.on("click", (e) => {
      const state = useFloodStore.getState();
      const atRiskIds = new Set(state.simulateResult?.at_risk_infra_ids ?? []);
      const infra = state.criticalInfra.find((i) => atRiskIds.has(i.infra_id)) ?? state.criticalInfra[0];
      if (infra) {
        computeRoute({ lat: e.lngLat.lat, lng: e.lngLat.lng }, { lat: infra.lat, lng: infra.lng });
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Center on real ward bounds
  useEffect(() => {
    if (hasCenteredRef.current || !mapRef.current || criticalInfra.length === 0) return;
    const avgLat = criticalInfra.reduce((sum, i) => sum + i.lat, 0) / criticalInfra.length;
    const avgLng = criticalInfra.reduce((sum, i) => sum + i.lng, 0) / criticalInfra.length;
    mapRef.current.jumpTo({ center: [avgLng, avgLat], zoom: 13.8 });
    hasCenteredRef.current = true;
  }, [criticalInfra]);

  // Deck.gl dynamic rendering layers
  useEffect(() => {
    if (!overlayRef.current) return;
    const layers: any[] = [];

    // 1. Road Network Layer
    if (simulateResult && layerVisibility.roads) {
      layers.push(
        new GeoJsonLayer({
          id: "road-segments",
          data: {
            type: "FeatureCollection",
            features: simulateResult.road_segments.map((seg) => ({
              type: "Feature",
              properties: { edge_id: seg.edge_id, state: seg.state },
              geometry: seg.geometry,
            })),
          },
          getLineColor: (f: any) => [...(stateColor[f.properties.state] ?? stateColor.clear), 255],
          getLineWidth: (f: any) => (f.properties.state === "flooded" ? 7 : 4),
          widthUnits: "pixels",
          lineWidthMinPixels: 3.5,
          capRounded: true,
          jointRounded: true,
          pickable: true,
        })
      );
    }

    // 2. Flood Heatmap Layer
    if (simulateResult && layerVisibility.floodDepth) {
      layers.push(
        new HeatmapLayer({
          id: "flood-depth-heatmap",
          data: simulateResult.node_predictions,
          getPosition: (d: any) => [d.lng, d.lat],
          getWeight: (d: any) => Math.max(d.depth_m_mean, 0.05),
          radiusPixels: 65,
          intensity: 1.4,
          threshold: 0.02,
          aggregation: "SUM",
          colorRange: [
            [0, 150, 255, 0],
            [0, 229, 255, 80],
            [255, 230, 0, 140],
            [255, 120, 0, 190],
            [255, 20, 20, 230],
          ],
        })
      );
    }

    // 3. Drainage Network
    if (simulateResult && layerVisibility.drainage) {
      layers.push(
        new GeoJsonLayer({
          id: "drainage-lines",
          data: {
            type: "FeatureCollection",
            features: simulateResult.node_predictions.slice(0, 120).map((n, idx) => ({
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [n.lng, n.lat],
                  [n.lng + (idx % 2 === 0 ? 0.003 : -0.003), n.lat - 0.002],
                ],
              },
            })),
          },
          getLineColor: [0, 229, 255, 170], // Neon cyan drainage
          getLineWidth: 2,
          widthUnits: "pixels",
        })
      );
    }

    // 4. Critical Facilities Layer
    if (layerVisibility.infra && criticalInfra.length > 0) {
      layers.push(
        new GeoJsonLayer({
          id: "critical-infra",
          data: {
            type: "FeatureCollection",
            features: criticalInfra.map((i) => ({
              type: "Feature",
              properties: { name: i.name, infra_type: i.infra_type },
              geometry: { type: "Point", coordinates: [i.lng, i.lat] },
            })),
          },
          pointType: "circle",
          getFillColor: (f: any) =>
            f.properties.infra_type === "hospital" ? [0, 200, 255, 255] : [245, 158, 11, 255],
          getLineColor: [255, 255, 255, 255],
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          getPointRadius: 10,
          pointRadiusUnits: "pixels",
          pickable: true,
        })
      );
    }

    // 5. Emergency Routes (Active, Baseline & Alternate)
    if (route && layerVisibility.route) {
      // Baseline / Shortest in red or muted slate
      if (route.baseline_route_geometry?.coordinates?.length) {
        layers.push(
          new PathLayer({
            id: "baseline-route-path",
            data: [{ path: route.baseline_route_geometry.coordinates }],
            getPath: (d: any) => d.path,
            getColor: selectedRouteId === "shortest" ? [239, 68, 68, 255] : [100, 116, 139, 140],
            getWidth: selectedRouteId === "shortest" ? 7 : 4,
            widthMinPixels: 4,
            capRounded: true,
          })
        );
      }

      // Safe / Recommended route in glowing neon green
      if (route.route_geometry?.coordinates?.length) {
        layers.push(
          new PathLayer({
            id: "recommended-route-path",
            data: [{ path: route.route_geometry.coordinates }],
            getPath: (d: any) => d.path,
            getColor:
              selectedRouteId === "recommended"
                ? [0, 255, 136, 255]
                : [16, 185, 129, 160], // Emerald glow
            getWidth: selectedRouteId === "recommended" ? 7.5 : 4.5,
            widthMinPixels: 5,
            capRounded: true,
          })
        );
      }
    }

    overlayRef.current.setProps({ layers });
  }, [simulateResult, criticalInfra, route, selectedRouteId, layerVisibility]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#061120]">
      {/* MapLibre Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* 1. Top Pill Navigation & Search Bar */}
      <div className="absolute top-3 inset-x-4 z-20 flex items-center justify-between gap-3 pointer-events-none">
        {/* Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] shadow-lg pointer-events-auto overflow-x-auto">
          {mapPills.map((pill) => {
            const isActive = activeMapPill === pill;
            return (
              <button
                key={pill}
                onClick={() => setActiveMapPill(pill)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[#0091ea] text-white shadow-[0_0_10px_rgba(0,145,234,0.5)] border border-[#40c4ff]"
                    : "text-slate-300 hover:text-white hover:bg-[#0c233d]"
                }`}
              >
                {pill}
              </button>
            );
          })}
        </div>

        {/* Search Input & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] shadow-lg text-xs text-slate-300 w-64">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search location, hospital, or area..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent focus:outline-none w-full text-slate-100 placeholder-slate-500 text-xs"
            />
          </div>

          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen();
              } else {
                containerRef.current?.parentElement?.requestFullscreen();
              }
            }}
            title="Toggle Fullscreen"
            className="w-8 h-8 rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] text-slate-300 hover:text-white flex items-center justify-center transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>

      {/* 2. Floating Map Layers & Legend Panel (Top Left) */}
      <div className="absolute top-16 left-4 z-20 w-48 rounded-xl bg-[#071526]/95 backdrop-blur-md border border-[#142e4c] p-3 shadow-xl select-none">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#142e4c]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Map Layers
          </span>
          <button
            onClick={() => setLayersOpen(!layersOpen)}
            className="text-slate-400 hover:text-white text-xs"
          >
            {layersOpen ? "−" : "+"}
          </button>
        </div>

        {layersOpen && (
          <>
            {/* Checklist */}
            <div className="space-y-1.5 mt-2 text-[11px]">
              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.roads}
                  onChange={() => toggleLayer("roads")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Road Network</span>
              </label>

              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.floodDepth}
                  onChange={() => toggleLayer("floodDepth")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Flood Heatmap</span>
              </label>

              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.drainage}
                  onChange={() => toggleLayer("drainage")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Drainage Network</span>
              </label>

              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.rainfallNowcast}
                  onChange={() => toggleLayer("rainfallNowcast")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Rainfall (Nowcast)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.infra}
                  onChange={() => toggleLayer("infra")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Critical Facilities</span>
              </label>

              <label className="flex items-center gap-2 text-slate-200 hover:text-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.liveVehicles}
                  onChange={() => toggleLayer("liveVehicles")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Live Vehicles</span>
              </label>

              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.forecast}
                  onChange={() => toggleLayer("forecast")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Forecast (0–3h)</span>
              </label>

              <label className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={layerVisibility.uncertainty}
                  onChange={() => toggleLayer("uncertainty")}
                  className="rounded bg-[#0c1f36] border-slate-600 text-[#0091ea] focus:ring-0"
                />
                <span>Uncertainty Layer</span>
              </label>
            </div>

            {/* Legend Section */}
            <div className="pt-2 mt-2 border-t border-[#142e4c]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Legend
              </div>
              <div className="space-y-1.5 text-[10.5px]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 rounded-xs bg-[#EF4444]" />
                  <span className="text-slate-300">Flooded Road</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 rounded-xs bg-[#F59E0B]" />
                  <span className="text-slate-300">At Risk Road</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 rounded-xs bg-[#00FF88]" />
                  <span className="text-slate-300">Safe Road</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-1 rounded-xs bg-[#00E5FF]" />
                  <span className="text-slate-300">Drainage Network</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#0091ea] text-white text-[9px] font-bold flex items-center justify-center">
                    H
                  </span>
                  <span className="text-slate-300">Hospital</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs">🚑</span>
                  <span className="text-slate-300">Emergency Vehicle</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-xs">⚠️</span>
                  <span className="text-slate-300">Critical Zone</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Floating Map Callout Annotations */}
      {/* Callout 1: Origin "Your Location | HSR Layout" */}
      <div className="absolute top-[68%] left-[42%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-2.5 py-1 rounded-lg bg-[#07182c]/95 border border-[#0091ea] text-white text-[11px] font-semibold shadow-[0_0_15px_rgba(0,145,234,0.4)] flex items-center gap-1.5 mb-1">
          <span className="w-2 h-2 rounded-full bg-[#0091ea] animate-ping" />
          <span>Your Location</span>
          <span className="text-slate-400 font-normal">HSR Layout</span>
        </div>
        <div className="w-3.5 h-3.5 rounded-full bg-[#0091ea] ring-4 ring-[#0091ea]/30 shadow-lg" />
      </div>

      {/* Callout 2: Moving Live Ambulance on Route */}
      {layerVisibility.liveVehicles && (
        <div className="absolute top-[58%] left-[48%] z-20 pointer-events-none animate-bounce flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0a2744] border border-[#00e5ff]/50 shadow-md">
          <span className="text-sm">🚑</span>
          <span className="text-[9px] text-cyan-200 font-bold uppercase tracking-wider">
            {vehicleType}
          </span>
        </div>
      )}

      {/* Callout 3: Road Flooded Hazard Box near Bellandur ORR */}
      <div className="absolute top-[52%] left-[62%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-3 py-1.5 rounded-xl bg-red-950/95 border border-red-500 text-white text-[11px] font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-center gap-2 mb-1">
          <span className="text-sm">⚠️</span>
          <div>
            <div className="leading-tight text-red-200">Road Flooded</div>
            <div className="text-[10px] text-red-400 font-mono font-normal leading-tight">
              Water level ~ 45 cm
            </div>
          </div>
        </div>
        <div className="w-2.5 h-2.5 bg-red-500 rotate-45 -mt-2" />
      </div>

      {/* Callout 4: Destination "Manipal Hospital" */}
      <div className="absolute top-[34%] left-[60%] -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center">
        <div className="px-3 py-1.5 rounded-xl bg-emerald-950/95 border border-[#00FF88] text-white text-[11px] font-bold shadow-[0_0_15px_rgba(0,255,136,0.4)] flex items-center gap-2 mb-1">
          <span className="text-base">🏥</span>
          <div>
            <div className="leading-tight text-white">Manipal Hospital</div>
            <div className="text-[10px] text-emerald-300 font-mono font-normal leading-tight">
              12.4 km &bull; 28 min
            </div>
          </div>
        </div>
        <div className="w-3 h-3 rounded-full bg-[#00FF88] ring-4 ring-[#00FF88]/30 shadow-lg" />
      </div>

      {/* Area Label Hotspots on Map */}
      <div className="absolute top-[28%] left-[38%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        ⚠️ Yelahanka
      </div>
      <div className="absolute top-[38%] left-[44%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        Hebbal
      </div>
      <div className="absolute top-[44%] left-[35%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        ⚠️ Peenya
      </div>
      <div className="absolute top-[50%] left-[46%] text-sm font-black text-white pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        Bengaluru
      </div>
      <div className="absolute top-[58%] left-[39%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        Koramangala
      </div>
      <div className="absolute top-[57%] left-[58%] text-[11px] font-bold text-red-300 pointer-events-none drop-shadow">
        ⚠️ Bellandur
      </div>
      <div className="absolute top-[44%] left-[54%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        Marathahalli
      </div>
      <div className="absolute top-[46%] left-[68%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        Whitefield
      </div>
      <div className="absolute top-[68%] left-[57%] text-[11px] font-bold text-slate-300/90 pointer-events-none drop-shadow">
        Electronic City
      </div>

      {/* 4. Bottom Right Overlays: Compass, Gradient Bar & Scale */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto select-none">
        {/* Real-time Flood Risk Gradient Color Bar */}
        <div className="p-2.5 rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] shadow-xl text-left w-52">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="font-bold text-white">Real-time Flood Risk</span>
            <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider">
              High
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 via-yellow-400 via-orange-500 to-red-600 shadow-inner" />
          <div className="flex justify-between text-[9.5px] text-slate-400 font-semibold mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Compass Rose */}
        <div className="w-9 h-9 rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] flex flex-col items-center justify-center text-slate-200 shadow-lg cursor-pointer hover:border-[#00e5ff]/50">
          <span className="text-[9px] font-black text-red-400 leading-none">▲</span>
          <span className="text-[11px] font-black leading-none">N</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col rounded-xl bg-[#071526]/90 backdrop-blur-md border border-[#142e4c] shadow-lg overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#0f2a4a] text-base font-bold border-b border-[#142e4c]"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-8 h-8 flex items-center justify-center text-white hover:bg-[#0f2a4a] text-base font-bold"
          >
            −
          </button>
        </div>
      </div>

      {/* Scale Bar (Bottom Left) */}
      <div className="absolute bottom-4 left-56 z-20 flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#071526]/80 text-[10px] font-mono text-slate-400 border border-[#142e4c] pointer-events-none">
        <div className="flex items-center gap-1">
          <span className="h-1.5 w-8 bg-slate-400 border-x border-white" />
          <span>0</span>
          <span>2.5</span>
          <span>5</span>
          <span>10 km</span>
        </div>
      </div>
    </div>
  );
}
