import type { GraphEdge, GraphNode, GraphSignal, ParsedSolanaTransaction, WalletGraph } from '../../shared-types/src/index.js';

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

export function createGraphNode(params: GraphNode): GraphNode {
  return params;
}

export function buildWalletTransactionGraph(address: string, transactions: ParsedSolanaTransaction[]): WalletGraph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const addWallet = (wallet: string) => {
    if (!nodes.has(wallet)) {
      nodes.set(wallet, createGraphNode({ id: wallet, label: shortId(wallet), kind: 'wallet' }));
    }
  };

  addWallet(address);

  for (const transaction of transactions) {
    const txNodeId = `tx:${transaction.signature}`;
    nodes.set(
      txNodeId,
      createGraphNode({
        id: txNodeId,
        label: shortId(transaction.signature),
        kind: 'transaction',
        metadata: { signature: transaction.signature, slot: transaction.slot, feePayer: transaction.feePayer },
      }),
    );

    addWallet(transaction.feePayer);
    edges.push(
      createGraphEdge({
        source: transaction.feePayer,
        target: txNodeId,
        signal: 'transaction',
        weight: Math.max(1, Math.abs(transaction.nativeBalanceDeltaLamports)),
        observedAt: transaction.blockTime ? new Date(transaction.blockTime * 1000) : undefined,
        metadata: { signature: transaction.signature, relation: 'fee_payer' },
      }),
    );

    for (const account of transaction.accounts.slice(0, 12)) {
      addWallet(account);
      edges.push(
        createGraphEdge({
          source: txNodeId,
          target: account,
          signal: 'transaction',
          observedAt: transaction.blockTime ? new Date(transaction.blockTime * 1000) : undefined,
          metadata: { signature: transaction.signature, relation: 'account' },
        }),
      );
    }
  }

  return { nodes: [...nodes.values()], edges };
}

function shortId(value: string): string {
  return value.length <= 12 ? value : `${value.slice(0, 4)}…${value.slice(-4)}`;
}
