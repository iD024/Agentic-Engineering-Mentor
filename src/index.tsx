import React from 'react';
import { render } from 'ink';
import { App } from './App';

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

process.stdout.write(enterAltScreenCommand);

const { unmount } = render(<App />);

process.on('SIGINT', () => {
    unmount();
    process.stdout.write(leaveAltScreenCommand);
    process.exit(0);
});
