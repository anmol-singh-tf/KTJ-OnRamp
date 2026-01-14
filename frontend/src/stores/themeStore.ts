import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme: Theme) => {
        set({ theme });
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
      },
    }),
    {
      name: 'nexpay-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    }
  )
);

// Initialize theme on load
if (typeof window !== 'undefined') {
  const theme = useThemeStore.getState().theme;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
