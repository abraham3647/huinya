import { buildWalletTransactionGraph } from '../../../../packages/graph-core/src/index.js';
import type { ParsedSolanaTransaction } from '../../../../packages/shared-types/src/index.js';

export function transactionsToGraphEdges(address: string, transactions: ParsedSolanaTransaction[]) {
  return buildWalletTransactionGraph(address, transactions).edges;
}
