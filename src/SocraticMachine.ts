import { createMachine, interpret } from 'xstate';
import { usePedagogicalStore } from './store';
import { Database } from './Database';
import { AstBridge } from './AstBridge';

export function startSocraticMachine(db: Database, bridge: AstBridge) {
    const machine = createMachine({
        id: 'socratic',
        initial: 'idle',
        states: {
            idle: {
                on: { FILE_SAVED: 'validating' }
            },
            validating: {
                invoke: {
                    id: 'validateAST',
                    src: (context, event) => bridge.validate(event.filePath, 'CHECK_RULES'),
                    onDone: { target: 'success' },
                    onError: { target: 'hint' }
                }
            },
            hint: {
                entry: () => usePedagogicalStore.getState().setStatus('HINT'),
                on: { FILE_SAVED: 'validating' }
            },
            success: {
                entry: () => usePedagogicalStore.getState().setStatus('SUCCESS'),
                type: 'final'
            }
        }
    });

    const service = interpret(machine).start();
    
    // Sync to zustand
    service.onTransition((state) => {
        if (state.matches('idle')) usePedagogicalStore.getState().setStatus('IDLE');
        if (state.matches('validating')) usePedagogicalStore.getState().setStatus('VALIDATING');
    });

    return service;
}
