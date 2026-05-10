import { buildWalletTransactionGraph } from '../../../../packages/graph-core/src/index.js';
import { aggregateClusterRisk, scoreWalletActivity } from '../../../../packages/scoring/src/index.js';
import type { ParsedSolanaTransaction, WalletActivity, WalletAnalysisResponse } from '../../../../packages/shared-types/src/index.js';
import { Neo4jGraphRepository, type GraphRepository } from '../../../graph-worker/src/neo4j/client.js';
import { SolanaRpcClient } from '../../../indexer/src/rpc/solana-rpc.js';

export class AnalysisService {
  constructor(
    private readonly rpc = new SolanaRpcClient({ endpoint: process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com' }),
    private readonly repository: GraphRepository | undefined = createGraphRepository(),
  ) {}

  async analyzeWallet(address: string, limit = 10): Promise<WalletAnalysisResponse> {
    const transactions = await this.loadTransactionsForAddress(address, limit);
    return this.buildAnalysis({
      targetType: 'wallet',
      address,
      transactions,
      clusterId: `wallet:${address}`,
      rootKind: 'wallet',
      fallbackReason: 'wallet transaction graph analyzed from Solana RPC',
    });
  }

  async analyzeToken(mint: string, limit = 10): Promise<WalletAnalysisResponse> {
    const transactions = (await this.loadTransactionsForAddress(mint, limit)).filter((transaction) => {
      return transaction.accounts.includes(mint) || transaction.tokenMints.includes(mint);
    });

    return this.buildAnalysis({
      targetType: 'token',
      address: mint,
      transactions,
      clusterId: `token:${mint}`,
      rootKind: 'token',
      fallbackReason:
        'token mint-centric graph analyzed from Solana RPC; for full holder/trade coverage use an indexed token-transfer provider',
    });
  }

  private async loadTransactionsForAddress(address: string, limit: number): Promise<ParsedSolanaTransaction[]> {
    const signatures = await this.rpc.getSignaturesForAddress(address, limit);
    return this.rpc.getParsedTransactions(signatures);
  }

  private async buildAnalysis(params: {
    targetType: 'wallet' | 'token';
    address: string;
    transactions: ParsedSolanaTransaction[];
    clusterId: string;
    rootKind: 'wallet' | 'token';
    fallbackReason: string;
  }): Promise<WalletAnalysisResponse> {
    const graph = buildWalletTransactionGraph(params.address, params.transactions, params.rootKind);

    if (this.repository) {
      await Promise.all(graph.edges.map((edge) => this.repository?.upsertEdge(edge)));
    }

    const activity = this.toWalletActivity(params.address, params.transactions);
    const risk = scoreWalletActivity(activity);
    const cluster = aggregateClusterRisk({
      clusterId: params.clusterId,
      walletScores: [risk],
      cycleScore: estimateCycleScore(params.transactions),
      fundingScore: estimateCommonFunderScore(params.transactions),
      temporalScore: estimateTemporalScore(params.transactions),
      inorganicVolumeShare: estimateInorganicShare(params.transactions),
    });

    return {
      targetType: params.targetType,
      address: params.address,
      risk,
      cluster,
      graph,
      transactions: params.transactions,
      reasons: cluster.topReasons.length ? cluster.topReasons : [params.fallbackReason],
    };
  }

  private toWalletActivity(address: string, transactions: ParsedSolanaTransaction[]): WalletActivity {
    const tokenMints = new Set(transactions.flatMap((transaction) => transaction.tokenMints));
    const counterparties = new Set(
      transactions.flatMap((transaction) => transaction.accounts.filter((account) => account !== address)).slice(0, 100),
    );

    return {
      wallet: address,
      txCount: transactions.length,
      avgVolumeUsd: averageLamports(transactions) / 1_000_000_000 * 150,
      tokenDiversity: Math.max(1, tokenMints.size),
      creatorDiversity: Math.max(1, counterparties.size),
      entropy: Math.log2(Math.max(2, counterparties.size + tokenMints.size)),
    };
  }
}

function createGraphRepository(): GraphRepository | undefined {
  if (!process.env.NEO4J_URI) return undefined;
  return new Neo4jGraphRepository({
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME ?? 'neo4j',
    password: process.env.NEO4J_PASSWORD ?? 'anti-sybil-local',
  });
}

function averageLamports(transactions: ParsedSolanaTransaction[]): number {
  if (!transactions.length) return 0;
  return transactions.reduce((sum, tx) => sum + Math.abs(tx.nativeBalanceDeltaLamports), 0) / transactions.length;
}

function estimateCycleScore(transactions: ParsedSolanaTransaction[]): number {
  const feePayers = new Set(transactions.map((transaction) => transaction.feePayer));
  return Math.min(1, feePayers.size / Math.max(1, transactions.length));
}

function estimateCommonFunderScore(transactions: ParsedSolanaTransaction[]): number {
  const feePayerCounts = new Map<string, number>();
  for (const transaction of transactions) {
    feePayerCounts.set(transaction.feePayer, (feePayerCounts.get(transaction.feePayer) ?? 0) + 1);
  }
  const maxCount = Math.max(0, ...feePayerCounts.values());
  return transactions.length ? maxCount / transactions.length : 0;
}

function estimateTemporalScore(transactions: ParsedSolanaTransaction[]): number {
  const times = transactions.map((transaction) => transaction.blockTime).filter((time): time is number => typeof time === 'number');
  if (times.length < 2) return 0;
  const sorted = [...times].sort((a, b) => a - b);
  const closePairs = sorted.slice(1).filter((time, index) => time - sorted[index] <= 60).length;
  return closePairs / (sorted.length - 1);
}

function estimateInorganicShare(transactions: ParsedSolanaTransaction[]): number {
  if (!transactions.length) return 0;
  const tokenTx = transactions.filter((transaction) => transaction.tokenMints.length > 0).length;
  return tokenTx / transactions.length;
}
