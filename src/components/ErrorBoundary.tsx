// src/components/ErrorBoundary.tsx
import React, { ReactNode, Component, ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="mt-4 text-lg font-semibold text-center text-gray-900">
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-center text-gray-600">
              {this.state.error.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                <summary className="cursor-pointer font-semibold">Error details</summary>
                <pre className="mt-2 overflow-auto text-gray-700">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <Button
              onClick={this.reset}
              className="w-full mt-6 flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
