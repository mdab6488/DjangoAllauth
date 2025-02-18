'use client';

import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ErrorBoundary } from 'react-error-boundary';
import createEmotionCache from '@/utils/createEmotionCache';
import Layout from '@/components/Layout';
import MUIThemeProvider from '../components/ui/ThemeProvider';
import ErrorFallback from '../components/ui/ErrorFallback'; // Create this component

const clientSideEmotionCache = createEmotionCache();

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <CacheProvider value={clientSideEmotionCache}>
        <MUIThemeProvider>
          <CssBaseline />
          <Layout>
            {children}
          </Layout>
        </MUIThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}