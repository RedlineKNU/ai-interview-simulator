'use client';

import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6366f1', // Your blue color
    },
    secondary: {
      main: '#10b981', // Your green color
    },
    warning: {
      main: '#f59e0b', // Your orange color
    },
    background: {
      default: '#f3f4f6',
      paper: '#ffffff',
    },
    text: {
      primary: '#111827',
      secondary: '#6b7280',
    },
  },
  typography: {
    fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
          padding: 0,
        },
      },
    },
  },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MUIThemeProvider theme={theme}>
      {children}
    </MUIThemeProvider>
  );
}
