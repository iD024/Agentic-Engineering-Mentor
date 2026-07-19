import { createMachine, interpret, assign } from 'xstate';
import { usePedagogicalStore } from './store';
import { Database } from './Database';
import { AstBridge } from './AstBridge';

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
                    onDone: { 
                        target: 'success',
                        // If result.passed is false, we should go to hint instead! 
                        // Wait, bridge.validate always resolves!
                        // Let's check result.passed
                    }
                },
                on: {
                    '': [
                        { target: 'success', cond: (_, event: any) => event.data?.passed === true },
                        { 
                            target: 'hint', 
                            cond: (_, event: any) => event.data?.passed === false,
                            actions: assign({ errorMsg: (_, event: any) => event.data.error })
                        }
                    ]
                }
            },
            hint: {
                invoke: {
                    id: 'logFailure',
                    src: async (context) => {
                        await db.logFailure(context.filePath, context.errorMsg || 'Unknown Error');
                        return await db.getFailureCount(context.filePath);
                    },
                    onDone: {
                        actions: assign({ failureCount: (_, event: any) => event.data })
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
                type: 'final' // In a real app, this would transition to next objective
            }
        }
    });

    // The machine above has a slight issue in how onDone processes the event.data.
    // Let's rewrite it slightly to be standard XState V4.
    const machineFixed = createMachine<SocraticContext>({
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
                    id: 'logFailure',
                    src: async (context) => {
                        await db.logFailure(context.filePath, context.errorMsg || 'Unknown Error');
                        return await db.getFailureCount(context.filePath);
                    },
                    onDone: {
                        actions: assign({ failureCount: (_, event: any) => event.data })
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

    const service = interpret(machineFixed).start();
    
    // Sync to zustand
    service.onTransition((state) => {
        const store = usePedagogicalStore.getState();
        if (state.matches('idle')) store.setStatus('IDLE');
        if (state.matches('validating')) store.setStatus('VALIDATING');
        
        if (state.matches('hint')) {
            const count = state.context.failureCount;
            // Hint Escalation Algorithm
            let hintText = "Hint: Review your code syntax.";
            if (count === 1) hintText = `Inquiry: Have you checked the structure in ${state.context.filePath}?`;
            else if (count === 2) hintText = `Highlighting: There is an error here: ${state.context.errorMsg}`;
            else if (count === 3) hintText = `Analogy: Think of brackets like parenthesis, they must match.`;
            else if (count >= 4) hintText = `Directive: You are missing a closing brace in ${state.context.filePath}.`;
            store.setActiveHint(hintText);
        } else if (state.matches('success')) {
            store.setActiveHint("Great job! You fixed it.");
        } else {
            store.setActiveHint(null);
        }
    });

    return service;
}
