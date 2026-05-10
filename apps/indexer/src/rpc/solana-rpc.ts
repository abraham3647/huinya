import type { ParsedSolanaTransaction, SolanaSignatureSummary } from '../../../../packages/shared-types/src/index.js';

export interface SolanaRpcConfig {
  endpoint: string;
}

export class SolanaRpcClient {
  constructor(private readonly config: SolanaRpcConfig) {}

  async getSignaturesForAddress(address: string, limit = 25): Promise<SolanaSignatureSummary[]> {
    const result = await this.call<SolanaSignatureSummary[]>('getSignaturesForAddress', [address, { limit }]);
    return result.map((item) => ({
      signature: item.signature,
      slot: item.slot,
      blockTime: item.blockTime,
      err: item.err,
    }));
  }

  async getParsedTransaction(signature: string): Promise<ParsedSolanaTransaction | undefined> {
    const tx = await this.call<any>('getTransaction', [
      signature,
      { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 },
    ]);
    if (!tx?.transaction?.message) return undefined;

    const accountKeys = tx.transaction.message.accountKeys ?? [];
    const accounts = accountKeys
      .map((account: any) => (typeof account === 'string' ? account : account.pubkey))
      .filter((account: unknown): account is string => typeof account === 'string');
    const feePayer = accounts[0] ?? 'unknown';
    const preBalances: number[] = tx.meta?.preBalances ?? [];
    const postBalances: number[] = tx.meta?.postBalances ?? [];
    const nativeBalanceDeltaLamports = postBalances.reduce((sum, balance, index) => {
      return sum + (balance - (preBalances[index] ?? 0));
    }, 0);
    const tokenMints = new Set<string>();
    for (const balance of [...(tx.meta?.preTokenBalances ?? []), ...(tx.meta?.postTokenBalances ?? [])]) {
      if (typeof balance?.mint === 'string') tokenMints.add(balance.mint);
    }

    return {
      signature,
      slot: tx.slot,
      blockTime: tx.blockTime,
      feePayer,
      accounts,
      tokenMints: [...tokenMints],
      nativeBalanceDeltaLamports,
    };
  }

  private async call<T>(method: string, params: unknown[]): Promise<T> {
    const response = await fetch(this.config.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: `${Date.now()}:${method}`, method, params }),
    });

    if (!response.ok) {
      throw new Error(`Solana RPC ${method} failed with HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (payload.error) {
      throw new Error(`Solana RPC ${method} error: ${JSON.stringify(payload.error)}`);
    }
    return payload.result as T;
  }
}
