import { ConsoleEventProducer } from './kafka/producer.js';
import { kafkaTopics } from './kafka/topics.js';
import { parseTransferEvent } from './parsers/transfer.parser.js';

async function main(): Promise<void> {
  const producer = new ConsoleEventProducer();
  const graphEdge = parseTransferEvent({
    from: 'WalletA',
    to: 'WalletB',
    mint: 'CreatorTokenMint',
    amount: 100,
    signature: 'demo-signature',
    slot: 1,
  });

  await producer.publish(kafkaTopics.graphEdges, graphEdge);
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
