import type { ICommand, ICommandHandler } from './interfaces.js';
import type { StateManager } from '../../state/StateManager.js';
import type { Milestone } from '../../models/Milestone.js';
import { MilestoneCompletedEvent } from '../../events/events/DomainEvents.js';
import type { EventBus } from '../../events/bus/EventBus.js';
import crypto from 'node:crypto';

export class CompleteMilestoneCommand implements ICommand {
  readonly type = 'CompleteMilestoneCommand';
  constructor(public readonly milestoneId: string) {}
}

export class CompleteMilestoneCommandHandler implements ICommandHandler<CompleteMilestoneCommand, void> {
  readonly commandType = 'CompleteMilestoneCommand';

  constructor(
    private readonly stateManager: StateManager,
    private readonly eventBus: EventBus
  ) {}

  async execute(command: CompleteMilestoneCommand): Promise<void> {
    const milestone = this.stateManager.completeMilestone(command.milestoneId);
    
    // Publish domain event
    this.eventBus.publish(new MilestoneCompletedEvent(
      {
        milestoneId: milestone.id,
        workspaceId: milestone.workspaceId
      },
      crypto.randomUUID(),
      'CompleteMilestoneCommandHandler'
    ));
  }
}
