import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
    selectedExchange: string | null;
    setSelectedExchange: (exchange: string | null) => void;
    previousCloseMap: Record<string, number>;
    setPreviousCloseMap: (data: Record<string, number>) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            selectedExchange: null,
            setSelectedExchange: (exchange) => set({ selectedExchange: exchange }),
            previousCloseMap: {},
            setPreviousCloseMap: (data) => set({ previousCloseMap: data }),
        }),
        {
            name: 'app-storage',
        }
    )
);
