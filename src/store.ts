import { create } from 'zustand';

interface PedagogicalState {
    objective: string;
    status: 'IDLE' | 'VALIDATING' | 'HINT' | 'SUCCESS';
    activeHint: string | null;
    setObjective: (obj: string) => void;
    setStatus: (status: 'IDLE' | 'VALIDATING' | 'HINT' | 'SUCCESS') => void;
    setActiveHint: (hint: string | null) => void;
}

export const usePedagogicalStore = create<PedagogicalState>((set) => ({
    objective: 'Initial Setup: Fix the syntax errors in your file.',
    status: 'IDLE',
    activeHint: null,
    setObjective: (obj) => set({ objective: obj }),
    setStatus: (status) => set({ status }),
    setActiveHint: (hint) => set({ activeHint: hint }),
}));
