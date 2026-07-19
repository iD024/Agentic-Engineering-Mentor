import React from 'react';
import { render } from 'ink';
import { App } from './App';
import { InputRouter } from './InputRouter';
import { AstBridge } from './AstBridge';
import { WorkspaceWatcher } from './WorkspaceWatcher';

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

process.stdout.write(enterAltScreenCommand);

const router = new InputRouter(process.stdin);
const astBridge = new AstBridge();
const watcher = new WorkspaceWatcher(process.cwd());

const { unmount } = render(<App router={router} astBridge={astBridge} watcher={watcher} />);

process.on('SIGINT', () => {
    unmount();
    watcher.close();
    astBridge.kill();
    process.stdout.write(leaveAltScreenCommand);
    process.exit(0);
});
