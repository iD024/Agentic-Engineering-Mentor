import { useState, useEffect } from 'react';
import { XtermBridge } from './XtermBridge';

export function useTerminalGrid(bridge: XtermBridge | null) {
    const [lines, setLines] = useState<string[]>([]);

    useEffect(() => {
        if (!bridge) return;
        
        let animationFrameId: NodeJS.Timeout;
        const renderLoop = () => {
            setLines(bridge.getLines());
            animationFrameId = setTimeout(renderLoop, 16); // ~60fps
        };
        
        renderLoop();
        return () => clearTimeout(animationFrameId);
    }, [bridge]);

    return lines;
}
