from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ClusterSignals:
    wallet_mean_risk: float
    funding_score: float
    cycle_score: float
    temporal_score: float
    inorganic_volume_share: float


def clamp_probability(value: float) -> float:
    return max(0.0, min(1.0, value))


def predict_coordinated_probability(signals: ClusterSignals) -> float:
    weighted = (
        signals.wallet_mean_risk * 0.25
        + signals.funding_score * 0.25
        + signals.cycle_score * 0.25
        + signals.temporal_score * 0.25
    )
    return clamp_probability(weighted)


def explain_cluster(signals: ClusterSignals) -> list[str]:
    reasons: list[str] = []
    if signals.funding_score >= 0.7:
        reasons.append("funded by same source")
    if signals.temporal_score >= 0.7:
        reasons.append("synchronized trading")
    if signals.cycle_score >= 0.7:
        reasons.append("cyclic liquidity behavior")
    if signals.inorganic_volume_share >= 0.7:
        reasons.append("high inorganic volume share")
    return reasons
