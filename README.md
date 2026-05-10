# Anti-Sybil Engine for Bags.fm

Anti-Sybil Engine is an infrastructure blueprint and runnable MVP scaffold for detecting coordinated wallet clusters, wash trading, fake engagement, and creator-farming behavior in the Bags.fm SocialFi ecosystem.

The system is designed to score coordinated behavior instead of only flagging isolated transactions. It combines transaction, social, behavioral, funding, and temporal graphs to produce wallet, cluster, creator, and token integrity signals.

## Why Bags.fm needs this

Bags.fm combines token launches, creator communities, trading, reputation, and discovery. That makes the platform vulnerable to fake volume, fake communities, fake engagement, fake creators, and manipulated trending rankings.

A single operator can create many wallets, route volume through them, manufacture trending activity, and attract real users. The engine is built to detect the coordinated cluster behind that behavior.

## Architecture

```text
Solana RPC / Yellowstone gRPC
        ↓
Realtime Indexer → Kafka topics
        ↓
Transaction / Social / Funding processors
        ↓
Graph Worker → Neo4j
        ↓
Rule Engine + ML Engine + GNN-ready features
        ↓
Risk Scoring API
        ↓
Moderator Dashboard + Alerts
```

## Repository layout

```text
apps/
  api/            NestJS-style risk, cluster, and creator API
  indexer/        Solana realtime ingestion and event parsing scaffold
  graph-worker/   Graph builders and Neo4j persistence scaffold
  ml-engine/      Python feature extraction and risk inference
  dashboard/      Next.js moderator dashboard shell
packages/
  shared-types/   Cross-service TypeScript contracts
  scoring/        Shared risk scoring utilities
  graph-core/     Graph domain helpers
infrastructure/
  docker/         Local Kafka and Neo4j compose stack
docs/             Product and architecture documentation
```

## Quick start

```bash
npm install
npm run typecheck
python -m compileall apps/ml-engine/src
```

Start local infrastructure:

```bash
npm run infra:check
npm run infra:up
```

If Docker reports that it cannot connect to `unix:///var/run/docker.sock`, start your Docker daemon/Desktop first or see [`docs/local-infrastructure.md`](docs/local-infrastructure.md).

## Core signals

- Funding graph: common funders, fan-out patterns, exchange deposit reuse.
- Transaction graph: circular flows, repeated swaps, liquidity churn.
- Temporal graph: synchronized buys, bursts, and periodic activity.
- Social graph: creator/follower interaction overlap and fake engagement patterns.
- Behavioral graph: entropy, token diversity, creator diversity, and wallet maturity.

## Demo scenarios

- Live cluster visualization of coordinated wallets.
- Wash trading cycle detection.
- Fake trending detection with inorganic volume estimates.
- Creator trust score and human-probability style passport.
