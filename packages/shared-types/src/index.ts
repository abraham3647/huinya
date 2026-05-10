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
