// import { ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';
// import { theme } from '../styles/theme';
// import type { AppProps } from 'next/app';
// import Layout from '../components/Layout';

// function MyApp({ Component, pageProps }: AppProps) {
//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <Layout>
//         <Component {...pageProps} />
//       </Layout>
//     </ThemeProvider>
//   );
// }

// export default MyApp;

import { CacheProvider, EmotionCache } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppProps } from 'next/app';
import createEmotionCache from '@/utils/createEmotionCache';
import { theme } from '@/styles/theme';
import { useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const clientSideEmotionCache = createEmotionCache();

interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
  pageProps: Record<string, unknown>; // or specify the exact type if known
}

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

  useEffect(() => {
    // Fetch CSRF token on initial load
    axios.get('/api/csrf/', { withCredentials: true });
  }, []);

  return (
    <CacheProvider value={emotionCache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ThemeProvider>
    </CacheProvider>
  );
}