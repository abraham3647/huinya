import type { GraphEdge, GraphSignal } from '../../shared-types/src/index.js';

export function createGraphEdge(params: {
  source: string;
  target: string;
  signal: GraphSignal;
  weight?: number;
  observedAt?: Date;
  metadata?: GraphEdge['metadata'];
}): GraphEdge {
  return {
    source: params.source,
    target: params.target,
    signal: params.signal,
    weight: params.weight ?? 1,
    observedAt: (params.observedAt ?? new Date()).toISOString(),
    metadata: params.metadata,
  };
}

export function normalizeWallet(address: string): string {
  return address.trim();
}
