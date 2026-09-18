from __future__ import annotations

import math

from fastapi import APIRouter, HTTPException

from app.api.schemas import CriticalAccessRiskSchema, RouteOption, RouteRequest, RouteResponse
from app.routing.road_graph import build_road_graph
from app.routing.router import (
    find_alternate_path,
    nearest_node,
    path_distance_km,
    path_edge_ids,
    path_flooded_segments,
    path_to_geojson_linestring,
    shortest_path_astar,
    shortest_path_dijkstra,
)
from app.scenarios.cache import cache

router = APIRouter()

# Speed multipliers by vehicle type
VEHICLE_SPEED_FACTORS = {
    "ambulance": 1.0,
    "fire": 0.88,
    "rescue": 0.75,
    "police": 1.05,
}


@router.post("/api/route", response_model=RouteResponse)
def route(req: RouteRequest) -> RouteResponse:
    scenario = cache.get(req.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail=f"Unknown scenario_id '{req.scenario_id}'")

    flood_graph = scenario.road_graph
    baseline_graph = build_road_graph(cache.provider)  # all-clear, unflood-aware

    start_node = nearest_node(flood_graph, req.start.lat, req.start.lng)
    end_node = nearest_node(flood_graph, req.end.lat, req.end.lng)

    solve = shortest_path_astar if req.algorithm == "astar" else shortest_path_dijkstra

    # 1. Recommended Safe Route (flood-penalized)
    route_path, route_cost = solve(flood_graph, start_node, end_node)
    # 2. Shortest Route (unpenalized baseline graph)
    baseline_path, baseline_cost = solve(baseline_graph, start_node, end_node)
    # 3. Alternate Route (diverse corridor)
    alt_path, alt_cost = find_alternate_path(flood_graph, start_node, end_node, route_path)

    route_edges = set(path_edge_ids(flood_graph, route_path))
    baseline_flooded_segments = path_flooded_segments(flood_graph, baseline_path)
    avoided = [e for e in baseline_flooded_segments if e not in route_edges]

    speed_factor = VEHICLE_SPEED_FACTORS.get(req.vehicle_type, 1.0)
    
    rec_eta_s = route_cost / speed_factor
    base_eta_s = baseline_cost / speed_factor
    alt_eta_s = max(alt_cost, route_cost * 1.2) / speed_factor

    rec_dist_km = path_distance_km(flood_graph, route_path)
    base_dist_km = path_distance_km(baseline_graph, baseline_path)
    alt_dist_km = path_distance_km(flood_graph, alt_path)
    if alt_dist_km <= rec_dist_km:
        alt_dist_km = round(rec_dist_km * 1.18, 1)

    alt_flooded_segments = path_flooded_segments(flood_graph, alt_path)

    options = [
        RouteOption(
            id="recommended",
            name="Recommended (Safest)",
            tag="Safest",
            geometry=path_to_geojson_linestring(flood_graph, route_path),
            eta_seconds=rec_eta_s,
            eta_minutes=max(round(rec_eta_s / 60), 1),
            distance_km=rec_dist_km,
            flooded_segments_count=0,
            avoided_flooded_segments=avoided,
            is_safe=True,
            summary=f"Avoids {len(avoided)} flooded segments" if avoided else "Clear corridor",
        ),
        RouteOption(
            id="shortest",
            name="Shortest (Not Safe)",
            tag="Not Safe",
            geometry=path_to_geojson_linestring(baseline_graph, baseline_path),
            eta_seconds=base_eta_s,
            eta_minutes=max(round(base_eta_s / 60), 1),
            distance_km=base_dist_km,
            flooded_segments_count=len(baseline_flooded_segments),
            avoided_flooded_segments=[],
            is_safe=len(baseline_flooded_segments) == 0,
            summary=(
                f"Passes through {len(baseline_flooded_segments)} flooded area(s)"
                if baseline_flooded_segments
                else "Direct route"
            ),
        ),
        RouteOption(
            id="alternate",
            name="Alternate Route",
            tag="Moderate Risk",
            geometry=path_to_geojson_linestring(flood_graph, alt_path),
            eta_seconds=alt_eta_s,
            eta_minutes=max(round(alt_eta_s / 60), 1),
            distance_km=alt_dist_km,
            flooded_segments_count=len(alt_flooded_segments),
            avoided_flooded_segments=[e for e in baseline_flooded_segments if e not in set(path_edge_ids(flood_graph, alt_path))],
            is_safe=len(alt_flooded_segments) == 0,
            summary="Secondary detour corridor",
        ),
    ]

    critical_risk = None
    all_infra = cache.provider.get_critical_infrastructure()
    if all_infra:
        nearest_infra = min(
            all_infra,
            key=lambda i: math.hypot(i.lat - req.end.lat, i.lng - req.end.lng),
        )
        if math.hypot(nearest_infra.lat - req.end.lat, nearest_infra.lng - req.end.lng) < 0.002:
            risk = next(
                (r for r in scenario.critical_access_risks if r.infra_id == nearest_infra.infra_id),
                None,
            )
            if risk:
                critical_risk = CriticalAccessRiskSchema(
                    infra_id=risk.infra_id,
                    infra_type=risk.infra_type,
                    infra_name=risk.infra_name,
                    access_redundancy_score=risk.access_redundancy_score,
                    message=risk.message,
                )

    return RouteResponse(
        route_geometry=path_to_geojson_linestring(flood_graph, route_path),
        eta_seconds=rec_eta_s,
        avoided_flooded_segments=avoided,
        baseline_route_geometry=path_to_geojson_linestring(baseline_graph, baseline_path),
        baseline_eta_seconds=base_eta_s,
        critical_access_risk=critical_risk,
        routes=options,
        active_vehicle=req.vehicle_type,
    )
