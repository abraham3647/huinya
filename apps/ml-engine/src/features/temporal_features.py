from __future__ import annotations


def synchronization_score(timestamps_ms: list[int], window_ms: int = 30_000) -> float:
    if len(timestamps_ms) < 2:
        return 0.0
    sorted_timestamps = sorted(timestamps_ms)
    synchronized = sum(
        1
        for previous, current in zip(sorted_timestamps, sorted_timestamps[1:])
        if current - previous <= window_ms
    )
    return synchronized / (len(sorted_timestamps) - 1)


def burst_score(timestamps_ms: list[int], window_ms: int = 60_000) -> float:
    if len(timestamps_ms) < 2:
        return 0.0
    sorted_timestamps = sorted(timestamps_ms)
    max_burst = 1
    left = 0
    for right, timestamp in enumerate(sorted_timestamps):
        while timestamp - sorted_timestamps[left] > window_ms:
            left += 1
        max_burst = max(max_burst, right - left + 1)
    return max_burst / len(sorted_timestamps)
