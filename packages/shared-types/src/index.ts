export type GraphSignal = 'transaction' | 'social' | 'behavioral' | 'funding' | 'temporal';

export interface WalletActivity {
  wallet: string;
  firstSeenSlot?: number;
  txCount: number;
  avgVolumeUsd: number;
  tokenDiversity: number;
  creatorDiversity: number;
  entropy: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  signal: GraphSignal;
  weight: number;
  observedAt: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: 'wallet' | 'transaction' | 'creator' | 'token' | 'funder';
  risk?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface WalletGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface SolanaSignatureSummary {
  signature: string;
  slot: number;
  blockTime?: number;
  err?: unknown;
}

export interface ParsedSolanaTransaction {
  signature: string;
  slot: number;
  blockTime?: number;
  feePayer: string;
  accounts: string[];
  tokenMints: string[];
  nativeBalanceDeltaLamports: number;
}

export interface WalletAnalysisRequest {
  address: string;
  limit: number;
}

export interface WalletAnalysisResponse {
  address: string;
  risk: number;
  cluster: ClusterRisk;
  graph: WalletGraph;
  transactions: ParsedSolanaTransaction[];
  reasons: string[];
}

export interface ClusterRisk {
  clusterId: string;
  coordinatedProbability: number;
  inorganicVolumeShare: number;
  walletCount: number;
  topReasons: string[];
}

export interface CreatorIntegrity {
  creatorId: string;
  organicScore: number;
  sybilRisk: number;
  trendingManipulationRisk: number;
  reasons: string[];
}
