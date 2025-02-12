import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { CacheProvider } from '@emotion/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createEmotionCache from '@/utils/createEmotionCache';
import { theme } from '@/styles/theme';
import Layout from '@/components/Layout';
import "../styles/globals.css";

// Initialize fonts
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

// Create emotion cache
const clientSideEmotionCache = createEmotionCache();

export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <CacheProvider value={clientSideEmotionCache}>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout>
              {children}
            </Layout>
          </ThemeProvider>
        </CacheProvider>
      </body>
    </html>
  );
}