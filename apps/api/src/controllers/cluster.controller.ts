import { GraphService } from '../services/graph.service.js';
import { ScoringService } from '../services/scoring.service.js';

export class ClusterController {
  constructor(
    private readonly scoringService = new ScoringService(),
    private readonly graphService = new GraphService(),
  ) {}

  async getCluster(clusterId: string) {
    const risk = this.scoringService.scoreCluster(clusterId, [
      { wallet: 'WalletA', txCount: 120, avgVolumeUsd: 5_000, tokenDiversity: 1, creatorDiversity: 1, entropy: 1.2 },
      { wallet: 'WalletB', txCount: 118, avgVolumeUsd: 5_100, tokenDiversity: 1, creatorDiversity: 1, entropy: 1.1 },
    ]);

    return {
      risk,
      edges: await this.graphService.getClusterEdges(clusterId),
    };
  }
}
