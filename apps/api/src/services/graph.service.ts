import type { GraphEdge } from '../../../../packages/shared-types/src/index.js';

export class GraphService {
  async getClusterEdges(clusterId: string): Promise<GraphEdge[]> {
    return [
      {
        source: `${clusterId}:wallet-a`,
        target: `${clusterId}:wallet-b`,
        signal: 'transaction',
        weight: 42,
        observedAt: new Date(0).toISOString(),
        metadata: { kind: 'demo_cycle' },
      },
    ];
  }
}
