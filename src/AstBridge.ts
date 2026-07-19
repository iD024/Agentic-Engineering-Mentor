import { fork, ChildProcess } from 'child_process';
import * as path from 'path';

export interface ParseResult {
    type: 'PARSE_RESULT';
    filePath: string;
    passed: boolean;
    error: string | null;
}

export class AstBridge {
    private worker: ChildProcess;
    private resolvers: Map<string, (result: ParseResult) => void> = new Map();

    constructor(workerPath: string = path.join(__dirname, 'workers', 'ast.worker.js')) {
        this.worker = fork(workerPath);

        this.worker.on('message', (msg: ParseResult) => {
            if (msg.type === 'PARSE_RESULT') {
                const resolver = this.resolvers.get(msg.filePath);
                if (resolver) {
                    resolver(msg);
                    this.resolvers.delete(msg.filePath);
                }
            }
        });
    }

    validate(filePath: string, query: string): Promise<ParseResult> {
        return new Promise((resolve) => {
            this.resolvers.set(filePath, resolve);
            this.worker.send({
                type: 'PARSE',
                filePath,
                query
            });
        });
    }

    kill() {
        if (!this.worker.killed) {
            this.worker.kill();
        }
    }
}
