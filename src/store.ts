import { create } from 'zustand';

interface PedagogicalState {
    objective: string;
    status: 'IDLE' | 'VALIDATING' | 'HINT' | 'SUCCESS';
    activeHint: string | null;
    setObjective: (obj: string) => void;
    setStatus: (status: 'IDLE' | 'VALIDATING' | 'HINT' | 'SUCCESS') => void;
    setHint: (hint: string | null) => void;
}

export const usePedagogicalStore = create<PedagogicalState>((set) => ({
    objective: 'Welcome to AssemblyLab!',
    status: 'IDLE',
    activeHint: null,
    setObjective: (obj) => set({ objective: obj }),
    setStatus: (status) => set({ status }),
    setHint: (hint) => set({ activeHint: hint })
}));
