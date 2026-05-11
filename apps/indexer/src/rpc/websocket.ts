import type { SubscriptionConfig } from './subscriptions.js';

export class SolanaWebsocketClient {
  constructor(private readonly config: SubscriptionConfig) {}

  describe(): string {
    return `websocket subscriptions=${this.config.programIds.length} commitment=${this.config.commitment}`;
  }
}
