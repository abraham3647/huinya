import { createGraphEdge } from '../../../../packages/graph-core/src/index.js';

export function buildFundingEdges(funder: string, fundedWallets: string[]) {
  return fundedWallets.map((wallet) =>
    createGraphEdge({
      source: funder,
      target: wallet,
      signal: 'funding',
      metadata: { kind: 'common_funder' },
    }),
  );
}
