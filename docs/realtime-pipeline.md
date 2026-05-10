# Realtime pipeline runbook

This project now has real adapters for the end-to-end flow:

```text
Solana JSON-RPC -> indexer -> Kafka topic -> graph-worker -> Neo4j -> HTTP API -> dashboard
```

## 1. Configure environment

```bash
cp .env.example .env
```

Set `SOLANA_RPC_URL` to a Solana RPC endpoint. Public RPC works for small smoke tests, but a paid RPC is recommended for repeated analysis because public endpoints are rate limited. The indexer fetches transactions sequentially and retries HTTP 429 responses with exponential backoff; keep `SOLANA_TX_LIMIT` low, for example `5`, when using public RPC.

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
SOLANA_TX_LIMIT=5 \
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
curl 'http://localhost:3001/wallet/<SOLANA_WALLET>/analyze?limit=5'
curl 'http://localhost:3001/token/<TOKEN_MINT>/analyze?limit=5'
curl http://localhost:3001/wallet/<SOLANA_WALLET>/risk
curl http://localhost:3001/cluster/demo-cluster
```

## 7. Start the dashboard

In terminal D:

```bash
API_BASE_URL=http://localhost:3001 NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev:dashboard
```

Open `http://localhost:3000`, choose `Wallet` for a wallet owner address or `Token mint` for a token mint address, start with a small limit such as `5`, and run analysis. The dashboard calls its same-origin `/api/analyze` proxy, which forwards to `API_BASE_URL` so browser CORS and `Failed to fetch` errors are converted into actionable JSON messages. The dashboard renders wallet nodes, transaction nodes, graph edges, risk score, cluster probability, explanations, and recent transaction signatures.

## Wallet address vs token mint address

The dashboard has two explicit modes:

- `Wallet`: enter a Solana wallet/owner address. The API calls `/wallet/:address/analyze`, fetches recent signatures for that wallet, builds a wallet ↔ transaction graph, and scores coordinated behavior around that wallet.
- `Token mint`: enter the SPL token mint address. The API calls `/token/:mint/analyze`, fetches recent signatures involving the mint account, filters parsed transactions that mention that mint, and builds a token mint ↔ transaction graph.

Important limitation: Solana public JSON-RPC is not a full token-holder or DEX trade indexer. Searching by the mint address only sees transactions where the mint account appears in the transaction account list or token balance metadata. For production-grade token analysis, connect the indexer to a token-transfer source such as Helius enhanced transactions/DAS, Triton, Yellowstone gRPC, or your own historical indexer.

## Dashboard says `Failed to fetch`

The dashboard needs the backend API to be reachable from the Next.js server. Start the API first:

```bash
npm run build
PORT=3001 npm run dev:api
```

Then start the dashboard with an explicit API URL:

```bash
API_BASE_URL=http://localhost:3001 NEXT_PUBLIC_API_URL=http://localhost:3001 npm run dev:dashboard
```

The browser no longer calls the API directly. It calls `/api/analyze` on the dashboard, and that proxy calls the backend. If the backend is down or on a different port, the dashboard shows a clear hint instead of a generic browser `Failed to fetch`.

## RPC rate limits

If you see `HTTP 429`, the Solana RPC provider is throttling requests. Use one or more of these fixes:

- Reduce `SOLANA_TX_LIMIT` or dashboard limit to `5` or lower.
- Increase `SOLANA_RPC_REQUEST_DELAY_MS` to `500`-`1500`.
- Increase `SOLANA_RPC_MAX_RETRIES` for slow public RPC endpoints.
- Prefer a dedicated Helius, Triton, QuickNode, Alchemy, or other paid Solana RPC URL for demos.

The indexer skips individual transactions that still fail after retries, so one throttled `getTransaction` response no longer crashes the whole run.

## No-Kafka smoke mode

For quick tests without Docker, build and run:

```bash
npm run build
node dist/apps/api/src/main.js
python3 apps/ml-engine/src/main.py
```

The API can analyze directly from Solana RPC without Kafka. Neo4j writes are enabled only when `NEO4J_URI` is set.
