/**
 * Utilities for error logging and handling throughout the application
 */

/**
 * Logs errors to a service like Sentry, LogRocket, etc.
 * Replace the implementation based on your error tracking service.
 */
export const logErrorToService = (
  error: Error, 
  componentStack?: string
): void => {
  // Add your error service integration here
  // Example with Sentry:
  // Sentry.captureException(error, {
  //   extra: {
  //     componentStack,
  //   },
  // });
  
  // For now, just log to console in development
  if (process.env['NODE_ENV'] === 'development') {
    console.group('Error logged to service:');
    console.error(error);
    if (componentStack) {
      console.info('Component Stack:', componentStack);
    }
    console.groupEnd();
  }
};

/**
 * Wraps async functions with error handling
 */
export const withErrorHandling = <T,>(
  fn: (...args: any[]) => Promise<T>,
  errorHandler?: (error: unknown) => void
) => {
  return async (...args: any[]): Promise<T | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        logErrorToService(error instanceof Error ? error : new Error(String(error)));
      }
      return null;
    }
  };
};
