import { ICommand } from './interfaces.js';

export interface ImportRepositoryResult {
  success: boolean;
  message: string;
  details: {
    clonedTo: string;
    filesIndexed: number;
    dbChanges: string[];
    errors: string[];
  };
}

export class ImportRepositoryCommand implements ICommand {
  readonly type = 'ImportRepositoryCommand';
  
  constructor(
    public readonly payload: {
      name: string;
      repositoryUrl: string;
      workspaceRoot: string;
    }
  ) {}
}
