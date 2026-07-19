import React from 'react';
import { render } from 'ink';
import { App } from './App';
import { InputRouter } from './InputRouter';

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

process.stdout.write(enterAltScreenCommand);

const router = new InputRouter(process.stdin);

const { unmount } = render(<App router={router} />);

process.on('SIGINT', () => {
    unmount();
    process.stdout.write(leaveAltScreenCommand);
    process.exit(0);
});
