import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <Box
    role="alert"
    sx={{
      p: 4,
      maxWidth: 600,
      mx: 'auto',
      textAlign: 'center',
    }}
  >
    <Alert severity="error" sx={{ mb: 2 }}>
      <Typography variant="h6" component="div" gutterBottom>
        Something went wrong
      </Typography>
      <Typography
        variant="body1"
        component="pre"
        sx={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          textAlign: 'left',
        }}
      >
        {error.message}
      </Typography>
    </Alert>
    <Button
      variant="contained"
      color="error"
      onClick={resetErrorBoundary}
      aria-label="Retry"
    >
      Try Again
    </Button>
  </Box>
);

export default ErrorFallback;
