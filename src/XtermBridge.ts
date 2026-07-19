import { Terminal } from '@xterm/headless';

export class XtermBridge {
    private term: Terminal;

    constructor(private ptyProcess: any, cols: number, rows: number) {
        this.term = new Terminal({
            cols,
            rows,
            allowProposedApi: true
        });

        // Feed PTY output into the headless terminal
        this.ptyProcess.on('data', (data: string) => {
            this.term.write(data);
        });
    }

    getGrid(): string[] {
        const grid: string[] = [];
        const buffer = this.term.buffer.active;
        for (let i = 0; i < this.term.rows; i++) {
            const line = buffer.getLine(i);
            grid.push(line ? line.translateToString(true) : '');
        }
        return grid;
    }

    resize(cols: number, rows: number) {
        this.term.resize(cols, rows);
    }
}
