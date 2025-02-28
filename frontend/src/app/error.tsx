// src/app/error.tsx
'use client';

import React, { useEffect } from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={3}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          maxWidth: 500,
          borderLeft: '6px solid #f44336'
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom color="error">
          Something went wrong
        </Typography>
        
        <Typography variant="body1" paragraph>
          We're sorry, but we encountered an unexpected issue. Our team has been notified.
        </Typography>
        
        <Box
          sx={{
            p: 2,
            my: 2,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
            overflow: 'auto',
            maxHeight: '150px',
          }}
        >
          <Typography variant="body2" component="code" sx={{ fontFamily: 'monospace' }}>
            {error.message}
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="primary" 
          onClick={reset}
          sx={{ mt: 2 }}
        >
          Try Again
        </Button>
      </Paper>
    </Box>
  );
}
