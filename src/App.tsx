import React from 'react';
import { Box, Text } from 'ink';

export const App = () => {
    return (
        <Box width="100%" height={20} flexDirection="row">
            <Box width="60%" borderStyle="single" borderColor="green">
                <Text>Pane 1 (Native Editor)</Text>
            </Box>
            <Box width="40%" flexDirection="column">
                <Box height="70%" borderStyle="single" borderColor="gray">
                    <Text>Pane 3 (Socratic Mentor)</Text>
                </Box>
                <Box height="30%" borderStyle="single" borderColor="gray">
                    <Text>Pane 2 (Execution Shell)</Text>
                </Box>
            </Box>
        </Box>
    );
};
