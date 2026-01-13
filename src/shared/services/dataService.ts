import { create } from 'zustand';
import type { SnapshotWebsocketMessage, UpdateWebsocketMessage } from '../utils/utils';

export type MarketData = SnapshotWebsocketMessage | UpdateWebsocketMessage;

interface DataState {
    data: Record<string, MarketData[]>; // Store arrays of ticks per symbol
    saveData: (key: string, value: MarketData) => void;
    getData: (key: string) => MarketData[];
    clearData: (key: string) => void;
    clearAllData: () => void;
}

export const useDataStore = create<DataState>()(

    (set, get) => ({

        data: {},

        saveData: (key: string, value: MarketData) => {
            set((state) => {
                const existingData = state.data[key];

                // Handle migration: if existingData is not an array (old format), start fresh with new array
                let dataArray: MarketData[];
                if (!existingData) {
                    // No data yet, create new array
                    dataArray = [];
                } else if (Array.isArray(existingData)) {
                    // Already an array (new format), use it
                    dataArray = existingData;
                } else {
                    // Old format (single object), convert to array with that single item
                    console.warn(`Migrating old data format for ${key} - converting single object to array`);
                    dataArray = [existingData as MarketData];
                }

                // Append new tick to the array
                // Limit to last 5000 ticks to prevent memory leaks in long sessions
                const MAX_TICKS = 5000;
                let newDataArray = [...dataArray, value];
                if (newDataArray.length > MAX_TICKS) {
                    newDataArray = newDataArray.slice(newDataArray.length - MAX_TICKS);
                }

                return {
                    data: { ...state.data, [key]: newDataArray },
                };
            });
        },

        getData: (key: string): MarketData[] => {
            return get().data[key] || [];
        },

        clearData: (key: string) => {
            set((state) => {
                const newData = { ...state.data };
                delete newData[key];
                return { data: newData };
            });
        },

        clearAllData: () => {
            set({ data: {} });
        },

    })
);

// Service class wrapper for easier usage
export class DataService {
    static saveData(key: string, value: MarketData) {
        useDataStore.getState().saveData(key, value);
    }

    static getData(key: string) {
        return useDataStore.getState().getData(key);
    }

    static clearData(key: string) {
        useDataStore.getState().clearData(key);
    }

    static clearAllData() {
        useDataStore.getState().clearAllData();
    }

    static getAllData() {
        return useDataStore.getState().data;
    }
}