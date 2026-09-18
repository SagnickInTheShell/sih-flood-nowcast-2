from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.api.schemas import ScenarioSummary, SimulateResponse
from app.api.routes_simulate import scenario_to_response
from app.scenarios.cache import cache

router = APIRouter()


@router.get("/api/scenarios", response_model=list[ScenarioSummary])
def list_scenarios() -> list[ScenarioSummary]:
    return [
        ScenarioSummary(
            scenario_id=sid,
            label=cache.scenarios[sid].label,
            rainfall_intensity_mm_hr=cache.scenarios[sid].rainfall_intensity_mm_hr,
            duration_min=cache.scenarios[sid].duration_min,
        )
        for sid in cache.by_preset.values()
    ]


@router.get("/api/scenarios/{scenario_id}", response_model=SimulateResponse)
def get_scenario(scenario_id: str) -> SimulateResponse:
    # BUGFIX: the 3 preset scenarios are fully computed once at startup
    # specifically so clicking a preset feels instant during a demo, but
    # nothing ever read that cached result -- the frontend always POSTed
    # to /api/simulate, which recomputes from scratch (GNN inference +
    # road graph + criticality check) on every single click. Measured at
    # ~2.1s end-to-end in real mode. This endpoint is the actual
    # cache-hit path: pure lookup + formatting, no computation at all.
    scenario = cache.get(scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario_id '{scenario_id}'")
    return scenario_to_response(scenario)
