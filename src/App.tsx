import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { InputRouter } from './InputRouter';

export const App = ({ router }: { router: InputRouter }) => {
    const [activePane, setActivePane] = useState(1);

    useEffect(() => {
        const handlePaneSwitch = (paneId: number) => {
            setActivePane(paneId);
        };
        router.on('pane_switch', handlePaneSwitch);
        return () => {
            router.off('pane_switch', handlePaneSwitch);
        };
    }, [router]);

    return (
        <Box width="100%" height={20} flexDirection="row">
            <Box width="60%" borderStyle="single" borderColor={activePane === 1 ? 'green' : 'gray'}>
                <Text>Pane 1 (Native Editor)</Text>
            </Box>
            <Box width="40%" flexDirection="column">
                <Box height="70%" borderStyle="single" borderColor={activePane === 3 ? 'green' : 'gray'}>
                    <Text>Pane 3 (Socratic Mentor)</Text>
                </Box>
                <Box height="30%" borderStyle="single" borderColor={activePane === 2 ? 'green' : 'gray'}>
                    <Text>Pane 2 (Execution Shell)</Text>
                </Box>
            </Box>
        </Box>
    );
};
