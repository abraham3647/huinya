import { KafkaEventBus } from '../../indexer/src/kafka/client.js';
import { kafkaTopics } from '../../indexer/src/kafka/topics.js';
import type { GraphEdge } from '../../../packages/shared-types/src/index.js';
import { InMemoryGraphRepository, Neo4jGraphRepository, type GraphRepository } from './neo4j/client.js';

function createRepository(): GraphRepository {
  if (process.env.NEO4J_URI) {
    return new Neo4jGraphRepository({
      uri: process.env.NEO4J_URI,
      username: process.env.NEO4J_USERNAME ?? 'neo4j',
      password: process.env.NEO4J_PASSWORD ?? 'anti-sybil-local',
    });
  }
  return new InMemoryGraphRepository();
}

async function main(): Promise<void> {
  const repository = createRepository();

  if (process.env.KAFKA_BROKERS) {
    const bus = new KafkaEventBus({ clientId: 'anti-sybil-graph-worker', brokers: process.env.KAFKA_BROKERS.split(',') });
    await bus.consume(kafkaTopics.graphEdges, 'anti-sybil-graph-worker', async (payload) => {
      await repository.upsertEdge(payload as GraphEdge);
      console.log(`stored edge ${(payload as GraphEdge).source} -> ${(payload as GraphEdge).target}`);
    });
    return;
  }

  await repository.upsertEdge({
    source: 'WalletA',
    target: 'tx:demo-signature',
    signal: 'transaction',
    weight: 1,
    observedAt: new Date().toISOString(),
    metadata: { signature: 'demo-signature' },
  });
  console.log('graph-worker stored 1 demo edge; set KAFKA_BROKERS and NEO4J_URI for realtime mode');
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
