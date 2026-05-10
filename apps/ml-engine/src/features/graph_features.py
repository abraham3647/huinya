from __future__ import annotations


def cycle_frequency(edges: list[tuple[str, str]]) -> float:
    if not edges:
        return 0.0
    edge_set = set(edges)
    reciprocal_edges = sum(1 for source, target in edges if (target, source) in edge_set)
    return reciprocal_edges / len(edges)


def community_density(node_count: int, edge_count: int) -> float:
    if node_count < 2:
        return 0.0
    possible_edges = node_count * (node_count - 1)
    return min(1.0, edge_count / possible_edges)
