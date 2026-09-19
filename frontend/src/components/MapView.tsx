import React, { useEffect, useMemo, useRef, useState } from "react";
import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, PathLayer, ScatterplotLayer } from "@deck.gl/layers";
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
  const [mapZoom, setMapZoom] = useState(13.8);
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
  const routeStart = useFloodStore((s) => s.routeStart);
  const routeStartLabel = useFloodStore((s) => s.routeStartLabel);
  const isPickingStartOnMap = useFloodStore((s) => s.isPickingStartOnMap);
  const setRouteStart = useFloodStore((s) => s.setRouteStart);
  const setIsPickingStartOnMap = useFloodStore((s) => s.setIsPickingStartOnMap);
  const routeEnd = useFloodStore((s) => s.routeEnd);
  const routeEndLabel = useFloodStore((s) => s.routeEndLabel);
  const isPickingEndOnMap = useFloodStore((s) => s.isPickingEndOnMap);
  const setRouteEnd = useFloodStore((s) => s.setRouteEnd);
  const setIsPickingEndOnMap = useFloodStore((s) => s.setIsPickingEndOnMap);

  const isPicking = isPickingStartOnMap || isPickingEndOnMap;

  const [layersOpen, setLayersOpen] = useState(true);

  // Memoize heavy GeoJSON feature collections to avoid allocating thousands of JS objects on render
  const roadData = useMemo(() => {
    if (!simulateResult?.road_segments) return null;
    return {
      type: "FeatureCollection" as const,
      features: simulateResult.road_segments.map((seg) => ({
        type: "Feature" as const,
        properties: { edge_id: seg.edge_id, state: seg.state },
        geometry: seg.geometry,
      })),
    };
  }, [simulateResult]);

  const drainageData = useMemo(() => {
    if (!simulateResult?.node_predictions) return null;
    return {
      type: "FeatureCollection" as const,
      features: simulateResult.node_predictions.slice(0, 120).map((n, idx) => ({
        type: "Feature" as const,
        properties: {},
        geometry: {
          type: "LineString" as const,
          coordinates: [
            [n.lng, n.lat],
            [n.lng + (idx % 2 === 0 ? 0.003 : -0.003), n.lat - 0.002],
          ] as [number, number][],
        },
      })),
    };
  }, [simulateResult]);

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

    let zoomTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleZoomEnd = () => {
      if (zoomTimeout) clearTimeout(zoomTimeout);
      zoomTimeout = setTimeout(() => {
        if (!mapRef.current) return;
        const currentZ = mapRef.current.getZoom();
        setMapZoom((prevZ) => {
          if (Math.abs(currentZ - prevZ) >= 0.25) {
            return currentZ;
          }
          return prevZ;
        });
      }, 120);
    };
    map.on("zoomend", handleZoomEnd);

    map.on("click", (e) => {
      const state = useFloodStore.getState();
      const clicked = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      const coordLabel = `Location (${e.lngLat.lat.toFixed(4)}, ${e.lngLat.lng.toFixed(4)})`;

      if (state.isPickingStartOnMap) {
        // Set new start, recompute to existing end
        const endCoord = state.routeEnd ?? (() => {
          const atRisk = new Set(state.simulateResult?.at_risk_infra_ids ?? []);
          const h = state.criticalInfra.find((i) => atRisk.has(i.infra_id)) ?? state.criticalInfra[0];
          return h ? { lat: h.lat, lng: h.lng } : null;
        })();
        if (endCoord) {
          state.computeRoute(clicked, endCoord, state.vehicleType, coordLabel);
        } else {
          state.setRouteStart(clicked, coordLabel);
        }
      } else if (state.isPickingEndOnMap) {
        // Set new end, recompute from existing start
        state.computeRoute(state.routeStart, clicked, state.vehicleType, undefined, coordLabel);
      } else {
        // Normal map click: update start, compute to current end
        const atRiskIds = new Set(state.simulateResult?.at_risk_infra_ids ?? []);
        const infra = state.criticalInfra.find((i) => atRiskIds.has(i.infra_id)) ?? state.criticalInfra[0];
        if (infra) {
          const endCoord = state.routeEnd ?? { lat: infra.lat, lng: infra.lng };
          computeRoute(clicked, endCoord);
        }
      }
    });

    return () => {
      if (zoomTimeout) clearTimeout(zoomTimeout);
      map.off("zoomend", handleZoomEnd);
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
    if (roadData && layerVisibility.roads) {
      layers.push(
        new GeoJsonLayer({
          id: "road-segments",
          data: roadData,
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

    // 2. Flood Heatmap Layer - Dynamic radius locked to physical ground scale (~280m)
    if (simulateResult && layerVisibility.floodDepth) {
      // MapLibre meters per pixel at latitude ~12.93°: 152575 / 2^zoom
      // Fixed ground radius of ~280 meters ensures the flood pool stays fixed on the ground when zooming
      const groundRadiusMeters = 280;
      const dynamicRadiusPixels = Math.max(
        8,
        Math.min(320, Math.round((groundRadiusMeters * Math.pow(2, mapZoom)) / 152575))
      );

      layers.push(
        new HeatmapLayer({
          id: "flood-depth-heatmap",
          data: simulateResult.node_predictions,
          getPosition: (d: any) => [d.lng, d.lat],
          getWeight: (d: any) => Math.max(d.depth_m_mean, 0.05),
          radiusPixels: dynamicRadiusPixels,
          intensity: 1.2,
          threshold: 0.03,
          aggregation: "MEAN",
          weightsTextureSize: 512,
          colorRange: [
            [0, 150, 255, 0],
            [0, 229, 255, 100],
            [255, 230, 0, 160],
            [255, 120, 0, 200],
            [255, 20, 20, 240],
          ],
        })
      );
    }

    // 3. Drainage Network
    if (drainageData && layerVisibility.drainage) {
      layers.push(
        new GeoJsonLayer({
          id: "drainage-lines",
          data: drainageData,
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

    // 5. Emergency Routes (Active & Alternatives)
    if (route && layerVisibility.route) {
      // Build a unified list of available routes
      const allRoutes: { id: string; name: string; coordinates: [number, number][]; isSelected: boolean }[] = [];

      if (route.routes && route.routes.length > 0) {
        for (const r of route.routes) {
          if (r.geometry?.coordinates?.length) {
            allRoutes.push({
              id: r.id,
              name: r.name,
              coordinates: r.geometry.coordinates,
              isSelected: r.id === selectedRouteId,
            });
          }
        }
      } else {
        if (route.baseline_route_geometry?.coordinates?.length) {
          allRoutes.push({
            id: "shortest",
            name: "Shortest Route",
            coordinates: route.baseline_route_geometry.coordinates,
            isSelected: selectedRouteId === "shortest",
          });
        }
        if (route.route_geometry?.coordinates?.length) {
          allRoutes.push({
            id: "recommended",
            name: "Recommended Route",
            coordinates: route.route_geometry.coordinates,
            isSelected: selectedRouteId === "recommended",
          });
        }
      }

      // If no route explicitly matched the selection, default the first one as selected
      const hasSelected = allRoutes.some((r) => r.isSelected);
      if (!hasSelected && allRoutes.length > 0) {
        allRoutes[0].isSelected = true;
      }

      // 1. Render all unselected alternative routes in muted slate gray (never purple)
      const unselectedRoutes = allRoutes.filter((r) => !r.isSelected);
      unselectedRoutes.forEach((r) => {
        layers.push(
          new PathLayer({
            id: `route-unselected-${r.id}`,
            data: [{ path: r.coordinates }],
            getPath: (d: any) => d.path,
            getColor: [100, 116, 139, 130], // Muted slate gray
            getWidth: 4,
            widthMinPixels: 3,
            capRounded: true,
            jointRounded: true,
          })
        );
      });

      // 2. Render ONLY the actively selected route in glowing high-visibility purple
      const selectedRoute = allRoutes.find((r) => r.isSelected);
      if (selectedRoute) {
        // Outer halo glow
        layers.push(
          new PathLayer({
            id: `route-selected-glow-${selectedRoute.id}`,
            data: [{ path: selectedRoute.coordinates }],
            getPath: (d: any) => d.path,
            getColor: [168, 85, 247, 90], // Neon purple halo
            getWidth: 12,
            widthMinPixels: 8,
            capRounded: true,
            jointRounded: true,
          })
        );

        // Core high-contrast vibrant purple line
        layers.push(
          new PathLayer({
            id: `route-selected-core-${selectedRoute.id}`,
            data: [{ path: selectedRoute.coordinates }],
            getPath: (d: any) => d.path,
            getColor: [192, 132, 252, 255], // Electric bright purple
            getWidth: 7.5,
            widthMinPixels: 5,
            capRounded: true,
            jointRounded: true,
          })
        );
      }
    }

    // 6. Start Point Pin (cyan dot with white ring + outer pulse ring)
    layers.push(
      new ScatterplotLayer({
        id: "route-start-pin-outer",
        data: [{ position: [routeStart.lng, routeStart.lat] }],
        getPosition: (d: any) => d.position,
        getFillColor: [0, 229, 255, 40],
        getLineColor: [0, 229, 255, 160],
        getRadius: 18,
        radiusUnits: "pixels",
        lineWidthMinPixels: 1.5,
        stroked: true,
        filled: true,
        pickable: false,
      })
    );
    layers.push(
      new ScatterplotLayer({
        id: "route-start-pin",
        data: [{ position: [routeStart.lng, routeStart.lat] }],
        getPosition: (d: any) => d.position,
        getFillColor: [0, 229, 255, 255],
        getLineColor: [255, 255, 255, 240],
        getRadius: 10,
        radiusUnits: "pixels",
        lineWidthMinPixels: 2.5,
        stroked: true,
        filled: true,
        pickable: false,
      })
    );

    // 7. End Point Pin (emerald green dot with white ring)
    const endCoord = routeEnd ?? (() => {
      const infra = criticalInfra[0];
      return infra ? { lat: infra.lat, lng: infra.lng } : null;
    })();
    if (endCoord) {
      layers.push(
        new ScatterplotLayer({
          id: "route-end-pin-outer",
          data: [{ position: [endCoord.lng, endCoord.lat] }],
          getPosition: (d: any) => d.position,
          getFillColor: [52, 211, 153, 40],
          getLineColor: [52, 211, 153, 160],
          getRadius: 18,
          radiusUnits: "pixels",
          lineWidthMinPixels: 1.5,
          stroked: true,
          filled: true,
          pickable: false,
        })
      );
      layers.push(
        new ScatterplotLayer({
          id: "route-end-pin",
          data: [{ position: [endCoord.lng, endCoord.lat] }],
          getPosition: (d: any) => d.position,
          getFillColor: [52, 211, 153, 255],
          getLineColor: [255, 255, 255, 240],
          getRadius: 10,
          radiusUnits: "pixels",
          lineWidthMinPixels: 2.5,
          stroked: true,
          filled: true,
          pickable: false,
        })
      );
    }

    overlayRef.current.setProps({ layers });
  }, [simulateResult, criticalInfra, route, selectedRouteId, layerVisibility, mapZoom, routeStart, routeEnd]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#061120]">
      {/* MapLibre Canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{ cursor: isPicking ? "crosshair" : undefined }}
      />

      {/* Picking banner — shown for either start or end picking mode */}
      {isPicking && (
        <div className="absolute top-16 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl backdrop-blur-md font-bold text-xs pointer-events-auto border shadow-lg ${
            isPickingStartOnMap
              ? "bg-[#00e5ff]/15 border-[#00e5ff]/60 text-[#00e5ff] shadow-[0_0_20px_rgba(0,229,255,0.3)]"
              : "bg-emerald-400/15 border-emerald-400/60 text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.3)]"
          }`}>
            <svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="10" r="3" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 2C8.134 2 5 5.134 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.866-3.134-7-7-7z" />
            </svg>
            {isPickingStartOnMap
              ? "Click anywhere to set your START point 🔵"
              : "Click anywhere to set your DESTINATION 🟢"}
            <button
              onClick={() => { setIsPickingStartOnMap(false); setIsPickingEndOnMap(false); }}
              className="ml-1 opacity-70 hover:opacity-100 transition-opacity text-sm leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
                  <span className="w-3.5 h-1 rounded-xs bg-[#c084fc] shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
                  <span className="text-slate-300">Selected Route</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#00e5ff] border-2 border-white" />
                  <span className="text-slate-300">Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white" />
                  <span className="text-slate-300">End / Destination</span>
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
