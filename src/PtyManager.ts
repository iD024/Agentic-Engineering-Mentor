import * as pty from 'node-pty';

export class PtyManager {
    spawn(shell: string, cols: number, rows: number): pty.IPty {
        const ptyProcess = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: cols,
            rows: rows,
            cwd: process.cwd(),
            env: process.env as any
        });
        
        return ptyProcess;
    }
}
