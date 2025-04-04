// src/app/error.tsx
'use client';

import React from 'react';
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
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      padding={3}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500 }}>
        <Typography variant="h6" color="error" gutterBottom>
          Page Error
        </Typography>
        <Typography variant="body2" paragraph>
          {error.message}
        </Typography>
        <Button 
          variant="outlined" 
          onClick={reset}
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Paper>
    </Box>
  );
}