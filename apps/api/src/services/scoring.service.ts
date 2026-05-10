import { aggregateClusterRisk, scoreWalletActivity } from '../../../../packages/scoring/src/index.js';
import type { ClusterRisk, CreatorIntegrity, WalletActivity } from '../../../../packages/shared-types/src/index.js';

export class ScoringService {
  scoreWallet(activity: WalletActivity): number {
    return scoreWalletActivity(activity);
  }

  scoreCluster(clusterId: string, activities: WalletActivity[]): ClusterRisk {
    const walletScores = activities.map((activity) => this.scoreWallet(activity));

    return aggregateClusterRisk({
      clusterId,
      walletScores,
      cycleScore: 0.82,
      fundingScore: 0.88,
      temporalScore: 0.76,
      inorganicVolumeShare: 0.81,
    });
  }

  scoreCreator(creatorId: string): CreatorIntegrity {
    return {
      creatorId,
      organicScore: 94,
      sybilRisk: 3,
      trendingManipulationRisk: 7,
      reasons: ['diverse holders', 'low synchronized volume', 'organic creator engagement'],
    };
  }
}
