import { describe, it, expect } from "vitest";
import {
  validateStringField,
  validateNumericField,
  validateUrl,
  validateTeamMember,
  validateSprintFormData,
  validateSprint,
  validateAppConfig,
  validateDataIntegrity,
  isDataCorrupted,
  sanitizeString,
  sanitizeNumber,
  formatValidationErrors,
  VALIDATION_LIMITS,
} from "../validation";
import { TeamMember, SprintFormData, Sprint, AppConfig } from "../types";

describe("validation utilities", () => {
  describe("validateStringField", () => {
    it("validates required fields", () => {
      expect(validateStringField("", "Name", { required: true })).toBe(
        "Name is required"
      );
      expect(validateStringField("   ", "Name", { required: true })).toBe(
        "Name is required"
      );
      expect(
        validateStringField("John", "Name", { required: true })
      ).toBeNull();
    });

    it("validates minimum length", () => {
      expect(validateStringField("ab", "Name", { minLength: 3 })).toBe(
        "Name must be at least 3 characters long"
      );
      expect(validateStringField("abc", "Name", { minLength: 3 })).toBeNull();
    });

    it("validates maximum length", () => {
      expect(
        validateStringField("a".repeat(101), "Name", { maxLength: 100 })
      ).toBe("Name must be no more than 100 characters long");
      expect(
        validateStringField("a".repeat(100), "Name", { maxLength: 100 })
      ).toBeNull();
    });

    it("validates patterns", () => {
      const namePattern = /^[a-zA-Z\s]+$/;
      expect(
        validateStringField("John123", "Name", { pattern: namePattern })
      ).toBe("Name format is invalid");
      expect(
        validateStringField("John Doe", "Name", { pattern: namePattern })
      ).toBeNull();
    });
  });

  describe("validateNumericField", () => {
    it("validates required fields", () => {
      expect(validateNumericField(NaN, "Hours", { required: true })).toBe(
        "Hours is required"
      );
      expect(
        validateNumericField(0, "Hours", { required: true, allowZero: false })
      ).toBe("Hours must be greater than 0");
      expect(validateNumericField(5, "Hours", { required: true })).toBeNull();
    });

    it("validates minimum values", () => {
      expect(validateNumericField(5, "Hours", { min: 10 })).toBe(
        "Hours must be at least 10"
      );
      expect(validateNumericField(10, "Hours", { min: 10 })).toBeNull();
    });

    it("validates maximum values", () => {
      expect(validateNumericField(15, "Hours", { max: 10 })).toBe(
        "Hours must be no more than 10"
      );
      expect(validateNumericField(10, "Hours", { max: 10 })).toBeNull();
    });

    it("validates integers", () => {
      expect(validateNumericField(5.5, "Days", { integer: true })).toBe(
        "Days must be a whole number"
      );
      expect(validateNumericField(5, "Days", { integer: true })).toBeNull();
    });
  });

  describe("validateUrl", () => {
    it("validates URL format", () => {
      expect(validateUrl("invalid-url", "Link")).toBe(
        "Link must be a valid URL starting with http:// or https://"
      );
      expect(validateUrl("http://example.com", "Link")).toBeNull();
      expect(validateUrl("https://example.com", "Link")).toBeNull();
    });

    it("handles optional URLs", () => {
      expect(validateUrl("", "Link", false)).toBeNull();
      expect(validateUrl("", "Link", true)).toBe("Link is required");
    });
  });

  describe("validateTeamMember", () => {
    const validMember: TeamMember = {
      name: "John Doe",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 8,
      timeOffHours: 0,
      netHours: 32,
    };

    it("validates valid team member", () => {
      const result = validateTeamMember(validMember);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("validates name requirements", () => {
      const invalidMember = { ...validMember, name: "" };
      const result = validateTeamMember(invalidMember);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Name is required");
    });

    it("validates total deductions don't exceed gross hours", () => {
      const invalidMember = {
        ...validMember,
        onCallHours: 20,
        meetingHours: 20,
        timeOffHours: 10, // Total: 50 > 40 gross hours
      };
      const result = validateTeamMember(invalidMember);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("cannot exceed total gross hours"))
      ).toBe(true);
    });

    it("validates net hours calculation", () => {
      const invalidMember = { ...validMember, netHours: 999 }; // Incorrect calculation
      const result = validateTeamMember(invalidMember);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("Net hours calculation is incorrect")
        )
      ).toBe(true);
    });
  });

  describe("validateSprintFormData", () => {
    const validFormData: SprintFormData = {
      sprintName: "Sprint 1",
      taskeiLink: "https://taskei.com/sprint/1",
      businessDays: 10,
      numberOfPeople: 3,
      totalPointsInSprint: 30,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      unplannedPointsBroughtIn: 2,
      pointsCompleted: 25,
    };

    it("validates valid sprint form data", () => {
      const result = validateSprintFormData(validFormData, 120, 3);
      expect(result.isValid).toBe(true);
    });

    it("validates sprint name is required", () => {
      const invalidData = { ...validFormData, sprintName: "" };
      const result = validateSprintFormData(invalidData, 120, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Sprint name is required");
    });

    it("validates carry over completed doesn't exceed total", () => {
      const invalidData = {
        ...validFormData,
        carryOverPointsCompleted: 10,
        carryOverPointsTotal: 5,
      };
      const result = validateSprintFormData(invalidData, 120, 3);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("cannot exceed carry over total"))
      ).toBe(true);
    });

    it("validates team members are selected", () => {
      const result = validateSprintFormData(validFormData, 120, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "At least one team member must be selected"
      );
    });

    it("validates working hours are positive", () => {
      const result = validateSprintFormData(validFormData, 0, 3);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) =>
          e.includes("working hours must be greater than 0")
        )
      ).toBe(true);
    });
  });

  describe("validateAppConfig", () => {
    const validConfig: AppConfig = {
      velocityCalculationSprints: 6,
      defaultMeetingPercentage: 20,
      teamMembers: [
        {
          name: "John Doe",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        },
      ],
    };

    it("validates valid config", () => {
      const result = validateAppConfig(validConfig);
      expect(result.isValid).toBe(true);
    });

    it("validates velocity calculation sprints range", () => {
      const invalidConfig = { ...validConfig, velocityCalculationSprints: 0 };
      const result = validateAppConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes("must be at least 1"))).toBe(
        true
      );
    });

    it("validates meeting percentage range", () => {
      const invalidConfig = { ...validConfig, defaultMeetingPercentage: 150 };
      const result = validateAppConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("must be no more than 100"))
      ).toBe(true);
    });

    it("detects duplicate team member names", () => {
      const invalidConfig = {
        ...validConfig,
        teamMembers: [
          validConfig.teamMembers[0],
          { ...validConfig.teamMembers[0], name: "john doe" }, // Same name, different case
        ],
      };
      const result = validateAppConfig(invalidConfig);
      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((e) => e.includes("Duplicate team member names"))
      ).toBe(true);
    });
  });

  describe("isDataCorrupted", () => {
    it("detects corrupted data", () => {
      expect(isDataCorrupted(null)).toBe(true);
      expect(isDataCorrupted("not an object")).toBe(true);
      expect(isDataCorrupted({})).toBe(true);
      expect(isDataCorrupted({ sprints: "not an array" })).toBe(true);
      expect(isDataCorrupted({ sprints: [{ id: null }] })).toBe(true);
    });

    it("recognizes valid data", () => {
      const validData = {
        sprints: [{ id: "1", sprintName: "Sprint 1" }],
        config: { velocityCalculationSprints: 6 },
      };
      expect(isDataCorrupted(validData)).toBe(false);
    });
  });

  describe("sanitizeString", () => {
    it("sanitizes dangerous input", () => {
      expect(sanitizeString("<script>alert('xss')</script>")).toBe(
        "scriptalert('xss')/script"
      );
      expect(sanitizeString("javascript:alert('xss')")).toBe("alert('xss')");
      expect(sanitizeString("onclick=alert('xss')")).toBe("alert('xss')");
    });

    it("trims and limits length", () => {
      expect(sanitizeString("  hello  ")).toBe("hello");
      expect(sanitizeString("a".repeat(1001))).toHaveLength(1000);
    });
  });

  describe("sanitizeNumber", () => {
    it("sanitizes numeric input", () => {
      expect(sanitizeNumber("123")).toBe(123);
      expect(sanitizeNumber("123.45")).toBe(123.45);
      expect(sanitizeNumber("invalid")).toBe(0);
      expect(sanitizeNumber("invalid", 10)).toBe(10);
    });
  });

  describe("formatValidationErrors", () => {
    it("formats single error", () => {
      const validation = {
        isValid: false,
        errors: ["Name is required"],
        fieldErrors: { name: "Name is required" },
      };
      expect(formatValidationErrors(validation)).toBe("Name is required");
    });

    it("formats multiple errors", () => {
      const validation = {
        isValid: false,
        errors: ["Name is required", "Hours must be positive"],
        fieldErrors: {},
      };
      const result = formatValidationErrors(validation);
      expect(result).toContain("Multiple validation errors:");
      expect(result).toContain("• Name is required");
      expect(result).toContain("• Hours must be positive");
    });

    it("returns empty string for valid data", () => {
      const validation = {
        isValid: true,
        errors: [],
        fieldErrors: {},
      };
      expect(formatValidationErrors(validation)).toBe("");
    });
  });
});
