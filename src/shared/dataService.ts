import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import type {UnpackedData} from "../utils/utils.ts";

interface DataState {
    data: Record<string, UnpackedData[]>; // Store arrays of ticks per symbol
    saveData: (key: string, value: UnpackedData) => void;
    getData: (key: string) => UnpackedData[];
    clearData: (key: string) => void;
    clearAllData: () => void;
}

export const useDataStore = create<DataState>()(

    persist(

        (set, get) => ({

            data: {},

            saveData: (key: string, value: UnpackedData) => {
                set((state) => {
                    const existingData = state.data[key];

                    // Handle migration: if existingData is not an array (old format), start fresh with new array
                    let dataArray: UnpackedData[];
                    if (!existingData) {
                        // No data yet, create new array
                        dataArray = [];
                    } else if (Array.isArray(existingData)) {
                        // Already an array (new format), use it
                        dataArray = existingData;
                    } else {
                        // Old format (single object), convert to array with that single item
                        console.warn(`Migrating old data format for ${key} - converting single object to array`);
                        dataArray = [existingData as UnpackedData];
                    }

                    // Append new tick to the array
                    return {
                        data: {...state.data, [key]: [...dataArray, value]},
                    };
                });
            },

            getData: (key: string): UnpackedData[] => {
                return get().data[key] || [];
            },

            clearData: (key: string) => {
                set((state) => {
                    const newData = {...state.data};
                    delete newData[key];
                    return {data: newData};
                });
            },

            clearAllData: () => {
                set({data: {}});
            },

        }),
        {
            name: 'data-storage',
            version: 2, // Increment version to force migration from old format
            migrate: (persistedState: any, version: number) => {
                // If migrating from version 0 or 1 (old format with single objects)
                if (version < 2) {
                    console.log('🔄 Migrating data storage from v' + version + ' to v2 (array format)');
                    const oldState = persistedState as { data: Record<string, unknown> };
                    const newData: Record<string, UnpackedData[]> = {};

                    // Convert each symbol's data to an array
                    Object.entries(oldState.data || {}).forEach(([key, value]) => {
                        if (value && typeof value === 'object') {
                            // If it's already an array, keep it
                            if (Array.isArray(value)) {
                                newData[key] = value as UnpackedData[];
                            } else {
                                // Convert single object to array with one item
                                newData[key] = [value as UnpackedData];
                            }
                        }
                    });

                    console.log(`✅ Migration complete - converted ${Object.keys(newData).length} symbols`);
                    return { ...oldState, data: newData };
                }
                return persistedState;
            },
        }
    )
);

// Service class wrapper for easier usage
export class DataService {
    static saveData(key: string, value: UnpackedData) {
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