import { ConsoleEventProducer } from './kafka/producer.js';
import { KafkaEventBus } from './kafka/client.js';
import { kafkaTopics } from './kafka/topics.js';
import { transactionsToGraphEdges } from './parsers/transaction.parser.js';
import { SolanaRpcClient } from './rpc/solana-rpc.js';

async function main(): Promise<void> {
  const address = process.env.WALLET_ADDRESS ?? '11111111111111111111111111111111';
  const endpoint = process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com';
  const limit = Number(process.env.SOLANA_TX_LIMIT ?? 5);
  const rpc = new SolanaRpcClient({ endpoint });
  const signatures = await rpc.getSignaturesForAddress(address, limit);
  const transactions = await rpc.getParsedTransactions(signatures);
  const edges = transactionsToGraphEdges(address, transactions);
  const producer = process.env.KAFKA_BROKERS
    ? new KafkaEventBus({ clientId: 'anti-sybil-indexer', brokers: process.env.KAFKA_BROKERS.split(',') })
    : new ConsoleEventProducer();

  for (const edge of edges) {
    await producer.publish(kafkaTopics.graphEdges, edge);
  }

  console.log(`indexed ${transactions.length} transactions and emitted ${edges.length} graph edges`);
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
