import type { ClusterRisk, WalletActivity } from '../../shared-types/src/index.js';

export interface RiskWeights {
  funding: number;
  cycles: number;
  temporal: number;
  entropy: number;
}

export const defaultRiskWeights: RiskWeights = {
  funding: 0.3,
  cycles: 0.25,
  temporal: 0.25,
  entropy: 0.2,
};

export function clampProbability(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function scoreWalletActivity(activity: WalletActivity): number {
  const lowDiversityPenalty = 1 - Math.min(1, (activity.tokenDiversity + activity.creatorDiversity) / 20);
  const volumeIntensity = Math.min(1, activity.avgVolumeUsd / 10_000);
  const entropySignal = 1 - Math.min(1, activity.entropy / 8);

  return clampProbability(lowDiversityPenalty * 0.35 + volumeIntensity * 0.35 + entropySignal * 0.3);
}

export function aggregateClusterRisk(input: {
  clusterId: string;
  walletScores: number[];
  cycleScore: number;
  fundingScore: number;
  temporalScore: number;
  inorganicVolumeShare: number;
}): ClusterRisk {
  const walletMean = input.walletScores.length
    ? input.walletScores.reduce((sum, value) => sum + value, 0) / input.walletScores.length
    : 0;
  const coordinatedProbability = clampProbability(
    walletMean * 0.25 + input.cycleScore * 0.25 + input.fundingScore * 0.25 + input.temporalScore * 0.25,
  );

  return {
    clusterId: input.clusterId,
    coordinatedProbability,
    inorganicVolumeShare: clampProbability(input.inorganicVolumeShare),
    walletCount: input.walletScores.length,
    topReasons: [
      input.fundingScore > 0.7 ? 'common funding source' : undefined,
      input.cycleScore > 0.7 ? 'cyclic trading behavior' : undefined,
      input.temporalScore > 0.7 ? 'synchronized activity bursts' : undefined,
    ].filter((reason): reason is string => Boolean(reason)),
  };
}
