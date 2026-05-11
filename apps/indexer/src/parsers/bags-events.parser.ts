export type BagsEventType = 'token_created' | 'creator_followed' | 'fee_claimed' | 'launch_started';

export interface BagsEvent {
  type: BagsEventType;
  actor: string;
  creatorId?: string;
  tokenMint?: string;
  signature: string;
  occurredAt: string;
}

export function parseBagsEvent(event: BagsEvent): BagsEvent {
  return event;
}
