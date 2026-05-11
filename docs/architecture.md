# Architecture

The Anti-Sybil Engine is organized around graph construction and cluster-level scoring.

## Data flow

1. The indexer subscribes to Solana RPC or Yellowstone gRPC streams.
2. Parsers emit normalized transfer, swap, Bags.fm, and funding events.
3. Kafka topics decouple realtime ingestion from downstream graph processing.
4. The graph worker writes wallet, creator, transaction, social, funding, and temporal edges into Neo4j.
5. The ML engine extracts wallet, graph, and temporal features for cluster inference.
6. The API exposes wallet risk, cluster risk, and creator integrity endpoints.
7. The dashboard provides a moderator-facing view of coordinated wallet clusters.

## Risk score philosophy

The engine scores the probability of coordinated behavior. A wallet can be risky because it is part of a suspicious structure even when one individual transaction looks harmless.

## MVP scoring signals

- Common funding source.
- Reciprocal and cyclic transaction paths.
- Synchronized trading windows.
- Low diversity and low entropy wallet behavior.
- Dense communities with limited external participation.
