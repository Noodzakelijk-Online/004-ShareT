import React from 'react';
import { Button } from '@/components/ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error in React component:", error, errorInfo);

    // Send error to main process for logging to file
    if (window.electron && window.electron.logError) {
      window.electron.logError({
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Something went wrong.</h1>
            <p className="text-muted-foreground mb-6">
              An unexpected error has occurred. Please try refreshing the application.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <details className="mt-6 text-left bg-muted p-4 rounded-md">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 text-xs whitespace-pre-wrap">
                {this.state.error && this.state.error.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
