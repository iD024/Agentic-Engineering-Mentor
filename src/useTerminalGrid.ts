import { useState, useEffect } from 'react';
import { XtermBridge } from './XtermBridge';

export function useTerminalGrid(bridge: XtermBridge | null) {
    const [grid, setGrid] = useState<string[]>([]);

    useEffect(() => {
        if (!bridge) return;

        let active = true;
        
        // 60 fps render loop
        const interval = setInterval(() => {
            if (active) {
                setGrid(bridge.getGrid());
            }
        }, 16);

        // Basic SIGWINCH resize handling
        const handleResize = () => {
            active = false;
            // In a real app we'd recalculate cols/rows here using process.stdout.columns
            // and call bridge.resize(), then pty.resize()
            active = true;
        };
        process.on('SIGWINCH', handleResize);

        return () => {
            clearInterval(interval);
            process.off('SIGWINCH', handleResize);
        };
    }, [bridge]);

    return grid;
}
