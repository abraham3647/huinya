import { ScoringService } from '../services/scoring.service.js';

export class CreatorController {
  constructor(private readonly scoringService = new ScoringService()) {}

  getIntegrity(creatorId: string) {
    return this.scoringService.scoreCreator(creatorId);
  }
}
