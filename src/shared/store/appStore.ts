import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    selectedExchange: string | null;
    setSelectedExchange: (exchange: string | null) => void;
    pctChangeBasis: 'prev_close' | 'open';
    setPctChangeBasis: (basis: 'prev_close' | 'open') => void;
    previousCloseMap: Record<string, number>;
    setPreviousCloseMap: (data: Record<string, number>) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedExchange: null,
            setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
            pctChangeBasis: 'prev_close',
            setPctChangeBasis: (basis) => set({ pctChangeBasis: basis }),
            previousCloseMap: {},
            setPreviousCloseMap: (data) => set((state) => ({ previousCloseMap: { ...state.previousCloseMap, ...data } })),
        }),
        {
            name: 'app-storage',
        }
    )
);
