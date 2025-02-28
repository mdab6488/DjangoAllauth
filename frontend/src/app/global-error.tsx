// src/app/global-error.tsx
'use client';

import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  return (
    <html>
      <body>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          padding={3}
        >
          <div>
            <Typography variant="h4" component="h1" gutterBottom>
              Something went wrong!
            </Typography>
            <Typography paragraph>
              A critical error occurred in the application.
            </Typography>
            <Button 
              variant="contained" 
              onClick={reset}
            >
              Try again
            </Button>
          </div>
        </Box>
      </body>
    </html>
  );
}
