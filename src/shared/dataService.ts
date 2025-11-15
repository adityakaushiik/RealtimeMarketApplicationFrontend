import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DataState {
  data: Record<string, unknown>;
  saveData: (key: string, value: unknown) => void;
  getData: (key: string) => unknown;
  clearData: (key: string) => void;
  clearAllData: () => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      data: {},
      saveData: (key: string, value: unknown) => {
        set((state) => ({
          data: { ...state.data, [key]: value },
        }));
      },
      getData: (key: string) => {
        return get().data[key];
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
    }),
    {
      name: 'data-storage',
    }
  )
);

// Service class wrapper for easier usage
export class DataService {
  static saveData(key: string, value: unknown) {
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