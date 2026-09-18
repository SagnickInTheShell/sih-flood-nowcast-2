import { create } from "zustand";
import {
  api,
  CriticalInfraItem,
  LatLng,
  RouteResponse,
  ScenarioSummary,
  SimulateResponse,
} from "../api/client";

interface LayerVisibility {
  roads: boolean;
  floodDepth: boolean;
  uncertainty: boolean;
  infra: boolean;
  route: boolean;
}

interface FloodStore {
  scenarios: ScenarioSummary[];
  activeScenarioId: string | null;
  // BUGFIX: which PRESET card is active, for UI highlighting -- distinct
  // from activeScenarioId, which is the live cache id returned by
  // /api/simulate. That id is a fresh UUID minted on every single call
  // (see backend ScenarioCache.compute_live), including calls made BY a
  // preset click, so comparing a preset's own static scenario_id against
  // activeScenarioId never matched after the very first interaction --
  // no card could ever show as selected again, which read as "selection
  // is broken" even though the underlying simulation was recomputing
  // correctly every time. null means "Custom" (live slider), not "none".
  selectedPresetId: string | null;
  simulateResult: SimulateResponse | null;
  criticalInfra: CriticalInfraItem[];
  route: RouteResponse | null;
  selectedNodeId: string | null;
  currentRainfall: { intensity: number; duration: number };
  layerVisibility: LayerVisibility;
  loading: boolean;
  error: string | null;

  loadInitial: () => Promise<void>;
  runScenario: (scenarioId: string) => Promise<void>;
  runCustomRainfall: (intensity: number, duration: number, presetId?: string | null) => Promise<void>;
  computeRoute: (start: LatLng, end: LatLng) => Promise<void>;
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
  selectedNodeId: null,
  currentRainfall: { intensity: 60, duration: 90 },
  layerVisibility: { roads: true, floodDepth: true, uncertainty: true, infra: true, route: true },

  loading: false,
  error: null,

  loadInitial: async () => {
    set({ loading: true, error: null });
    try {
      const [scenarios, infra] = await Promise.all([
        api.getScenarios(),
        api.getCriticalInfrastructure(),
      ]);
      set({ scenarios, criticalInfra: infra });
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
    // BUGFIX: this used to call runCustomRainfall(), which always POSTs to
    // /api/simulate and recomputes from scratch (GNN inference + road graph
    // + criticality check) -- ~2.1s in real mode -- even though the 3
    // presets are already fully computed once at backend startup
    // specifically so clicks feel instant. getScenarioDetail() hits the
    // actual cache-hit endpoint (pure lookup + formatting, no computation).
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

  // presetId: the clicked preset card's own static scenario_id, or
  // undefined/null when called directly from the live slider (-> "Custom").
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


  computeRoute: async (start: LatLng, end: LatLng) => {
    const scenarioId = get().activeScenarioId;
    if (!scenarioId) return;
    set({ loading: true, error: null });
    try {
      const route = await api.route(start, end, scenarioId);
      set({ route });
    } catch (e) {
      set({ error: (e as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  selectNode: (nodeId: string | null) => set({ selectedNodeId: nodeId }),
  toggleLayer: (key: keyof LayerVisibility) =>
    set((state) => ({ layerVisibility: { ...state.layerVisibility, [key]: !state.layerVisibility[key] } })),
}));
