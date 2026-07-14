import type { StateManager, CreateMilestoneParams } from '../state/StateManager.js';
import type { MilestoneRepository } from '../repositories/MilestoneRepository.js';
import type { Milestone } from '../models/Milestone.js';

/**
 * Business-facing milestone service.
 *
 * Manages engineering milestone progression.
 * Business rule: milestones must be completed in order (by orderIndex).
 */
export class MilestoneService {
  private readonly stateManager: StateManager;
  private readonly milestoneRepo: MilestoneRepository;

  constructor(stateManager: StateManager, milestoneRepo: MilestoneRepository) {
    this.stateManager = stateManager;
    this.milestoneRepo = milestoneRepo;
  }

  /**
   * Creates a new milestone.
   *
   * @param params - Milestone parameters.
   * @returns The created milestone.
   */
  createMilestone(params: CreateMilestoneParams): Readonly<Milestone> {
    return this.stateManager.createMilestone(params);
  }

  /**
   * Marks a milestone as complete.
   *
   * Business rule: all lower-order milestones must already be completed.
   *
   * @param milestoneId - The milestone to complete.
   * @returns The completed milestone.
   * @throws If prerequisites are not met.
   */
  completeMilestone(milestoneId: string): Readonly<Milestone> {
    const target = this.milestoneRepo.findById(milestoneId);
    if (!target) {
      throw new Error(`Milestone not found: ${milestoneId}`);
    }

    const all = this.milestoneRepo.findByWorkspaceId(target.workspaceId);
    const prerequisites = all.filter(m => m.orderIndex < target.orderIndex);
    const incomplete = prerequisites.filter(m => m.state !== 'completed' && m.state !== 'skipped');

    if (incomplete.length > 0) {
      const titles = incomplete.map(m => m.title).join(', ');
      throw new Error(
        `Cannot complete milestone "${target.title}" — prerequisites not met: ${titles}`
      );
    }

    return this.stateManager.completeMilestone(milestoneId);
  }

  /**
   * Returns all milestones for a workspace in order.
   *
   * @param workspaceId - The workspace id.
   */
  listMilestones(workspaceId: string): ReadonlyArray<Readonly<Milestone>> {
    return this.milestoneRepo.findByWorkspaceId(workspaceId);
  }
}
