'use client';

import { Suspense } from 'react';
import Image from "next/image";
import { Typography, Container, Box, Skeleton } from '@mui/material';
import { useAuth } from '@/hooks/useAuth';
import styles from '../styles/page.module.css'; // Corrected import


type StylesType = {
  main: string;
  logo: string;
  ctas: string;
  primary: string;
  secondary: string;
  footer: string;
};

const typedStyles = styles as StylesType;

const HomeContent = () => {
  const { user, loading, error } = useAuth();
  
  if (loading) {
    return (
      <Box sx={{ mt: 4 }}>
        <Skeleton variant="text" height={60} width="50%" />
        <Skeleton variant="rectangular" height={200} width="100%" sx={{ my: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, my: 2 }}>
          <Skeleton variant="rectangular" height={40} width={120} />
          <Skeleton variant="rectangular" height={40} width={120} />
        </Box>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" color="error" gutterBottom>
          Error: {error}
        </Typography>
        <Typography>
          Please try refreshing the page or logging in again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Guest'}
      </Typography>
      
      <div className={typedStyles.main}>
        <Image
          className={typedStyles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <Typography variant="body1" gutterBottom>
          This is your dashboard. You can start building your application content here.
        </Typography>

        <div className={typedStyles.ctas}>
          <a
            className={typedStyles.primary}
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Deploy now on Vercel"
          >
            <Image
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Deploy now
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className={typedStyles.secondary}
            aria-label="Read the Next.js documentation"
          >
            Read our docs
          </a>
        </div>
      </div>

      <footer className={typedStyles.footer}>
        <a
          href="https://nextjs.org/learn"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Learn Next.js"
        >
          <Image
            src="/file.svg"
            alt="File icon"
            width={16}
            height={16}
          />
          Learn
        </a>
        <a
          href="https://vercel.com/templates"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Vercel templates"
        >
          <Image
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Examples
        </a>
        <a
          href="https://nextjs.org"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Go to the Next.js website"
        >
          <Image
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to nextjs.org →
        </a>
      </footer>
    </Box>
  );
};

export default function HomePage() {
  return (
    <Container>
      <Suspense fallback={<Skeleton variant="rectangular" height={400} />}>
        <HomeContent />
      </Suspense>
    </Container>
  );
}