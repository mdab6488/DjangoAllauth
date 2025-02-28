'use client';

import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import createEmotionCache from '@/utils/createEmotionCache';
import MUIThemeProvider from '@/components/ui/ThemeProvider';
import Layout from '@/components/Layout';
import { ReactNode } from 'react';

// Create emotion cache once outside component to prevent recreation on renders
const clientSideEmotionCache = createEmotionCache();

interface ClientLayoutProps {
  children: ReactNode;
}

/**
 * Root client layout component that sets up the application environment.
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
  // You can use a simple div as a wrapper if CacheProvider causes issues
  return (
    <CacheProvider value={clientSideEmotionCache}>
      <MUIThemeProvider>
        <CssBaseline />
        <Layout>
          {children}
        </Layout>
      </MUIThemeProvider>
    </CacheProvider>
  );
}
