import type { ParsedSolanaTransaction, SolanaSignatureSummary } from '../../../../packages/shared-types/src/index.js';

export interface SolanaRpcConfig {
  endpoint: string;
  maxRetries?: number;
  retryBaseDelayMs?: number;
  requestDelayMs?: number;
  onWarning?: (message: string) => void;
}

export class SolanaRpcClient {
  private readonly maxRetries: number;
  private readonly retryBaseDelayMs: number;
  private readonly requestDelayMs: number;

  constructor(private readonly config: SolanaRpcConfig) {
    this.maxRetries = config.maxRetries ?? Number(process.env.SOLANA_RPC_MAX_RETRIES ?? 5);
    this.retryBaseDelayMs = config.retryBaseDelayMs ?? Number(process.env.SOLANA_RPC_RETRY_BASE_DELAY_MS ?? 750);
    this.requestDelayMs = config.requestDelayMs ?? Number(process.env.SOLANA_RPC_REQUEST_DELAY_MS ?? 250);
  }

  async getSignaturesForAddress(address: string, limit = 10): Promise<SolanaSignatureSummary[]> {
    const result = await this.call<SolanaSignatureSummary[]>('getSignaturesForAddress', [address, { limit }]);
    return result.map((item) => ({
      signature: item.signature,
      slot: item.slot,
      blockTime: item.blockTime,
      err: item.err,
    }));
  }

  async getParsedTransactions(signatures: SolanaSignatureSummary[]): Promise<ParsedSolanaTransaction[]> {
    const transactions: ParsedSolanaTransaction[] = [];

    for (const [index, item] of signatures.entries()) {
      if (index > 0 && this.requestDelayMs > 0) {
        await sleep(this.requestDelayMs);
      }

      try {
        const transaction = await this.getParsedTransaction(item.signature);
        if (transaction) transactions.push(transaction);
      } catch (error) {
        this.warn(
          `Skipping transaction ${item.signature}: ${error instanceof Error ? error.message : 'unknown Solana RPC error'}`,
        );
      }
    }

    return transactions;
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
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: `${Date.now()}:${method}`, method, params }),
      });

      if (response.status === 429 || response.status >= 500) {
        lastError = new Error(`Solana RPC ${method} failed with HTTP ${response.status}`);
        if (attempt < this.maxRetries) {
          const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'));
          await this.waitForRetry(method, attempt, retryAfterMs, lastError.message);
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        throw new Error(`Solana RPC ${method} failed with HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (payload.error) {
        lastError = new Error(`Solana RPC ${method} error: ${JSON.stringify(payload.error)}`);
        if (isRetryableRpcError(payload.error) && attempt < this.maxRetries) {
          await this.waitForRetry(method, attempt, undefined, lastError.message);
          continue;
        }
        throw lastError;
      }
      return payload.result as T;
    }

    throw lastError ?? new Error(`Solana RPC ${method} failed`);
  }

  private async waitForRetry(method: string, attempt: number, retryAfterMs: number | undefined, reason: string): Promise<void> {
    const delayMs = retryAfterMs ?? this.retryBaseDelayMs * 2 ** attempt;
    this.warn(`${reason}; retrying ${method} in ${delayMs}ms (attempt ${attempt + 1}/${this.maxRetries})`);
    await sleep(delayMs);
  }

  private warn(message: string): void {
    if (this.config.onWarning) {
      this.config.onWarning(message);
      return;
    }
    console.warn(message);
  }
}

function isRetryableRpcError(error: { code?: number; message?: string }): boolean {
  const message = String(error.message ?? '').toLowerCase();
  return error.code === 429 || error.code === -32005 || message.includes('rate') || message.includes('too many requests');
}

function parseRetryAfterMs(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return undefined;
  return Math.max(0, timestamp - Date.now());
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
