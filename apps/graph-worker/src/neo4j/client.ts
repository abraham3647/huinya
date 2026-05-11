import type { GraphEdge, WalletGraph } from '../../../../packages/shared-types/src/index.js';

export interface GraphRepository {
  upsertEdge(edge: GraphEdge): Promise<void>;
  getWalletGraph(address: string, limit?: number): Promise<WalletGraph>;
  close?(): Promise<void>;
}

export class InMemoryGraphRepository implements GraphRepository {
  readonly edges: GraphEdge[] = [];

  async upsertEdge(edge: GraphEdge): Promise<void> {
    this.edges.push(edge);
  }

  async getWalletGraph(address: string, limit = 100): Promise<WalletGraph> {
    const edges = this.edges
      .filter((edge) => edge.source === address || edge.target === address || edge.source.startsWith('tx:'))
      .slice(0, limit);
    const nodeIds = new Set<string>();
    for (const edge of edges) {
      nodeIds.add(edge.source);
      nodeIds.add(edge.target);
    }

    return {
      nodes: [...nodeIds].map((id) => ({
        id,
        label: id.length <= 12 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`,
        kind: id.startsWith('tx:') ? 'transaction' : 'wallet',
      })),
      edges,
    };
  }
}

export class Neo4jGraphRepository implements GraphRepository {
  private driver: any;

  constructor(private readonly config: { uri: string; username: string; password: string }) {}

  async upsertEdge(edge: GraphEdge): Promise<void> {
    const session = await this.session();
    try {
      await session.run(
        `
        MERGE (source:GraphNode {id: $source})
        ON CREATE SET source.kind = CASE WHEN $source STARTS WITH 'tx:' THEN 'transaction' ELSE 'wallet' END,
                      source.label = $source
        MERGE (target:GraphNode {id: $target})
        ON CREATE SET target.kind = CASE WHEN $target STARTS WITH 'tx:' THEN 'transaction' ELSE 'wallet' END,
                      target.label = $target
        MERGE (source)-[edge:RELATED {signal: $signal, signature: $signature}]->(target)
        SET edge.weight = coalesce(edge.weight, 0) + $weight,
            edge.observedAt = datetime($observedAt),
            edge.metadata = $metadata
        `,
        {
          source: edge.source,
          target: edge.target,
          signal: edge.signal,
          signature: edge.metadata?.signature ?? `${edge.source}:${edge.target}:${edge.signal}`,
          weight: edge.weight,
          observedAt: edge.observedAt,
          metadata: JSON.stringify(edge.metadata ?? {}),
        },
      );
    } finally {
      await session.close();
    }
  }

  async getWalletGraph(address: string, limit = 100): Promise<WalletGraph> {
    const session = await this.session();
    try {
      const result = await session.run(
        `
        MATCH path = (wallet:GraphNode {id: $address})-[*1..2]-(neighbor:GraphNode)
        WITH relationships(path) AS rels, nodes(path) AS ns
        UNWIND rels AS rel
        WITH DISTINCT rel LIMIT $limit
        RETURN startNode(rel).id AS source,
               endNode(rel).id AS target,
               type(rel) AS type,
               rel.signal AS signal,
               rel.weight AS weight,
               toString(rel.observedAt) AS observedAt,
               rel.metadata AS metadata
        `,
        { address, limit },
      );
      const edges: GraphEdge[] = result.records.map((record: any) => ({
        source: record.get('source'),
        target: record.get('target'),
        signal: record.get('signal') ?? 'transaction',
        weight: Number(record.get('weight') ?? 1),
        observedAt: record.get('observedAt') ?? new Date().toISOString(),
        metadata: parseMetadata(record.get('metadata')),
      }));
      const nodeIds = new Set<string>([address]);
      for (const edge of edges) {
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
      return {
        nodes: [...nodeIds].map((id) => ({
          id,
          label: id.length <= 12 ? id : `${id.slice(0, 4)}…${id.slice(-4)}`,
          kind: id.startsWith('tx:') ? 'transaction' : 'wallet',
        })),
        edges,
      };
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    if (this.driver) await this.driver.close();
  }

  private async session(): Promise<any> {
    if (!this.driver) {
      const neo4j = (await import('neo4j-driver')).default;
      this.driver = neo4j.driver(this.config.uri, neo4j.auth.basic(this.config.username, this.config.password));
    }
    return this.driver.session();
  }
}

function parseMetadata(value: unknown): Record<string, string | number | boolean> | undefined {
  if (typeof value !== 'string') return undefined;
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}
