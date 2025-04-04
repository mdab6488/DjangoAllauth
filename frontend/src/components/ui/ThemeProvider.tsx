'use client';

import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/styles/theme';
import React from 'react';

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const theme = useTheme();
  
  return (
    <MuiThemeProvider theme={theme}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </MuiThemeProvider>
  );
};

export default ThemeProvider;
