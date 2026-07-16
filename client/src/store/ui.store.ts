import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UiState {
  theme: Theme;
  sidebarOpen: boolean;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarOpen: true,
      toggleTheme: () => set({ theme: get().theme === 'light' ? 'dark' : 'light' }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    { name: 'yerbatapp-ui' },
  ),
);
