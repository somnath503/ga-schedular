import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useScheduleStore = create(
  persist(
    (set) => ({
      // State
      scheduleConfig: null,
      scheduleResult: null,

      // Actions
      setScheduleConfig: (config) => set({ scheduleConfig: config }),
      setScheduleResult: (result) => set({ scheduleResult: result }),
      resetStore: () => set({ scheduleConfig: null, scheduleResult: null })
    }),
    {
      name: 'ga-scheduler-storage', // This key is used in localStorage
    }
  )
);