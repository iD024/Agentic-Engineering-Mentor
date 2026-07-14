import { ICommand } from './interfaces.js';

export interface ImportKnowledgeResult {
  success: boolean;
  message: string;
  details: {
    copiedTo: string;
    dbChanges: string[];
    errors: string[];
  };
}

export class ImportKnowledgeCommand implements ICommand {
  readonly type = 'ImportKnowledgeCommand';
  
  constructor(
    public readonly payload: {
      filePath: string;
      type: string;
      workspaceRoot: string;
    }
  ) {}
}
