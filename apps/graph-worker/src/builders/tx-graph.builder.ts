import type { GraphEdge } from '../../../../packages/shared-types/src/index.js';

export function detectSimpleCycle(edges: GraphEdge[]): boolean {
  const pairs = new Set(edges.map((edge) => `${edge.source}->${edge.target}`));
  return edges.some((edge) => pairs.has(`${edge.target}->${edge.source}`));
}
