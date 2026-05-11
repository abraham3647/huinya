from __future__ import annotations

from dataclasses import dataclass
from math import log2


@dataclass(frozen=True)
class WalletFeatureInput:
    wallet: str
    tx_count: int
    avg_volume_usd: float
    token_count: int
    creator_count: int
    action_counts: list[int]


def entropy(counts: list[int]) -> float:
    total = sum(counts)
    if total <= 0:
        return 0.0
    return -sum((count / total) * log2(count / total) for count in counts if count > 0)


def extract_wallet_features(item: WalletFeatureInput) -> dict[str, float | str]:
    return {
        "wallet": item.wallet,
        "tx_count": float(item.tx_count),
        "avg_volume_usd": float(item.avg_volume_usd),
        "token_diversity": float(item.token_count),
        "creator_diversity": float(item.creator_count),
        "entropy": entropy(item.action_counts),
    }
