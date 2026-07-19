import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { InputRouter } from './InputRouter';
import { XtermBridge } from './XtermBridge';
import { useTerminalGrid } from './useTerminalGrid';
import { AstBridge } from './AstBridge';
import { WorkspaceWatcher } from './WorkspaceWatcher';
import * as pty from 'node-pty';
import * as os from 'os';

export const App = ({ 
    router, 
    astBridge, 
    watcher 
}: { 
    router: InputRouter; 
    astBridge: AstBridge; 
    watcher: WorkspaceWatcher; 
}) => {
    const [activePane, setActivePane] = useState(1);
    const [editorBridge, setEditorBridge] = useState<XtermBridge | null>(null);
    const [shellBridge, setShellBridge] = useState<XtermBridge | null>(null);
    const [lastValidation, setLastValidation] = useState<string>('No file saved yet');

    useEffect(() => {
        const handlePaneSwitch = (paneId: number) => {
            setActivePane(paneId);
        };
        router.on('pane_switch', handlePaneSwitch);

        const handleFileSaved = async (filePath: string) => {
            setLastValidation(`Validating ${filePath}...`);
            const result = await astBridge.validate(filePath, 'CHECK_RULES');
            if (result.passed) {
                setLastValidation(`Passed: ${filePath}`);
            } else {
                setLastValidation(`Failed: ${filePath} - ${result.error}`);
            }
        };
        watcher.on('FILE_SAVED', handleFileSaved);

        const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
        
        const editorPty = pty.spawn(shell, [], { cols: 80, rows: 24, name: 'xterm-256color', env: process.env as any });
        const eBridge = new XtermBridge(editorPty, 80, 24);
        setEditorBridge(eBridge);

        const executionPty = pty.spawn(shell, [], { cols: 40, rows: 10, name: 'xterm-256color', env: process.env as any });
        const sBridge = new XtermBridge(executionPty, 40, 10);
        setShellBridge(sBridge);

        const handleInput = (data: Buffer) => {
            if (activePane === 1) editorPty.write(data.toString());
            else if (activePane === 2) executionPty.write(data.toString());
        };
        router.on('data', handleInput);

        return () => {
            router.off('pane_switch', handlePaneSwitch);
            router.off('data', handleInput);
            watcher.off('FILE_SAVED', handleFileSaved);
            editorPty.kill();
            executionPty.kill();
        };
    }, [router, activePane, watcher, astBridge]);

    const editorLines = useTerminalGrid(editorBridge);
    const shellLines = useTerminalGrid(shellBridge);

    return (
        <Box width="100%" height={26} flexDirection="row">
            <Box width="60%" borderStyle="single" borderColor={activePane === 1 ? 'green' : 'gray'} flexDirection="column">
                {editorLines.map((line, i) => <Text key={i} wrap="truncate">{line}</Text>)}
            </Box>
            <Box width="40%" flexDirection="column">
                <Box height="70%" borderStyle="single" borderColor={activePane === 3 ? 'green' : 'gray'} flexDirection="column">
                    <Text bold>Pane 3 (Socratic Mentor)</Text>
                    <Box marginTop={1}>
                        <Text color="cyan">{lastValidation}</Text>
                    </Box>
                </Box>
                <Box height="30%" borderStyle="single" borderColor={activePane === 2 ? 'green' : 'gray'} flexDirection="column">
                    {shellLines.map((line, i) => <Text key={i} wrap="truncate">{line}</Text>)}
                </Box>
            </Box>
        </Box>
    );
};
