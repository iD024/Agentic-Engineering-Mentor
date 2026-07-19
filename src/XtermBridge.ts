import { Terminal } from '@xterm/headless';
import { IPty } from 'node-pty';

export class XtermBridge {
    public terminal: Terminal;

    constructor(public pty: IPty, cols: number, rows: number) {
        this.terminal = new Terminal({ cols, rows, allowProposedApi: true });
        
        // Pipe PTY output into Headless Xterm
        this.pty.onData((data) => {
            this.terminal.write(data);
        });
    }

    // Get plain text representation of the current terminal grid
    getLines(): string[] {
        const buffer = this.terminal.buffer.active;
        const lines: string[] = [];
        for (let i = 0; i < buffer.viewportY + this.terminal.rows; i++) {
            const line = buffer.getLine(i);
            lines.push(line ? line.translateToString(true) : '');
        }
        // Return only the visible rows
        return lines.slice(-this.terminal.rows);
    }
}
