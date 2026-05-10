import type { GraphEdge } from '../../../../packages/shared-types/src/index.js';

export interface GraphRepository {
  upsertEdge(edge: GraphEdge): Promise<void>;
}

export class InMemoryGraphRepository implements GraphRepository {
  readonly edges: GraphEdge[] = [];

  async upsertEdge(edge: GraphEdge): Promise<void> {
    this.edges.push(edge);
  }
}
