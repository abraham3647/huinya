import { createGraphEdge } from '../../../../packages/graph-core/src/index.js';

export interface TransferEvent {
  from: string;
  to: string;
  mint: string;
  amount: number;
  signature: string;
  slot: number;
}

export function parseTransferEvent(raw: TransferEvent) {
  return createGraphEdge({
    source: raw.from,
    target: raw.to,
    signal: 'transaction',
    weight: Math.max(1, raw.amount),
    metadata: {
      mint: raw.mint,
      signature: raw.signature,
      slot: raw.slot,
      kind: 'token_transfer',
    },
  });
}
