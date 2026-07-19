import * as chokidar from 'chokidar';
import { EventEmitter } from 'events';

export class WorkspaceWatcher extends EventEmitter {
    private watcher: chokidar.FSWatcher;
    private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor(private workspacePath: string) {
        super();
        this.watcher = chokidar.watch(this.workspacePath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true
        });

        this.watcher.on('change', this.handleChange);
    }

    private handleChange = (filePath: string) => {
        if (this.debounceTimers.has(filePath)) {
            clearTimeout(this.debounceTimers.get(filePath)!);
        }

        const timer = setTimeout(() => {
            this.emit('FILE_SAVED', filePath);
            this.debounceTimers.delete(filePath);
        }, 300); // 300ms debounce

        this.debounceTimers.set(filePath, timer);
    }

    close() {
        this.watcher.close();
    }
}
