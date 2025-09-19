import { describe, it, expect, vi } from "vitest";
import {
  ErrorType,
  ErrorSeverity,
  createError,
  handleValidationError,
  handleNetworkError,
  handleFileSystemError,
  handleDataCorruptionError,
  handleCalculationError,
  handleUnknownError,
  getErrorRecovery,
  formatErrorForDisplay,
  withErrorHandling,
  createFallbackData,
  sanitizeInput,
} from "../errorHandling";

describe("errorHandling utilities", () => {
  describe("createError", () => {
    it("creates structured error object", () => {
      const error = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        "Test error",
        "User-friendly message",
        { field: "test" },
        "test context"
      );

      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.message).toBe("Test error");
      expect(error.userMessage).toBe("User-friendly message");
      expect(error.details).toEqual({ field: "test" });
      expect(error.context).toBe("test context");
      expect(error.timestamp).toBeDefined();
    });
  });

  describe("handleValidationError", () => {
    it("handles single validation error", () => {
      const validation = {
        isValid: false,
        errors: ["Name is required"],
        fieldErrors: { name: "Name is required" },
      };

      const error = handleValidationError(validation, "form submission");
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.userMessage).toBe("Name is required");
    });

    it("handles multiple validation errors", () => {
      const validation = {
        isValid: false,
        errors: ["Name is required", "Hours must be positive"],
        fieldErrors: {},
      };

      const error = handleValidationError(validation, "form submission");
      expect(error.userMessage).toContain("Please fix the following issues:");
      expect(error.userMessage).toContain("• Name is required");
      expect(error.userMessage).toContain("• Hours must be positive");
    });
  });

  describe("handleNetworkError", () => {
    it("handles different HTTP status codes", () => {
      const error400 = handleNetworkError({ status: 400 }, "API call");
      expect(error400.userMessage).toContain("Invalid request");

      const error401 = handleNetworkError({ status: 401 }, "API call");
      expect(error401.userMessage).toContain("Authentication required");
      expect(error401.severity).toBe(ErrorSeverity.HIGH);

      const error500 = handleNetworkError({ status: 500 }, "API call");
      expect(error500.userMessage).toContain("Server error");
      expect(error500.severity).toBe(ErrorSeverity.HIGH);
    });

    it("handles network errors without status", () => {
      const error = handleNetworkError(
        { message: "Network timeout" },
        "API call"
      );
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.userMessage).toContain("network error occurred");
    });
  });

  describe("handleFileSystemError", () => {
    it("handles different file system error codes", () => {
      const enoentError = handleFileSystemError(
        { code: "ENOENT" },
        "file read"
      );
      expect(enoentError.userMessage).toContain("Data file not found");
      expect(enoentError.severity).toBe(ErrorSeverity.LOW);

      const eaccesError = handleFileSystemError(
        { code: "EACCES" },
        "file write"
      );
      expect(eaccesError.userMessage).toContain("Permission denied");
      expect(eaccesError.severity).toBe(ErrorSeverity.CRITICAL);

      const enospcError = handleFileSystemError(
        { code: "ENOSPC" },
        "file write"
      );
      expect(enospcError.userMessage).toContain("Not enough disk space");
      expect(enospcError.severity).toBe(ErrorSeverity.CRITICAL);
    });
  });

  describe("handleDataCorruptionError", () => {
    it("creates data corruption error", () => {
      const error = handleDataCorruptionError(
        { file: "test.json" },
        "data read"
      );
      expect(error.type).toBe(ErrorType.DATA_CORRUPTION);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.userMessage).toContain("Data file appears to be corrupted");
    });
  });

  describe("handleCalculationError", () => {
    it("creates calculation error", () => {
      const calcError = new Error("Division by zero");
      const error = handleCalculationError(calcError, "velocity calculation");
      expect(error.type).toBe(ErrorType.CALCULATION);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.userMessage).toContain("Calculation error occurred");
    });
  });

  describe("handleUnknownError", () => {
    it("creates unknown error", () => {
      const unknownError = new Error("Something went wrong");
      const error = handleUnknownError(unknownError, "unknown operation");
      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.userMessage).toContain("unexpected error occurred");
    });
  });

  describe("getErrorRecovery", () => {
    it("provides recovery options for validation errors", () => {
      const error = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        "Validation failed",
        "Please fix the form",
        {},
        "form"
      );

      const recovery = getErrorRecovery(error);
      expect(recovery.canRecover).toBe(true);
      expect(recovery.suggestions).toContain(
        "Please correct the highlighted fields"
      );
    });

    it("provides recovery options for network errors", () => {
      const error = createError(
        ErrorType.NETWORK,
        ErrorSeverity.MEDIUM,
        "Network failed",
        "Connection error",
        {},
        "API"
      );

      const recovery = getErrorRecovery(error);
      expect(recovery.canRecover).toBe(true);
      expect(recovery.suggestions).toContain("Check your internet connection");
    });

    it("provides fallback data for data corruption", () => {
      const error = createError(
        ErrorType.DATA_CORRUPTION,
        ErrorSeverity.HIGH,
        "Data corrupted",
        "Data is corrupted",
        {},
        "file read"
      );

      const recovery = getErrorRecovery(error);
      expect(recovery.canRecover).toBe(true);
      expect(recovery.fallbackData).toBeDefined();
      expect(recovery.fallbackData.sprints).toEqual([]);
    });
  });

  describe("formatErrorForDisplay", () => {
    it("formats error for display", () => {
      const error = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        "Validation failed",
        "Please fix the form",
        {},
        "form"
      );

      const display = formatErrorForDisplay(error);
      expect(display.title).toBe("Warning");
      expect(display.message).toBe("Please fix the form");
      expect(display.severity).toBe(ErrorSeverity.MEDIUM);
      expect(display.canRetry).toBe(true);
    });

    it("uses appropriate titles for different severities", () => {
      const lowError = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.LOW,
        "",
        "",
        {},
        ""
      );
      const mediumError = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        "",
        "",
        {},
        ""
      );
      const highError = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.HIGH,
        "",
        "",
        {},
        ""
      );
      const criticalError = createError(
        ErrorType.VALIDATION,
        ErrorSeverity.CRITICAL,
        "",
        "",
        {},
        ""
      );

      expect(formatErrorForDisplay(lowError).title).toBe("Notice");
      expect(formatErrorForDisplay(mediumError).title).toBe("Warning");
      expect(formatErrorForDisplay(highError).title).toBe("Error");
      expect(formatErrorForDisplay(criticalError).title).toBe("Critical Error");
    });
  });

  describe("withErrorHandling", () => {
    it("handles successful operations", async () => {
      const operation = vi.fn().mockResolvedValue("success");
      const result = await withErrorHandling(operation, "test operation");

      expect(result.success).toBe(true);
      expect(result.data).toBe("success");
    });

    it("handles failed operations", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Test error"));
      const result = await withErrorHandling(operation, "test operation");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe(ErrorType.UNKNOWN);
    });

    it("calls error callback on failure", async () => {
      const operation = vi.fn().mockRejectedValue(new Error("Test error"));
      const onError = vi.fn();

      await withErrorHandling(operation, "test operation", onError);

      expect(onError).toHaveBeenCalled();
    });
  });

  describe("createFallbackData", () => {
    it("creates fallback data for different types", () => {
      const sprintsData = createFallbackData("sprints");
      expect(Array.isArray(sprintsData)).toBe(true);
      expect(sprintsData).toHaveLength(0);

      const configData = createFallbackData("config");
      expect(configData.velocityCalculationSprints).toBe(6);
      expect(configData.defaultMeetingPercentage).toBe(20);
      expect(Array.isArray(configData.teamMembers)).toBe(true);

      const fullData = createFallbackData("full");
      expect(fullData.sprints).toEqual([]);
      expect(fullData.config).toBeDefined();
    });
  });

  describe("sanitizeInput", () => {
    it("sanitizes different input types", () => {
      expect(sanitizeInput("  hello  ", "string")).toBe("hello");
      expect(sanitizeInput("123", "number")).toBe(123);
      expect(sanitizeInput("invalid", "number")).toBe(0);
      expect(sanitizeInput("true", "boolean")).toBe(true);
      expect(sanitizeInput("false", "boolean")).toBe(false);
      expect(sanitizeInput("not array", "array")).toEqual([]);
      expect(sanitizeInput([1, 2, 3], "array")).toEqual([1, 2, 3]);
    });

    it("handles edge cases gracefully", () => {
      expect(sanitizeInput(null, "string")).toBe("");
      expect(sanitizeInput(undefined, "number")).toBe(0);
      expect(sanitizeInput(null, "boolean")).toBe(false);
      expect(sanitizeInput(null, "array")).toEqual([]);
    });
  });
});
