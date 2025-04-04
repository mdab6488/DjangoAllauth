import Box from '@mui/material/Box';
import Header from './Header';
import Footer from './Footer';
import ErrorBoundary from '../ui/ErrorBoundary';
import ErrorFallback from '../ui/ErrorFallback';
import { ReactNode } from 'react';
interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: (theme) => theme.palette.background.default,
      }}
    >
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <Header />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: 4,
            px: { xs: 2, md: 4 },
          }}
        >
          {children}
        </Box>
        <Footer />
      </ErrorBoundary>
    </Box>
  );
};

export default Layout;
