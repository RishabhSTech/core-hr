// src/components/QueryErrorHandler.tsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';

export interface ErrorHandlerProps {
  error: Error | null;
  onDismiss?: () => void;
  onRetry?: () => void;
}

export function QueryErrorHandler({ error, onDismiss, onRetry }: ErrorHandlerProps) {
  if (!error) return null;

  const getErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.code) return `Error code: ${error.code}`;
    return 'An unknown error occurred';
  };

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-5">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Error</h3>
          <p className="mt-1 text-sm text-red-800">{getErrorMessage(error)}</p>
          <div className="mt-3 flex gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Retry
              </Button>
            )}
            {onDismiss && (
              <Button
                onClick={onDismiss}
                size="sm"
                variant="ghost"
                className="text-xs"
              >
                Dismiss
              </Button>
            )}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default QueryErrorHandler;
