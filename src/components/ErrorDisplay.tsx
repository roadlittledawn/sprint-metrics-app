"use client";

import React from "react";
import {
  AppError,
  ErrorSeverity,
  formatErrorForDisplay,
} from "@/lib/errorHandling";
import { ValidationResult } from "@/lib/validation";

interface ErrorDisplayProps {
  error?: AppError | string | null;
  validation?: ValidationResult;
  className?: string;
  showSuggestions?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export default function ErrorDisplay({
  error,
  validation,
  className = "",
  showSuggestions = true,
  onRetry,
  onDismiss,
}: ErrorDisplayProps) {
  // Don't render if no error
  if (!error && (!validation || validation.isValid)) {
    return null;
  }

  let displayData: {
    title: string;
    message: string;
    severity: ErrorSeverity;
    suggestions: string[];
    canRetry: boolean;
  };

  // Handle different error types
  if (typeof error === "string") {
    displayData = {
      title: "Error",
      message: error,
      severity: ErrorSeverity.MEDIUM,
      suggestions: [],
      canRetry: false,
    };
  } else if (error) {
    displayData = formatErrorForDisplay(error);
  } else if (validation && !validation.isValid) {
    displayData = {
      title: "Validation Error",
      message:
        validation.errors.length === 1
          ? validation.errors[0]
          : `Please fix the following issues:\n• ${validation.errors.join(
              "\n• "
            )}`,
      severity: ErrorSeverity.MEDIUM,
      suggestions: [
        "Check that all required fields are filled",
        "Ensure numeric values are within valid ranges",
        "Review the highlighted fields for specific issues",
      ],
      canRetry: false,
    };
  } else {
    return null;
  }

  // Determine styling based on severity
  const getSeverityStyles = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return {
          container: "bg-blue-50 border-blue-200",
          icon: "text-blue-600",
          title: "text-blue-800",
          message: "text-blue-700",
        };
      case ErrorSeverity.MEDIUM:
        return {
          container: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-600",
          title: "text-yellow-800",
          message: "text-yellow-700",
        };
      case ErrorSeverity.HIGH:
        return {
          container: "bg-red-50 border-red-200",
          icon: "text-red-600",
          title: "text-red-800",
          message: "text-red-700",
        };
      case ErrorSeverity.CRITICAL:
        return {
          container: "bg-red-100 border-red-300",
          icon: "text-red-700",
          title: "text-red-900",
          message: "text-red-800",
        };
      default:
        return {
          container: "bg-gray-50 border-gray-200",
          icon: "text-gray-600",
          title: "text-gray-800",
          message: "text-gray-700",
        };
    }
  };

  const styles = getSeverityStyles(displayData.severity);

  // Get appropriate icon
  const getIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case ErrorSeverity.MEDIUM:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        );
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return (
          <svg
            className="w-5 h-5"
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
        );
      default:
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${styles.icon} mt-0.5 mr-3`}>
          {getIcon(displayData.severity)}
        </div>

        <div className="flex-1">
          {/* Title */}
          <h3 className={`text-sm font-medium ${styles.title} mb-1`}>
            {displayData.title}
          </h3>

          {/* Message */}
          <div className={`text-sm ${styles.message} mb-3`}>
            {displayData.message.split("\n").map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>

          {/* Suggestions */}
          {showSuggestions && displayData.suggestions.length > 0 && (
            <div className="mb-3">
              <h4 className={`text-xs font-medium ${styles.title} mb-1`}>
                What you can try:
              </h4>
              <ul className={`text-xs ${styles.message} space-y-1`}>
                {displayData.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {displayData.canRetry && onRetry && (
              <button
                onClick={onRetry}
                className={`text-xs font-medium ${styles.title} hover:underline focus:outline-none`}
              >
                Try Again
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className={`text-xs font-medium ${styles.title} hover:underline focus:outline-none`}
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${styles.icon} hover:opacity-75 focus:outline-none ml-2`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Field-specific error display component
interface FieldErrorProps {
  error?: string;
  className?: string;
}

export function FieldError({ error, className = "" }: FieldErrorProps) {
  if (!error) return null;

  return <p className={`text-red-600 text-xs mt-1 ${className}`}>{error}</p>;
}

// Success message component
interface SuccessDisplayProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

export function SuccessDisplay({
  message,
  onDismiss,
  className = "",
}: SuccessDisplayProps) {
  return (
    <div
      className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 text-green-600 mt-0.5 mr-3">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-green-800">{message}</p>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-green-600 hover:opacity-75 focus:outline-none ml-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
