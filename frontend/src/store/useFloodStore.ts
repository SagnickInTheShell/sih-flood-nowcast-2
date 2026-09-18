import { create } from "zustand";
import {
  api,
  CriticalInfraItem,
  LatLng,
  RouteResponse,
  ScenarioSummary,
  SimulateResponse,
  WeatherNowcastResponse,
} from "../api/client";

export interface LayerVisibility {
  roads: boolean;
  floodDepth: boolean;
  drainage: boolean;
  rainfallNowcast: boolean;
  infra: boolean;
  liveVehicles: boolean;
  forecast: boolean;
  uncertainty: boolean;
  route: boolean;
}

export type VehicleType = "ambulance" | "fire" | "rescue" | "police";

interface FloodStore {
  scenarios: ScenarioSummary[];
  activeScenarioId: string | null;
  selectedPresetId: string | null;
  simulateResult: SimulateResponse | null;
  criticalInfra: CriticalInfraItem[];
  route: RouteResponse | null;
  selectedRouteId: string;
  vehicleType: VehicleType;
  selectedNodeId: string | null;
  currentRainfall: { intensity: number; duration: number };
  weatherNowcast: WeatherNowcastResponse | null;
  layerVisibility: LayerVisibility;
  activeNav: string;
  activeMapPill: string;
  searchQuery: string;
  loading: boolean;
  error: string | null;

  loadInitial: () => Promise<void>;
  loadWeather: () => Promise<void>;
  runScenario: (scenarioId: string) => Promise<void>;
  runCustomRainfall: (intensity: number, duration: number, presetId?: string | null) => Promise<void>;
  computeRoute: (start: LatLng, end: LatLng, vehicle?: VehicleType) => Promise<void>;
  setVehicleType: (vt: VehicleType) => void;
  setSelectedRouteId: (id: string) => void;
  setActiveNav: (nav: string) => void;
  setActiveMapPill: (pill: string) => void;
  setSearchQuery: (query: string) => void;
  selectNode: (nodeId: string | null) => void;
  toggleLayer: (key: keyof LayerVisibility) => void;
}

export const useFloodStore = create<FloodStore>((set, get) => ({
  scenarios: [],
  activeScenarioId: null,
  selectedPresetId: null,
  simulateResult: null,
  criticalInfra: [],
  route: null,
  selectedRouteId: "recommended",
  vehicleType: "ambulance",
  selectedNodeId: null,
  currentRainfall: { intensity: 78, duration: 90 },
  weatherNowcast: null,
  layerVisibility: {
    roads: true,
    floodDepth: true,
    drainage: true,
    rainfallNowcast: true,
    infra: true,
    liveVehicles: true,
    forecast: false,
    uncertainty: false,
    route: true,
  },
  activeNav: "Dashboard",
  activeMapPill: "Live Map",
  searchQuery: "",
  loading: false,
  error: null,

  loadWeather: async () => {
    try {
      const weather = await api.getWeatherNowcast();
      set({ weatherNowcast: weather });
    } catch (e) {
      console.warn("Could not load weather nowcast:", e);
    }
  },

  loadInitial: async () => {
    set({ loading: true, error: null });
    try {
      const [scenarios, infra] = await Promise.all([
        api.getScenarios(),
        api.getCriticalInfrastructure(),
      ]);
      set({ scenarios, criticalInfra: infra });
      get().loadWeather();
      if (scenarios.length > 0) {
        await get().runScenario(scenarios[1]?.scenario_id ?? scenarios[0].scenario_id);
      }
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  runScenario: async (scenarioId: string) => {
    const scenario = get().scenarios.find((s) => s.scenario_id === scenarioId);
    if (!scenario) return;
    set({
      loading: true,
      error: null,
      selectedPresetId: scenarioId,
      currentRainfall: { intensity: scenario.rainfall_intensity_mm_hr, duration: scenario.duration_min },
    });
    try {
      const result = await api.getScenarioDetail(scenarioId);
      set({ simulateResult: result, activeScenarioId: result.scenario_id, route: null });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  runCustomRainfall: async (intensity: number, duration: number, presetId: string | null = null) => {
    set({
      loading: true,
      error: null,
      selectedPresetId: presetId,
      currentRainfall: { intensity, duration },
    });
    try {
      const result = await api.simulate(intensity, duration);
      set({ simulateResult: result, activeScenarioId: result.scenario_id, route: null });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  computeRoute: async (start: LatLng, end: LatLng, vehicle?: VehicleType) => {
    const scenarioId = get().activeScenarioId;
    if (!scenarioId) return;
    const vt = vehicle ?? get().vehicleType;
    set({ loading: true, error: null });
    try {
      const route = await api.route(start, end, scenarioId, "astar", vt);
      set({ route, selectedRouteId: "recommended" });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  setVehicleType: (vehicleType: VehicleType) => {
    set({ vehicleType });
    const currentRoute = get().route;
    if (currentRoute) {
      // Re-trigger with new vehicle type if locations known or adjust ETA locally
      const factor = vehicleType === "fire" ? 1.14 : vehicleType === "rescue" ? 1.33 : vehicleType === "police" ? 0.95 : 1.0;
      set({
        route: {
          ...currentRoute,
          active_vehicle: vehicleType,
        },
      });
    }
  },

  setSelectedRouteId: (selectedRouteId: string) => set({ selectedRouteId }),
  setActiveNav: (activeNav: string) => set({ activeNav }),
  setActiveMapPill: (activeMapPill: string) => set({ activeMapPill }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  selectNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
  toggleLayer: (key: keyof LayerVisibility) =>
    set((state) => ({ layerVisibility: { ...state.layerVisibility, [key]: !state.layerVisibility[key] } })),
}));

