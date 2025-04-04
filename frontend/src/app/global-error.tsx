// src/app/global-error.tsx
'use client';

import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CssBaseline from '@mui/material/CssBaseline';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <CssBaseline />
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="100vh"
          padding={3}
          bgcolor="background.default"
        >
          <div>
            <Typography variant="h4" component="h1" gutterBottom color="error">
              Application Error
            </Typography>
            <Typography variant="body1" paragraph>
              {error.message}
            </Typography>
            <Button 
              variant="contained" 
              onClick={reset}
              sx={{ mt: 2 }}
            >
              Reload Application
            </Button>
          </div>
        </Box>
      </body>
    </html>
  );
}