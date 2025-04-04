import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent: React.ComponentType<{
    error: Error;
    resetErrorBoundary: () => void;
  }>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | undefined;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      error: undefined 
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { 
      hasError: true,
      error 
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // You can log the error to an error reporting service
    console.error('Uncaught error:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ 
      hasError: false,
      error: undefined 
    });
  };

}

export default ErrorBoundary;