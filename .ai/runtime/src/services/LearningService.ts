import type { StateManager, SaveLearningProgressParams } from '../state/StateManager.js';
import type { LearningRepository } from '../repositories/LearningRepository.js';
import type { LearningProgress } from '../models/LearningProgress.js';

/**
 * Business-facing learning progress service.
 *
 * Manages tracking of engineering competency across topics.
 */
export class LearningService {
  private readonly stateManager: StateManager;
  private readonly learningRepo: LearningRepository;

  constructor(stateManager: StateManager, learningRepo: LearningRepository) {
    this.stateManager = stateManager;
    this.learningRepo = learningRepo;
  }

  /**
   * Records or updates learning progress for a topic.
   *
   * Business rule: progress can only advance (novice → expert), never regress.
   * If the caller attempts to lower the level, the existing level is preserved.
   *
   * @param params - Learning progress parameters.
   * @returns The saved progress record.
   */
  saveProgress(params: SaveLearningProgressParams): Readonly<LearningProgress> {
    const existing = this.learningRepo.findByTopic(params.workspaceId, params.topic);
    if (existing && this.levelRank(params.level) < this.levelRank(existing.level)) {
      // Business rule: do not regress competency.
      return Object.freeze({ ...existing });
    }
    return this.stateManager.saveLearningProgress(params);
  }

  /**
   * Lists all learning progress records for a workspace.
   *
   * @param workspaceId - The workspace id.
   */
  listProgress(workspaceId: string): ReadonlyArray<Readonly<LearningProgress>> {
    return this.learningRepo.findByWorkspaceId(workspaceId);
  }

  private levelRank(level: LearningProgress['level']): number {
    const ranks: Record<LearningProgress['level'], number> = {
      novice: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4,
    };
    return ranks[level];
  }
}
