import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { PtyManager } from './PtyManager';
import { XtermBridge } from './XtermBridge';
import { useTerminalGrid } from './useTerminalGrid';
import { usePedagogicalStore } from './store';
import * as os from 'os';

export const App = ({ router }: { router: any }) => {
    const [activePane, setActivePane] = useState<number>(1);
    const [editorBridge, setEditorBridge] = useState<XtermBridge | null>(null);
    const { objective, status, activeHint } = usePedagogicalStore();

    useEffect(() => {
        const handlePaneSwitch = (paneId: number) => {
            setActivePane(paneId);
        };
        router.on('pane_switch', handlePaneSwitch);
        
        // Setup PTYs
        const manager = new PtyManager();
        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        // Mock dimensions for now
        const ptyProcess = manager.spawn(shell, 80, 24);
        const bridge = new XtermBridge(ptyProcess, 80, 24);
        setEditorBridge(bridge);

        return () => {
            router.off('pane_switch', handlePaneSwitch);
            ptyProcess.kill();
        };
    }, [router]);

    const editorGrid = useTerminalGrid(editorBridge);

    return (
        <Box width="100%" height={20} flexDirection="row">
            {/* Pane 1 (Left - 60% W) */}
            <Box width="60%" borderStyle="single" borderColor={activePane === 1 ? 'green' : 'gray'} flexDirection="column">
                <Text bold>Native Editor</Text>
                {editorGrid.map((line, i) => (
                    <Text key={i} wrap="truncate">{line}</Text>
                ))}
            </Box>

            {/* Right Column (40% W) */}
            <Box width="40%" flexDirection="column">
                {/* Pane 3 (Top Right - 70% H) */}
                <Box height="70%" borderStyle="single" borderColor={activePane === 3 ? 'green' : 'gray'} flexDirection="column" padding={1}>
                    <Text bold color="cyan">{objective}</Text>
                    <Box marginTop={1}>
                        <Text>Status: {status}</Text>
                    </Box>
                    {activeHint && (
                        <Box marginTop={1}>
                            <Text color="yellow">Hint: {activeHint}</Text>
                        </Box>
                    )}
                </Box>
                {/* Pane 2 (Bottom Right - 30% H) */}
                <Box height="30%" borderStyle="single" borderColor={activePane === 2 ? 'green' : 'gray'}>
                    <Text>Execution Shell</Text>
                </Box>
            </Box>
        </Box>
    );
};
