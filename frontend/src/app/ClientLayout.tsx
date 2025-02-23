'use client';

import { ErrorBoundary } from 'react-error-boundary'; // Catches UI errors and prevents a full-page crash.
import ErrorFallback from '../components/ui/ErrorFallback'; // Component that displays an error message when ErrorBoundary catches an error.
import { CacheProvider } from '@emotion/react'; // Provides an Emotion cache for styling.
import createEmotionCache from '@/utils/createEmotionCache'; // Custom function to optimize Emotion caching for client-side rendering.
import MUIThemeProvider from '../components/ui/ThemeProvider'; // Custom Material-UI theme provider.
import CssBaseline from '@mui/material/CssBaseline'; // Resets CSS for consistent Material-UI styling.
import Layout from '@/components/Layout'; // Main app layout (e.g., header, footer, etc.).

const clientSideEmotionCache = createEmotionCache(); // This ensures Emotion handles styles correctly in the browser.

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={(error) => console.error(error)}> {/* ErrorBoundary catches UI errors and prevents a full-page crash. */}
      <CacheProvider value={clientSideEmotionCache}> {/* Provides the client-side Emotion cache. Required for Material-UI styles to work correctly in Next.js.*/}
        <MUIThemeProvider>  {/* Applies the custom Material-UI theme globally. */}
          <CssBaseline /> {/* Resets CSS for consistent Material-UI styling. */}
          <Layout>  {/* Main app layout (e.g., header, footer, etc.). */}
            {children} {/* The main content of the page. */}
          </Layout>
        </MUIThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}