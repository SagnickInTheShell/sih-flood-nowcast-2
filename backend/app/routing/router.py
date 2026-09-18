"""Dijkstra and A* routing with flood-state-dependent edge penalties.

edge cost = base_travel_time_s * penalty(state).

# DEVIATION from the literal spec (§6.7 says "flooded=inf"): a literal
# `math.inf` edge weight breaks two things we only caught by actually
# testing an extreme scenario, not by reading the code:
#   1. When EVERY route from A to B needs at least one flooded edge, every
#      such route ties at cost=inf, so Dijkstra/A* no longer discriminate
#      between "one short flooded hop" and "ten long flooded hops" -- both
#      are just "infinity", and the search can return either.
#   2. `eta_seconds`/`baseline_eta_seconds` in the API response would then
#      be `inf`, which is not valid JSON (Starlette's JSONResponse calls
#      json.dumps(..., allow_nan=False) and raises; even if it didn't,
#      the literal token `Infinity` isn't standard JSON and the frontend's
#      `fetch().json()` would throw parsing it).
# FLOODED_PENALTY is instead a large-but-finite multiplier: big enough
# that any route with a clear/at-risk-only alternative is always
# preferred (in this ward's ~64-node grid, no detour comes close to 200x
# a single edge's base travel time), while still letting the search rank
# forced-through-flood routes by which one is genuinely shortest, and
# keeping every reported ETA a finite, JSON-safe number.
"""
from __future__ import annotations

import math

import networkx as nx

FLOODED_PENALTY = 200.0
PENALTY = {"clear": 1.0, "at_risk": 3.0, "flooded": FLOODED_PENALTY}


def edge_cost(data: dict) -> float:
    return data["base_travel_time_s"] * PENALTY.get(data.get("state", "clear"), 1.0)


def _haversine_m(lat1, lng1, lat2, lng2) -> float:
    radius = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlmb / 2) ** 2
    return 2 * radius * math.asin(min(1.0, math.sqrt(a)))


def shortest_path_dijkstra(g: nx.Graph, source, target):
    path = nx.dijkstra_path(g, source, target, weight=lambda u, v, d: edge_cost(d))
    cost = nx.dijkstra_path_length(g, source, target, weight=lambda u, v, d: edge_cost(d))
    return path, cost


def shortest_path_astar(g: nx.Graph, source, target, assumed_speed_ms: float = 50 / 3.6):
    def heuristic(u, v):
        du, dv = g.nodes[u], g.nodes[v]
        return _haversine_m(du["lat"], du["lng"], dv["lat"], dv["lng"]) / assumed_speed_ms

    path = nx.astar_path(g, source, target, heuristic=heuristic, weight=lambda u, v, d: edge_cost(d))
    cost = sum(edge_cost(g.get_edge_data(a, b)) for a, b in zip(path[:-1], path[1:]))
    return path, cost


def nearest_node(g: nx.Graph, lat: float, lng: float) -> str:
    best, best_d = None, math.inf
    for node, data in g.nodes(data=True):
        d = math.hypot(data["lat"] - lat, data["lng"] - lng)
        if d < best_d:
            best, best_d = node, d
    return best


def path_edge_ids(g: nx.Graph, path: list[str]) -> list[str]:
    return [g.get_edge_data(a, b)["edge_id"] for a, b in zip(path[:-1], path[1:])]


def path_flooded_segments(g: nx.Graph, path: list[str]) -> list[str]:
    return [
        g.get_edge_data(a, b)["edge_id"]
        for a, b in zip(path[:-1], path[1:])
        if g.get_edge_data(a, b).get("state") in ("flooded", "at_risk")
    ]


def _sqdist(a, b) -> float:
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2


def path_to_geojson_linestring(g: nx.Graph, path: list[str]) -> dict:
    # BUGFIX: this used to connect each path node's own (lng, lat) directly,
    # which for a real-mode road graph skips over osmnx's simplified edges'
    # true curved geometry -- a route crossing one of those edges rendered
    # as a straight chord cutting across the map, ignoring the actual road,
    # for exactly the same reason road_segments rendering did (see
    # routes_simulate.py's _edge_geojson). Use each edge's real geometry
    # when present, stitched together in path order.
    if len(path) < 2:
        if path:
            n = path[0]
            return {"type": "LineString", "coordinates": [[g.nodes[n]["lng"], g.nodes[n]["lat"]]]}
        return {"type": "LineString", "coordinates": []}

    coords: list[list[float]] = []
    for a, b in zip(path[:-1], path[1:]):
        data = g.get_edge_data(a, b)
        seg = data.get("geometry_coords") if data else None
        if seg:
            a_pos = (g.nodes[a]["lng"], g.nodes[a]["lat"])
            if _sqdist(seg[0], a_pos) > _sqdist(seg[-1], a_pos):
                seg = list(reversed(seg))
        else:
            seg = [
                [g.nodes[a]["lng"], g.nodes[a]["lat"]],
                [g.nodes[b]["lng"], g.nodes[b]["lat"]],
            ]
        if coords and coords[-1] == seg[0]:
            coords.extend(seg[1:])
        else:
            coords.extend(seg)
    return {"type": "LineString", "coordinates": coords}
