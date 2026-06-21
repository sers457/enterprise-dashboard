import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ThemeMode } from '@/types';

interface ThemeStore {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  resolvedTheme: 'light' | 'dark';
  setResolvedTheme: (theme: 'light' | 'dark') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      resolvedTheme: 'dark',
      setMode: (mode) => {
        set({ mode });
        const isDark = 
          mode === 'dark' || 
          (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        const resolved = isDark ? 'dark' : 'light';
        set({ resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', isDark);
      },
      toggleMode: () => {
        const current = get().mode;
        const next = current === 'dark' ? 'light' : 'dark';
        get().setMode(next);
      },
      setResolvedTheme: (theme) => set({ resolvedTheme: theme }),
    }),
    { name: 'theme-storage' }
  )
);
