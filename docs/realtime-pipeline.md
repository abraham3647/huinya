# Realtime pipeline runbook

This project now has real adapters for the end-to-end flow:

```text
Solana JSON-RPC -> indexer -> Kafka topic -> graph-worker -> Neo4j -> HTTP API -> dashboard
```

## 1. Configure environment

```bash
cp .env.example .env
```

Set `SOLANA_RPC_URL` to a Solana RPC endpoint. Public RPC works for smoke tests, but a paid RPC is recommended for repeated analysis because public endpoints are rate limited.

## 2. Start Kafka and Neo4j

```bash
npm run infra:check
npm run infra:up
```

If Docker cannot connect to `unix:///var/run/docker.sock`, start Docker Desktop or the Docker daemon first. See `docs/local-infrastructure.md`.

## 3. Build the TypeScript services

```bash
npm run build
```

## 4. Start graph ingestion

In terminal A:

```bash
KAFKA_BROKERS=localhost:9092 \
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=anti-sybil-local \
npm run dev:graph-worker
```

The graph worker consumes `bags.graph.edges` from Kafka and upserts graph relationships into Neo4j.

## 5. Start the indexer

In terminal B:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
KAFKA_BROKERS=localhost:9092 \
WALLET_ADDRESS=<SOLANA_WALLET> \
SOLANA_TX_LIMIT=25 \
npm run dev:indexer
```

The indexer reads recent wallet signatures and parsed transactions from Solana JSON-RPC, converts them into wallet/transaction graph edges, and publishes them to Kafka.

## 6. Start the HTTP API

In terminal C:

```bash
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com \
NEO4J_URI=bolt://localhost:7687 \
NEO4J_USERNAME=neo4j \
NEO4J_PASSWORD=anti-sybil-local \
PORT=3001 \
npm run dev:api
```

Useful endpoints:

```bash
curl http://localhost:3001/health
curl 'http://localhost:3001/wallet/<SOLANA_WALLET>/analyze?limit=10'
curl http://localhost:3001/wallet/<SOLANA_WALLET>/risk
curl http://localhost:3001/cluster/demo-cluster
```

## 7. Start the dashboard

In terminal D:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev:dashboard
```

Open `http://localhost:3000`, paste a wallet address, and run analysis. The dashboard renders wallet nodes, transaction nodes, graph edges, risk score, cluster probability, explanations, and recent transaction signatures.

## No-Kafka smoke mode

For quick tests without Docker, build and run:

```bash
npm run build
node dist/apps/api/src/main.js
python3 apps/ml-engine/src/main.py
```

The API can analyze directly from Solana RPC without Kafka. Neo4j writes are enabled only when `NEO4J_URI` is set.
