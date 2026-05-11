export const kafkaTopics = {
  rawSolanaTransactions: 'solana.raw.transactions',
  parsedTransfers: 'bags.parsed.transfers',
  parsedSwaps: 'bags.parsed.swaps',
  bagsEvents: 'bags.events',
  graphEdges: 'bags.graph.edges',
} as const;
