from __future__ import annotations

from fastapi import APIRouter

from app.api.schemas import NodePrediction, RoadSegment, SimulateRequest, SimulateResponse
from app.ml.train import MODEL_CAVEAT
from app.scenarios.cache import cache

router = APIRouter()


def _sqdist(a, b) -> float:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def _edge_geojson(road_graph, u, v, data: dict) -> dict:
    coords = data.get("geometry_coords")
    if coords:
        # BUGFIX: real edge geometry (when present) is only rendered
        # correctly if it actually runs u -> v; an undirected graph's
        # edges() doesn't guarantee that orientation, so check and flip.
        u_pos = (road_graph.nodes[u]["lng"], road_graph.nodes[u]["lat"])
        if _sqdist(coords[0], u_pos) > _sqdist(coords[-1], u_pos):
            coords = list(reversed(coords))
        return {"type": "LineString", "coordinates": coords}
    return {
        "type": "LineString",
        "coordinates": [
            [road_graph.nodes[u]["lng"], road_graph.nodes[u]["lat"]],
            [road_graph.nodes[v]["lng"], road_graph.nodes[v]["lat"]],
        ],
    }


def scenario_to_response(scenario) -> SimulateResponse:
    """Converts an already-computed CachedScenario into the API shape --
    pure formatting, no computation. Shared by the live-compute path
    (POST /api/simulate) and the cached-lookup path (GET
    /api/scenarios/{scenario_id}) so a cache hit is truly just this
    formatting step, not a second copy of the compute logic that could
    drift out of sync.
    """
    node_predictions = [
        NodePrediction(
            node_id=node_id,
            lat=cache.drainage_graph.nodes[node_id]["lat"],
            lng=cache.drainage_graph.nodes[node_id]["lng"],
            depth_m_mean=scenario.node_depth_mean[node_id],
            depth_m_std=scenario.node_depth_std[node_id],
        )
        for node_id in scenario.node_depth_mean
    ]

    road_segments = [
        RoadSegment(
            edge_id=data["edge_id"], state=data["state"],
            geometry=_edge_geojson(scenario.road_graph, u, v, data),
        )
        for u, v, data in scenario.road_graph.edges(data=True)
    ]

    return SimulateResponse(
        scenario_id=scenario.scenario_id,
        node_predictions=node_predictions,
        road_segments=road_segments,
        model_caveat=MODEL_CAVEAT,
        is_synthetic_ward=scenario.is_synthetic_ward,
        at_risk_infra_ids=[r.infra_id for r in scenario.critical_access_risks],
    )


@router.post("/api/simulate", response_model=SimulateResponse)
def simulate(req: SimulateRequest) -> SimulateResponse:
    # NOTE: this path always computes live -- by design, it's the only
    # thing the live rainfall slider should ever call (see
    # routes_scenarios.py's GET /api/scenarios/{scenario_id} for the
    # cached-instant path preset buttons use instead).
    scenario = cache.compute_live(req.rainfall_intensity_mm_hr, req.duration_min)
    return scenario_to_response(scenario)
