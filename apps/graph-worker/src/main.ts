import { InMemoryGraphRepository } from './neo4j/client.js';
import { buildFundingEdges } from './builders/funding-graph.builder.js';

async function main(): Promise<void> {
  const repository = new InMemoryGraphRepository();
  const edges = buildFundingEdges('FunderWallet', ['WalletA', 'WalletB', 'WalletC']);

  await Promise.all(edges.map((edge) => repository.upsertEdge(edge)));
  console.log(`graph-worker stored ${repository.edges.length} demo edges`);
}

main().catch((error: unknown) => {
  console.error(error);
  throw error;
});
