// src/components/ui/ThemeProvider.tsx
'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { useTheme } from '@/styles/theme';

const MUIThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const theme = useTheme();
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
};

export default MUIThemeProvider;