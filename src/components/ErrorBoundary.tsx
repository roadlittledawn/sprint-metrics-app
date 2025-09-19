"use client";

import React, { Component, ReactNode } from "react";
import {
  AppError,
  ErrorType,
  ErrorSeverity,
  createError,
  formatErrorForDisplay,
  logError,
} from "@/lib/errorHandling";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: AppError) => void;
}

interface State {
  hasError: boolean;
  error: AppError | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Create structured error from React error
    const appError = createError(
      ErrorType.UNKNOWN,
      ErrorSeverity.HIGH,
      `React Error: ${error.message}`,
      "An unexpected error occurred in the application. Please refresh the page.",
      { stack: error.stack, name: error.name },
      "React Error Boundary"
    );

    return { hasError: true, error: appError };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.state.error) {
      // Add React-specific details
      const updatedError = {
        ...this.state.error,
        details: {
          ...this.state.error.details,
          componentStack: errorInfo.componentStack,
          errorBoundary: this.constructor.name,
        },
      };
      this.setState({ error: updatedError });

      logError(this.state.error);

      if (this.props.onError) {
        this.props.onError(this.state.error);
      }
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorDisplay = formatErrorForDisplay(this.state.error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Error Icon */}
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              {/* Error Title */}
              <h1 className="text-xl font-semibold text-gray-900 text-center mb-2">
                {errorDisplay.title}
              </h1>

              {/* Error Message */}
              <p className="text-gray-700 text-center mb-6">
                {errorDisplay.message}
              </p>

              {/* Error Suggestions */}
              {errorDisplay.suggestions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    What you can try:
                  </h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {errorDisplay.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {errorDisplay.canRetry && (
                  <button
                    onClick={this.handleRetry}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={this.handleReload}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {/* Technical Details (Development Only) */}
              {process.env.NODE_ENV === "development" && (
                <details className="mt-6">
                  <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                    <div>
                      <strong>Type:</strong> {this.state.error.type}
                    </div>
                    <div>
                      <strong>Severity:</strong> {this.state.error.severity}
                    </div>
                    <div>
                      <strong>Context:</strong> {this.state.error.context}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {this.state.error.timestamp}
                    </div>
                    {this.state.error.details && (
                      <div>
                        <strong>Details:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {JSON.stringify(this.state.error.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  const handleError = (
    error: { message?: string; stack?: string },
    context: string
  ) => {
    const appError = createError(
      ErrorType.UNKNOWN,
      ErrorSeverity.MEDIUM,
      error.message || "Unknown error",
      "An error occurred. Please try again.",
      { stack: error.stack },
      context
    );

    logError(appError);
    throw appError; // This will be caught by the nearest ErrorBoundary
  };

  return { handleError };
}
