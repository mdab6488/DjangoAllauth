// src/components/ui/ErrorFallback.tsx

// Usage example in a component
// import { ErrorBoundary } from 'react-error-boundary';
// import ErrorFallback from './components/ui/ErrorFallback';

// <ErrorBoundary FallbackComponent={ErrorFallback}>
//   {/* Components that might throw errors */}
// </ErrorBoundary>

import React from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: (...args: Array<unknown>) => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  );
};

export default ErrorFallback;