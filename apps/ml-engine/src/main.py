from __future__ import annotations

from features.graph_features import community_density, cycle_frequency
from features.temporal_features import synchronization_score
from inference.risk_predictor import ClusterSignals, explain_cluster, predict_coordinated_probability


def main() -> None:
    edges = [("W1", "W2"), ("W2", "W3"), ("W3", "W1"), ("W2", "W1")]
    signals = ClusterSignals(
        wallet_mean_risk=0.79,
        funding_score=0.88,
        cycle_score=cycle_frequency(edges),
        temporal_score=synchronization_score([0, 10_000, 12_000, 20_000]),
        inorganic_volume_share=community_density(3, len(edges)),
    )
    print(
        {
            "coordinated_probability": predict_coordinated_probability(signals),
            "reasons": explain_cluster(signals),
        }
    )


if __name__ == "__main__":
    main()
