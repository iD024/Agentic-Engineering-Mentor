import React from 'react';
import { render } from 'ink';
import { App } from './App';
import { InputRouter } from './InputRouter';
import { AstBridge } from './AstBridge';
import { WorkspaceWatcher } from './WorkspaceWatcher';
import { Database } from './Database';
import { startSocraticMachine } from './SocraticMachine';
import { bootstrapProject } from './Bootstrapper';

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';

async function bootstrap() {
    process.stdout.write(enterAltScreenCommand);

    const router = new InputRouter(process.stdin);
    const astBridge = new AstBridge();
    const watcher = new WorkspaceWatcher(process.cwd());
    const db = new Database();
    
    await db.init();
    await bootstrapProject(db);
    const socraticService = startSocraticMachine(db, astBridge);

    // Forward watcher events to XState instead of directly to AstBridge
    watcher.on('FILE_SAVED', (filePath) => {
        socraticService.send({ type: 'FILE_SAVED', filePath });
    });

    const { unmount } = render(<App router={router} watcher={watcher} astBridge={astBridge} />);

    process.on('SIGINT', () => {
        unmount();
        watcher.close();
        astBridge.kill();
        socraticService.stop();
        process.stdout.write(leaveAltScreenCommand);
        process.exit(0);
    });
}

bootstrap();
