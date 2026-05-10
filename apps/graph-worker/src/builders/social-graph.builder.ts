import { createGraphEdge } from '../../../../packages/graph-core/src/index.js';

export function buildCreatorFollowEdge(wallet: string, creatorId: string) {
  return createGraphEdge({
    source: wallet,
    target: creatorId,
    signal: 'social',
    metadata: { kind: 'creator_follow' },
  });
}
