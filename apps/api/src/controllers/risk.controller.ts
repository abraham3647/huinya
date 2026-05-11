import { ScoringService } from '../services/scoring.service.js';
import type { WalletActivity } from '../../../../packages/shared-types/src/index.js';

export class RiskController {
  constructor(private readonly scoringService = new ScoringService()) {}

  getWalletRisk(address: string) {
    const activity: WalletActivity = {
      wallet: address,
      txCount: 240,
      avgVolumeUsd: 7_500,
      tokenDiversity: 2,
      creatorDiversity: 1,
      entropy: 1.4,
    };

    return {
      address,
      risk: this.scoringService.scoreWallet(activity),
      reasons: ['low diversity', 'high volume intensity', 'low behavioral entropy'],
    };
  }
}
