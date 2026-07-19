import { createMachine, interpret, assign } from 'xstate';
import { usePedagogicalStore } from './store';
import { Database } from './Database';
import { AstBridge } from './AstBridge';
import { generateHint } from './SocraticMentor';

interface SocraticContext {
    filePath: string;
    errorMsg: string | null;
    failureCount: number;
}

export function startSocraticMachine(db: Database, bridge: AstBridge) {
    const machine = createMachine<SocraticContext>({
        id: 'socratic',
        initial: 'idle',
        context: {
            filePath: '',
            errorMsg: null,
            failureCount: 0
        },
        states: {
            idle: {
                on: { 
                    FILE_SAVED: {
                        target: 'validating',
                        actions: assign({ filePath: (_, event: any) => event.filePath })
                    }
                }
            },
            validating: {
                invoke: {
                    id: 'validateAST',
                    src: (context) => bridge.validate(context.filePath, 'CHECK_RULES'),
                    onDone: [
                        { 
                            target: 'success', 
                            cond: (_, event: any) => event.data.passed 
                        },
                        { 
                            target: 'hint', 
                            actions: assign({ errorMsg: (_, event: any) => event.data.error }) 
                        }
                    ],
                    onError: { 
                        target: 'hint',
                        actions: assign({ errorMsg: (_, event: any) => event.data.error })
                    }
                }
            },
            hint: {
                invoke: {
                    id: 'generateAndLogHint',
                    src: async (context) => {
                        await db.logFailure(context.filePath, context.errorMsg || 'Unknown Error');
                        const failureCount = await db.getFailureCount(context.filePath);
                        
                        let level = 'Inquiry';
                        if (failureCount === 2) level = 'Highlighting';
                        else if (failureCount === 3) level = 'Analogy';
                        else if (failureCount >= 4) level = 'Directive';

                        const objective = usePedagogicalStore.getState().objective;
                        const hintText = await generateHint(objective, context.errorMsg || 'Syntax Error', level);
                        
                        // Assume session ID 1 for now
                        await db.logSocraticInteraction(1, context.errorMsg || 'Syntax Error', level, hintText);

                        return { failureCount, hintText };
                    },
                    onDone: {
                        actions: [
                            assign({ failureCount: (_, event: any) => event.data.failureCount }),
                            (_, event: any) => usePedagogicalStore.getState().setActiveHint(event.data.hintText)
                        ]
                    }
                },
                entry: () => usePedagogicalStore.getState().setStatus('HINT'),
                on: { 
                    FILE_SAVED: {
                        target: 'validating',
                        actions: assign({ filePath: (_, event: any) => event.filePath })
                    }
                }
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
        const store = usePedagogicalStore.getState();
        if (state.matches('idle')) store.setStatus('IDLE');
        if (state.matches('validating')) store.setStatus('VALIDATING');
        
        if (state.matches('success')) {
            store.setActiveHint("Great job! You fixed it.");
        } else if (!state.matches('hint')) {
            store.setActiveHint(null);
        }
    });

    return service;
}
