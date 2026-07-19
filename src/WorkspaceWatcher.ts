import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';

export class WorkspaceWatcher extends EventEmitter {
    private watcher: chokidar.FSWatcher;
    private debounceMap: Map<string, NodeJS.Timeout> = new Map();

    constructor(private workspacePath: string, private debounceMs = 300) {
        super();
        this.watcher = chokidar.watch(this.workspacePath, {
            ignored: /(^|[\/\\])\..|node_modules|dist/,
            persistent: true,
            ignoreInitial: true
        });

        this.watcher.on('change', this.handleChange);
    }

    private handleChange = (filePath: string) => {
        if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx')) return;

        if (this.debounceMap.has(filePath)) {
            clearTimeout(this.debounceMap.get(filePath));
        }

        const timer = setTimeout(() => {
            this.debounceMap.delete(filePath);
            this.emit('FILE_SAVED', filePath);
        }, this.debounceMs);

        this.debounceMap.set(filePath, timer);
    };

    close() {
        this.watcher.close();
    }
}
