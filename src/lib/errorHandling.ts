/**
 * Error handling utilities for Sprint Data Tracker
 * Provides consistent error handling and user-friendly error messages
 */

import { ValidationResult } from "./validation";

import { ValidationResult } from "./validation";

// Error types for categorization
export enum ErrorType {
  VALIDATION = "validation",
  NETWORK = "network",
  FILE_SYSTEM = "file_system",
  DATA_CORRUPTION = "data_corruption",
  CALCULATION = "calculation",
  UNKNOWN = "unknown",
}

// Error severity levels
export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

// Structured error interface
export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: unknown;
  timestamp: string;
  context?: string;
}

// Error recovery suggestions
export interface ErrorRecovery {
  canRecover: boolean;
  suggestions: string[];
  fallbackData?: unknown;
}

/**
 * Creates a structured error object
 */
export function createError(
  type: ErrorType,
  severity: ErrorSeverity,
  message: string,
  userMessage: string,
  details?: unknown,
  context?: string
): AppError {
  return {
    type,
    severity,
    message,
    userMessage,
    details,
    timestamp: new Date().toISOString(),
    context,
  };
}

/**
 * Handles validation errors and provides user-friendly messages
 */
export function handleValidationError(
  validation: ValidationResult,
  context: string
): AppError {
  const userMessage =
    validation.errors.length === 1
      ? validation.errors[0]
      : `Please fix the following issues:\n• ${validation.errors.join("\n• ")}`;

  return createError(
    ErrorType.VALIDATION,
    ErrorSeverity.MEDIUM,
    `Validation failed in ${context}`,
    userMessage,
    validation.fieldErrors,
    context
  );
}

/**
 * Handles network/API errors
 */
export function handleNetworkError(
  error: { status?: number; message?: string; response?: unknown },
  context: string
): AppError {
  let userMessage =
    "A network error occurred. Please check your connection and try again.";
  let severity = ErrorSeverity.MEDIUM;

  if (error.status) {
    switch (error.status) {
      case 400:
        userMessage = "Invalid request. Please check your input and try again.";
        break;
      case 401:
        userMessage = "Authentication required. Please refresh the page.";
        severity = ErrorSeverity.HIGH;
        break;
      case 403:
        userMessage =
          "Access denied. You don't have permission to perform this action.";
        severity = ErrorSeverity.HIGH;
        break;
      case 404:
        userMessage = "The requested resource was not found.";
        break;
      case 429:
        userMessage = "Too many requests. Please wait a moment and try again.";
        break;
      case 500:
        userMessage = "Server error. Please try again later.";
        severity = ErrorSeverity.HIGH;
        break;
      default:
        userMessage = `Network error (${error.status}). Please try again.`;
    }
  }

  return createError(
    ErrorType.NETWORK,
    severity,
    `Network error in ${context}: ${error.message || "Unknown error"}`,
    userMessage,
    { status: error.status, response: error.response },
    context
  );
}

/**
 * Handles file system errors
 */
export function handleFileSystemError(
  error: { code?: string; message?: string; path?: string },
  context: string
): AppError {
  let userMessage = "File system error occurred. Please try again.";
  let severity = ErrorSeverity.HIGH;

  if (error.code) {
    switch (error.code) {
      case "ENOENT":
        userMessage =
          "Data file not found. The application will create a new one.";
        severity = ErrorSeverity.LOW;
        break;
      case "EACCES":
        userMessage = "Permission denied. Please check file permissions.";
        severity = ErrorSeverity.CRITICAL;
        break;
      case "ENOSPC":
        userMessage =
          "Not enough disk space. Please free up space and try again.";
        severity = ErrorSeverity.CRITICAL;
        break;
      case "EMFILE":
        userMessage =
          "Too many files open. Please close other applications and try again.";
        severity = ErrorSeverity.HIGH;
        break;
      default:
        userMessage = `File system error (${error.code}). Please try again.`;
    }
  }

  return createError(
    ErrorType.FILE_SYSTEM,
    severity,
    `File system error in ${context}: ${error.message}`,
    userMessage,
    { code: error.code, path: error.path },
    context
  );
}

/**
 * Handles data corruption errors
 */
export function handleDataCorruptionError(
  details: unknown,
  context: string
): AppError {
  const userMessage =
    "Data file appears to be corrupted. The application will attempt to recover or create a backup.";

  return createError(
    ErrorType.DATA_CORRUPTION,
    ErrorSeverity.HIGH,
    `Data corruption detected in ${context}`,
    userMessage,
    details,
    context
  );
}

/**
 * Handles calculation errors
 */
export function handleCalculationError(
  error: { message?: string; stack?: string },
  context: string
): AppError {
  const userMessage =
    "Calculation error occurred. Please check your input values.";

  return createError(
    ErrorType.CALCULATION,
    ErrorSeverity.MEDIUM,
    `Calculation error in ${context}: ${error.message}`,
    userMessage,
    { stack: error.stack },
    context
  );
}

/**
 * Handles unknown errors
 */
export function handleUnknownError(
  error: { message?: string; stack?: string; name?: string },
  context: string
): AppError {
  const userMessage =
    "An unexpected error occurred. Please try again or contact support.";

  return createError(
    ErrorType.UNKNOWN,
    ErrorSeverity.HIGH,
    `Unknown error in ${context}: ${error.message || "No message"}`,
    userMessage,
    { stack: error.stack, name: error.name },
    context
  );
}

/**
 * Determines error recovery options
 */
export function getErrorRecovery(error: AppError): ErrorRecovery {
  const recovery: ErrorRecovery = {
    canRecover: false,
    suggestions: [],
  };

  switch (error.type) {
    case ErrorType.VALIDATION:
      recovery.canRecover = true;
      recovery.suggestions = [
        "Please correct the highlighted fields",
        "Check that all required fields are filled",
        "Ensure numeric values are within valid ranges",
      ];
      break;

    case ErrorType.NETWORK:
      recovery.canRecover = true;
      recovery.suggestions = [
        "Check your internet connection",
        "Try refreshing the page",
        "Wait a moment and try again",
      ];
      if (error.details?.status === 500) {
        recovery.suggestions.push("The server may be temporarily unavailable");
      }
      break;

    case ErrorType.FILE_SYSTEM:
      recovery.canRecover = error.details?.code !== "EACCES";
      if (error.details?.code === "ENOENT") {
        recovery.suggestions = ["The application will create a new data file"];
        recovery.fallbackData = {
          sprints: [],
          config: {
            velocityCalculationSprints: 6,
            teamMembers: [],
            defaultMeetingPercentage: 20,
          },
        };
      } else if (error.details?.code === "ENOSPC") {
        recovery.suggestions = [
          "Free up disk space",
          "Try saving to a different location",
        ];
      } else {
        recovery.suggestions = [
          "Check file permissions",
          "Try restarting the application",
        ];
      }
      break;

    case ErrorType.DATA_CORRUPTION:
      recovery.canRecover = true;
      recovery.suggestions = [
        "The application will attempt to recover your data",
        "A backup will be created before any changes",
        "You may need to re-enter some recent data",
      ];
      recovery.fallbackData = {
        sprints: [],
        config: {
          velocityCalculationSprints: 6,
          teamMembers: [],
          defaultMeetingPercentage: 20,
        },
      };
      break;

    case ErrorType.CALCULATION:
      recovery.canRecover = true;
      recovery.suggestions = [
        "Check that all numeric inputs are valid",
        "Ensure working hours are greater than zero",
        "Verify that carry-over values are consistent",
      ];
      break;

    case ErrorType.UNKNOWN:
      recovery.canRecover = true;
      recovery.suggestions = [
        "Try refreshing the page",
        "Check the browser console for more details",
        "Try using a different browser",
        "Contact support if the problem persists",
      ];
      break;
  }

  return recovery;
}

/**
 * Logs errors for debugging (in development) or monitoring (in production)
 */
export function logError(error: AppError): void {
  const logData = {
    timestamp: error.timestamp,
    type: error.type,
    severity: error.severity,
    message: error.message,
    context: error.context,
    details: error.details,
  };

  if (process.env.NODE_ENV === "development") {
    console.group(`🚨 ${error.severity.toUpperCase()} ERROR: ${error.type}`);
    console.error("Message:", error.message);
    console.error("User Message:", error.userMessage);
    console.error("Context:", error.context);
    console.error("Details:", error.details);
    console.error("Timestamp:", error.timestamp);
    console.groupEnd();
  } else {
    // In production, you might want to send to a logging service
    console.error("Application Error:", logData);
  }
}

/**
 * Creates a user-friendly error message component data
 */
export function formatErrorForDisplay(error: AppError): {
  title: string;
  message: string;
  severity: ErrorSeverity;
  suggestions: string[];
  canRetry: boolean;
} {
  const recovery = getErrorRecovery(error);

  let title = "Error";
  switch (error.severity) {
    case ErrorSeverity.LOW:
      title = "Notice";
      break;
    case ErrorSeverity.MEDIUM:
      title = "Warning";
      break;
    case ErrorSeverity.HIGH:
      title = "Error";
      break;
    case ErrorSeverity.CRITICAL:
      title = "Critical Error";
      break;
  }

  return {
    title,
    message: error.userMessage,
    severity: error.severity,
    suggestions: recovery.suggestions,
    canRetry: recovery.canRecover,
  };
}

/**
 * Wraps async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: AppError) => void
): Promise<{ success: true; data: T } | { success: false; error: AppError }> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (err: unknown) {
    let error: AppError;

    // Categorize the error
    const errorObj = err as Record<string, unknown>;
    if (errorObj.name === "ValidationError" || errorObj.type === "validation") {
      error = handleValidationError(
        (errorObj.validation as ValidationResult) || {
          isValid: false,
          errors: [String(errorObj.message)],
          fieldErrors: {},
        },
        context
      );
    } else if (errorObj.code && String(errorObj.code).startsWith("E")) {
      error = handleFileSystemError(
        errorObj as { code?: string; message?: string; path?: string },
        context
      );
    } else if (errorObj.status || errorObj.response) {
      error = handleNetworkError(
        errorObj as { status?: number; message?: string; response?: unknown },
        context
      );
    } else if (errorObj.name === "CalculationError") {
      error = handleCalculationError(
        errorObj as { message?: string; stack?: string },
        context
      );
    } else {
      error = handleUnknownError(
        errorObj as { message?: string; stack?: string; name?: string },
        context
      );
    }

    logError(error);

    if (onError) {
      onError(error);
    }

    return { success: false, error };
  }
}

/**
 * Creates fallback data when original data is corrupted or missing
 */
export function createFallbackData(
  type: "sprints" | "config" | "full"
): unknown {
  const defaultConfig = {
    velocityCalculationSprints: 6,
    teamMembers: [],
    defaultMeetingPercentage: 20,
  };

  switch (type) {
    case "sprints":
      return [];
    case "config":
      return defaultConfig;
    case "full":
      return {
        sprints: [],
        config: defaultConfig,
      };
    default:
      return null;
  }
}

/**
 * Validates and sanitizes user input to prevent common issues
 */
export function sanitizeInput(
  input: unknown,
  type: "string" | "number" | "boolean" | "array"
): unknown {
  try {
    switch (type) {
      case "string":
        if (typeof input !== "string") return "";
        return input.trim().substring(0, 1000); // Limit length
      case "number":
        const num = parseFloat(input);
        return isNaN(num) ? 0 : num;
      case "boolean":
        return Boolean(input);
      case "array":
        return Array.isArray(input) ? input : [];
      default:
        return input;
    }
  } catch {
    return type === "string"
      ? ""
      : type === "number"
      ? 0
      : type === "boolean"
      ? false
      : [];
  }
}
