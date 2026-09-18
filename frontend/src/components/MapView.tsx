import { HeatmapLayer } from "@deck.gl/aggregation-layers";
import { GeoJsonLayer, PathLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { useFloodStore } from "../store/useFloodStore";
import { stateColor } from "../theme";

const ANCHOR = { lat: 12.9716, lng: 77.5946 };

// CARTO Dark Matter GL style for high-contrast dark dashboard aesthetic
const BASEMAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";


export default function MapView() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const overlayRef = useRef<MapboxOverlay | null>(null);
  const hasCenteredRef = useRef(false);

  const simulateResult = useFloodStore((s) => s.simulateResult);
  const criticalInfra = useFloodStore((s) => s.criticalInfra);
  const route = useFloodStore((s) => s.route);
  const layerVisibility = useFloodStore((s) => s.layerVisibility);
  const selectNode = useFloodStore((s) => s.selectNode);
  const computeRoute = useFloodStore((s) => s.computeRoute);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      center: [ANCHOR.lng, ANCHOR.lat],
      zoom: 14.5,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const overlay = new MapboxOverlay({ layers: [] });
    map.addControl(overlay as unknown as maplibregl.IControl);
    mapRef.current = map;
    overlayRef.current = overlay;

    // Demo affordance: click anywhere to route from that point to a
    // critical-infrastructure site that is ACTUALLY at risk under the
    // current scenario (zero access redundancy), falling back to the
    // first known site if nothing is at risk yet (e.g. light rain).
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

  // Real-mode wards (e.g. Bellandur) live nowhere near the synthetic
  // ward's placeholder anchor -- recentre once real data actually arrives,
  // instead of hardcoding a second location here.
  useEffect(() => {
    if (hasCenteredRef.current || !mapRef.current || criticalInfra.length === 0) return;
    const avgLat = criticalInfra.reduce((sum, i) => sum + i.lat, 0) / criticalInfra.length;
    const avgLng = criticalInfra.reduce((sum, i) => sum + i.lng, 0) / criticalInfra.length;
    mapRef.current.jumpTo({ center: [avgLng, avgLat], zoom: 15 });
    hasCenteredRef.current = true;
  }, [criticalInfra]);

  useEffect(() => {
    if (!overlayRef.current) return;
    const layers: any[] = [];

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
          getLineWidth: (f: any) => (f.properties.state === "flooded" ? 8 : 5),
          widthUnits: "pixels",
          lineWidthMinPixels: 4,
          capRounded: true,
          jointRounded: true,
          pickable: true,
        }),
      );
    }

    if (simulateResult && layerVisibility.floodDepth) {
      layers.push(
        new HeatmapLayer({
          id: "flood-depth-heatmap",
          data: simulateResult.node_predictions,
          getPosition: (d: any) => [d.lng, d.lat],
          getWeight: (d: any) => Math.max(d.depth_m_mean, 0.001),
          radiusPixels: 55,
          intensity: 1.2,
          threshold: 0.03,
          aggregation: "SUM",
          colorRange: [
            [6, 13, 25, 0],
            [0, 168, 181, 75],
            [232, 163, 61, 120],
            [239, 68, 68, 160],
            [185, 28, 28, 210],
          ],
        }),
      );
    }

    // Uncertainty rendered as translucent cyan halo overlay
    if (simulateResult && layerVisibility.uncertainty) {
      layers.push(
        new GeoJsonLayer({
          id: "uncertainty-band",
          data: {
            type: "FeatureCollection",
            features: simulateResult.node_predictions.map((n) => ({
              type: "Feature",
              properties: { std: n.depth_m_std, node_id: n.node_id },
              geometry: { type: "Point", coordinates: [n.lng, n.lat] },
            })),
          },
          pointType: "circle",
          getFillColor: [0, 210, 224, 50],
          getLineColor: [0, 210, 224, 180],
          lineWidthMinPixels: 1.5,
          getPointRadius: (f: any) => 8 + f.properties.std * 250,
          pointRadiusUnits: "pixels",
          pickable: true,
          onClick: (info: any) => selectNode(info.object?.properties?.node_id ?? null),
        }),
      );
    }

    if (layerVisibility.infra) {
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
          getFillColor: [232, 163, 61, 255],
          getLineColor: [6, 13, 25, 255],
          getLineWidth: 3,
          lineWidthMinPixels: 2,
          getPointRadius: 12,
          pointRadiusUnits: "pixels",
          pickable: true,
        }),
      );
    }

    if (route && layerVisibility.route) {
      layers.push(
        new PathLayer({
          id: "baseline-route",
          data: [{ path: route.baseline_route_geometry.coordinates }],
          getPath: (d: any) => d.path,
          getColor: [148, 163, 184, 180], // Muted slate baseline
          getWidth: 5,
          widthMinPixels: 4,
          capRounded: true,
        }),
        new PathLayer({
          id: "active-route",
          data: [{ path: route.route_geometry.coordinates }],
          getPath: (d: any) => d.path,
          getColor: [16, 185, 129, 255], // Glowing emerald safe route
          getWidth: 7,
          widthMinPixels: 5,
          capRounded: true,
        }),
      );
    }

    overlayRef.current.setProps({ layers });
  }, [simulateResult, criticalInfra, route, layerVisibility, selectNode]);

  return <div ref={containerRef} className="absolute inset-0 bg-[#060d17]" />;
}

