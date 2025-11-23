import { createSlice } from '@reduxjs/toolkit';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
}

// Get initial theme from localStorage or system preference
function getInitialTheme(): Theme {
  const stored = localStorage.getItem('theme') as Theme | null;
  if (stored && ['light', 'dark', 'system'].includes(stored)) {
    return stored;
  }
  return 'system';
}

// Resolve theme based on preference and system setting
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

// Apply theme to document
function applyTheme(theme: 'light' | 'dark') {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

const initialState: ThemeState = {
  theme: getInitialTheme(),
  resolvedTheme: resolveTheme(getInitialTheme()),
};

// Apply initial theme
applyTheme(initialState.resolvedTheme);

// Listen for system theme changes and update resolved theme
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      const storedTheme = localStorage.getItem('theme') as Theme | null;
      if (!storedTheme || storedTheme === 'system') {
        const newResolved = e.matches ? 'dark' : 'light';
        applyTheme(newResolved);
        // Update state if store is available (will be handled by component)
      }
    });
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      state.resolvedTheme = resolveTheme(action.payload);
      localStorage.setItem('theme', action.payload);
      applyTheme(state.resolvedTheme);
    },
    toggleTheme: (state) => {
      // Toggle between light and dark
      // If currently on system, toggle to opposite of resolved theme
      // Otherwise, toggle to opposite of current theme
      const newTheme = state.resolvedTheme === 'dark' ? 'light' : 'dark';
      state.theme = newTheme;
      state.resolvedTheme = newTheme;
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    },
  },
});

export const { setTheme, toggleTheme } = themeSlice.actions;
export default themeSlice.reducer;

