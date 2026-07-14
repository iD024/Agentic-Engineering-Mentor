import { ICommand } from './interfaces.js';

export class CreateWorkspaceCommand implements ICommand {
  readonly type = 'CreateWorkspaceCommand';
  
  constructor(
    public readonly payload: {
      name: string;
      description?: string;
      workspaceRoot: string;
    }
  ) {}
}
