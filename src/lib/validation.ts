/**
 * Comprehensive validation utilities for Sprint Data Tracker
 * Provides consistent validation logic across all forms and components
 */

import { Sprint, TeamMember, AppConfig, SprintFormData } from "./types";

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fieldErrors: Record<string, string>;
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  URL: /^https?:\/\/.+/,
  POSITIVE_NUMBER: /^\d*\.?\d+$/,
  NON_NEGATIVE_NUMBER: /^\d*\.?\d*$/,
  INTEGER: /^\d+$/,
  NAME: /^[a-zA-Z\s\-'\.]+$/,
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
  SPRINT_NAME_MAX_LENGTH: 100,
  TEAM_MEMBER_NAME_MAX_LENGTH: 50,
  MAX_BUSINESS_DAYS: 30,
  MAX_HOURS_PER_PERSON: 200,
  MAX_POINTS: 1000,
  MIN_VELOCITY_SPRINTS: 1,
  MAX_VELOCITY_SPRINTS: 20,
  MIN_MEETING_PERCENTAGE: 0,
  MAX_MEETING_PERCENTAGE: 100,
} as const;

/**
 * Validates a string field with common rules
 */
export function validateStringField(
  value: string,
  fieldName: string,
  options: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    patternMessage?: string;
  } = {}
): string | null {
  const {
    required = false,
    minLength = 0,
    maxLength = Infinity,
    pattern,
    patternMessage,
  } = options;

  if (required && (!value || value.trim().length === 0)) {
    return `${fieldName} is required`;
  }

  if (value && value.trim().length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }

  if (value && value.trim().length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters long`;
  }

  if (value && pattern && !pattern.test(value.trim())) {
    return patternMessage || `${fieldName} format is invalid`;
  }

  return null;
}

/**
 * Validates a numeric field with common rules
 */
export function validateNumericField(
  value: number,
  fieldName: string,
  options: {
    required?: boolean;
    min?: number;
    max?: number;
    integer?: boolean;
    allowZero?: boolean;
  } = {}
): string | null {
  const {
    required = false,
    min = -Infinity,
    max = Infinity,
    integer = false,
    allowZero = true,
  } = options;

  if (required && (value === undefined || value === null || isNaN(value))) {
    return `${fieldName} is required`;
  }

  if (value !== undefined && value !== null && !isNaN(value)) {
    if (!allowZero && value === 0) {
      return `${fieldName} must be greater than 0`;
    }

    if (value < min) {
      return `${fieldName} must be at least ${min}`;
    }

    if (value > max) {
      return `${fieldName} must be no more than ${max}`;
    }

    if (integer && !Number.isInteger(value)) {
      return `${fieldName} must be a whole number`;
    }
  }

  return null;
}

/**
 * Validates URL format
 */
export function validateUrl(
  url: string,
  fieldName: string,
  required = false
): string | null {
  if (!url && !required) {
    return null;
  }

  if (required && !url) {
    return `${fieldName} is required`;
  }

  if (url && !VALIDATION_PATTERNS.URL.test(url)) {
    return `${fieldName} must be a valid URL starting with http:// or https://`;
  }

  return null;
}

/**
 * Validates team member data
 */
export function validateTeamMember(member: TeamMember): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate name
  const nameError = validateStringField(member.name, "Name", {
    required: true,
    maxLength: VALIDATION_LIMITS.TEAM_MEMBER_NAME_MAX_LENGTH,
    pattern: VALIDATION_PATTERNS.NAME,
    patternMessage:
      "Name can only contain letters, spaces, hyphens, apostrophes, and periods",
  });
  if (nameError) {
    errors.push(nameError);
    fieldErrors.name = nameError;
  }

  // Validate total gross hours
  const grossHoursError = validateNumericField(
    member.totalGrossHours,
    "Total gross hours",
    {
      required: true,
      min: 0.5,
      max: VALIDATION_LIMITS.MAX_HOURS_PER_PERSON,
      allowZero: false,
    }
  );
  if (grossHoursError) {
    errors.push(grossHoursError);
    fieldErrors.totalGrossHours = grossHoursError;
  }

  // Validate on-call hours
  const onCallError = validateNumericField(
    member.onCallHours,
    "On-call hours",
    {
      min: 0,
      max: member.totalGrossHours,
    }
  );
  if (onCallError) {
    errors.push(onCallError);
    fieldErrors.onCallHours = onCallError;
  }

  // Validate meeting hours
  const meetingError = validateNumericField(
    member.meetingHours,
    "Meeting hours",
    {
      min: 0,
      max: member.totalGrossHours,
    }
  );
  if (meetingError) {
    errors.push(meetingError);
    fieldErrors.meetingHours = meetingError;
  }

  // Validate time off hours
  const timeOffError = validateNumericField(
    member.timeOffHours,
    "Time off hours",
    {
      min: 0,
      max: member.totalGrossHours,
    }
  );
  if (timeOffError) {
    errors.push(timeOffError);
    fieldErrors.timeOffHours = timeOffError;
  }

  // Validate total deductions don't exceed gross hours
  const totalDeductions =
    member.onCallHours + member.meetingHours + member.timeOffHours;
  if (totalDeductions > member.totalGrossHours) {
    const error =
      "Total deductions (on-call + meetings + time off) cannot exceed total gross hours";
    errors.push(error);
    fieldErrors.general = error;
  }

  // Validate net hours calculation
  const expectedNetHours = Math.max(
    0,
    member.totalGrossHours - totalDeductions
  );
  if (Math.abs(member.netHours - expectedNetHours) > 0.01) {
    const error = "Net hours calculation is incorrect";
    errors.push(error);
    fieldErrors.netHours = error;
  }

  // Warn if net hours is zero or very low
  if (member.netHours <= 0) {
    const warning = "Team member has no available working hours";
    errors.push(warning);
    fieldErrors.netHours = warning;
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validates sprint form data
 */
export function validateSprintFormData(
  formData: SprintFormData,
  workingHours: number,
  teamMembersCount: number
): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate sprint name
  const nameError = validateStringField(formData.sprintName, "Sprint name", {
    required: true,
    maxLength: VALIDATION_LIMITS.SPRINT_NAME_MAX_LENGTH,
  });
  if (nameError) {
    errors.push(nameError);
    fieldErrors.sprintName = nameError;
  }

  // Validate Taskei link (optional)
  if (formData.taskeiLink) {
    const urlError = validateUrl(formData.taskeiLink, "Taskei link");
    if (urlError) {
      errors.push(urlError);
      fieldErrors.taskeiLink = urlError;
    }
  }

  // Validate business days
  const businessDaysError = validateNumericField(
    formData.businessDays,
    "Business days",
    {
      required: true,
      min: 1,
      max: VALIDATION_LIMITS.MAX_BUSINESS_DAYS,
      integer: true,
      allowZero: false,
    }
  );
  if (businessDaysError) {
    errors.push(businessDaysError);
    fieldErrors.businessDays = businessDaysError;
  }

  // Validate total points in sprint
  const totalPointsError = validateNumericField(
    formData.totalPointsInSprint,
    "Total points in sprint",
    {
      required: true,
      min: 0,
      max: VALIDATION_LIMITS.MAX_POINTS,
    }
  );
  if (totalPointsError) {
    errors.push(totalPointsError);
    fieldErrors.totalPointsInSprint = totalPointsError;
  }

  // Validate carry over points total
  const carryOverTotalError = validateNumericField(
    formData.carryOverPointsTotal,
    "Carry over points total",
    {
      min: 0,
      max: VALIDATION_LIMITS.MAX_POINTS,
    }
  );
  if (carryOverTotalError) {
    errors.push(carryOverTotalError);
    fieldErrors.carryOverPointsTotal = carryOverTotalError;
  }

  // Validate carry over points completed
  const carryOverCompletedError = validateNumericField(
    formData.carryOverPointsCompleted,
    "Carry over points completed",
    {
      min: 0,
      max: Math.max(
        formData.carryOverPointsTotal,
        VALIDATION_LIMITS.MAX_POINTS
      ),
    }
  );
  if (carryOverCompletedError) {
    errors.push(carryOverCompletedError);
    fieldErrors.carryOverPointsCompleted = carryOverCompletedError;
  }

  // Validate carry over completed doesn't exceed carry over total
  if (formData.carryOverPointsCompleted > formData.carryOverPointsTotal) {
    const error =
      "Carry over completed points cannot exceed carry over total points";
    errors.push(error);
    fieldErrors.carryOverPointsCompleted = error;
  }

  // Validate unplanned points
  const unplannedError = validateNumericField(
    formData.unplannedPointsBroughtIn,
    "Unplanned points brought in",
    {
      min: 0,
      max: VALIDATION_LIMITS.MAX_POINTS,
    }
  );
  if (unplannedError) {
    errors.push(unplannedError);
    fieldErrors.unplannedPointsBroughtIn = unplannedError;
  }

  // Validate points completed
  const pointsCompletedError = validateNumericField(
    formData.pointsCompleted,
    "Points completed",
    {
      required: true,
      min: 0,
      max: VALIDATION_LIMITS.MAX_POINTS,
    }
  );
  if (pointsCompletedError) {
    errors.push(pointsCompletedError);
    fieldErrors.pointsCompleted = pointsCompletedError;
  }

  // Validate team members selection
  if (teamMembersCount === 0) {
    const error = "At least one team member must be selected";
    errors.push(error);
    fieldErrors.teamMembers = error;
  }

  // Validate working hours
  if (workingHours <= 0) {
    const error =
      "Total working hours must be greater than 0. Check team member configurations.";
    errors.push(error);
    fieldErrors.workingHours = error;
  }

  // Business logic validations
  const plannedPoints =
    formData.totalPointsInSprint - formData.carryOverPointsCompleted;
  if (formData.pointsCompleted > plannedPoints) {
    const warning =
      "Points completed exceeds planned points - this may indicate scope creep";
    // This is a warning, not an error, so we don't block submission
    fieldErrors.pointsCompletedWarning = warning;
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validates complete sprint data
 */
export function validateSprint(sprint: Sprint): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate basic sprint form data
  const formData: SprintFormData = {
    sprintName: sprint.sprintName,
    taskeiLink: sprint.taskeiLink,
    businessDays: sprint.businessDays,
    numberOfPeople: sprint.numberOfPeople,
    totalPointsInSprint: sprint.totalPointsInSprint,
    carryOverPointsTotal: sprint.carryOverPointsTotal,
    carryOverPointsCompleted: sprint.carryOverPointsCompleted,
    unplannedPointsBroughtIn: sprint.unplannedPointsBroughtIn,
    pointsCompleted: sprint.pointsCompleted,
  };

  const formValidation = validateSprintFormData(
    formData,
    sprint.workingHours,
    sprint.numberOfPeople
  );

  errors.push(...formValidation.errors);
  Object.assign(fieldErrors, formValidation.fieldErrors);

  // Validate sprint ID
  if (!sprint.id || sprint.id.trim().length === 0) {
    const error = "Sprint ID is required";
    errors.push(error);
    fieldErrors.id = error;
  }

  // Validate calculated fields are consistent
  const expectedNewWorkPoints =
    sprint.totalPointsInSprint - sprint.carryOverPointsTotal;
  if (Math.abs(sprint.newWorkPoints - expectedNewWorkPoints) > 0.01) {
    const error = "New work points calculation is inconsistent";
    errors.push(error);
    fieldErrors.newWorkPoints = error;
  }

  const expectedPlannedPoints =
    sprint.totalPointsInSprint - sprint.carryOverPointsCompleted;
  if (Math.abs(sprint.plannedPoints - expectedPlannedPoints) > 0.01) {
    const error = "Planned points calculation is inconsistent";
    errors.push(error);
    fieldErrors.plannedPoints = error;
  }

  // Validate dates
  if (!sprint.createdAt || isNaN(Date.parse(sprint.createdAt))) {
    const error = "Created date is invalid";
    errors.push(error);
    fieldErrors.createdAt = error;
  }

  if (!sprint.updatedAt || isNaN(Date.parse(sprint.updatedAt))) {
    const error = "Updated date is invalid";
    errors.push(error);
    fieldErrors.updatedAt = error;
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validates application configuration
 */
export function validateAppConfig(config: AppConfig): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Validate velocity calculation sprints
  const velocitySprintsError = validateNumericField(
    config.velocityCalculationSprints,
    "Velocity calculation sprints",
    {
      required: true,
      min: VALIDATION_LIMITS.MIN_VELOCITY_SPRINTS,
      max: VALIDATION_LIMITS.MAX_VELOCITY_SPRINTS,
      integer: true,
      allowZero: false,
    }
  );
  if (velocitySprintsError) {
    errors.push(velocitySprintsError);
    fieldErrors.velocityCalculationSprints = velocitySprintsError;
  }

  // Validate default meeting percentage
  const meetingPercentageError = validateNumericField(
    config.defaultMeetingPercentage,
    "Default meeting percentage",
    {
      required: true,
      min: VALIDATION_LIMITS.MIN_MEETING_PERCENTAGE,
      max: VALIDATION_LIMITS.MAX_MEETING_PERCENTAGE,
    }
  );
  if (meetingPercentageError) {
    errors.push(meetingPercentageError);
    fieldErrors.defaultMeetingPercentage = meetingPercentageError;
  }

  // Validate team members array
  if (!Array.isArray(config.teamMembers)) {
    const error = "Team members must be an array";
    errors.push(error);
    fieldErrors.teamMembers = error;
  } else {
    // Validate each team member
    config.teamMembers.forEach((member, index) => {
      const memberValidation = validateTeamMember(member);
      if (!memberValidation.isValid) {
        memberValidation.errors.forEach((error) => {
          errors.push(`Team member ${index + 1}: ${error}`);
        });
        fieldErrors[`teamMember${index}`] = memberValidation.errors.join(", ");
      }
    });

    // Check for duplicate team member names
    const names = config.teamMembers.map((m) => m.name.toLowerCase().trim());
    const duplicates = names.filter(
      (name, index) => names.indexOf(name) !== index
    );
    if (duplicates.length > 0) {
      const error = `Duplicate team member names found: ${duplicates.join(
        ", "
      )}`;
      errors.push(error);
      fieldErrors.teamMembersDuplicates = error;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Validates data file integrity
 */
export function validateDataIntegrity(data: unknown): ValidationResult {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  // Check basic structure
  if (!data || typeof data !== "object") {
    const error = "Data must be a valid object";
    errors.push(error);
    fieldErrors.structure = error;
    return { isValid: false, errors, fieldErrors };
  }

  // Check for required top-level properties
  if (!data.hasOwnProperty("sprints")) {
    const error = "Data must contain a 'sprints' property";
    errors.push(error);
    fieldErrors.sprints = error;
  }

  if (!data.hasOwnProperty("config")) {
    const error = "Data must contain a 'config' property";
    errors.push(error);
    fieldErrors.config = error;
  }

  // Validate sprints array
  if (data.sprints && Array.isArray(data.sprints)) {
    data.sprints.forEach((sprint: unknown, index: number) => {
      const sprintValidation = validateSprint(sprint);
      if (!sprintValidation.isValid) {
        sprintValidation.errors.forEach((error) => {
          errors.push(`Sprint ${index + 1}: ${error}`);
        });
      }
    });
  } else if (data.sprints) {
    const error = "Sprints must be an array";
    errors.push(error);
    fieldErrors.sprintsType = error;
  }

  // Validate config
  if (data.config) {
    const configValidation = validateAppConfig(data.config);
    if (!configValidation.isValid) {
      configValidation.errors.forEach((error) => {
        errors.push(`Config: ${error}`);
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    fieldErrors,
  };
}

/**
 * Sanitizes string input to prevent XSS and other issues
 */
export function sanitizeString(input: string): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Sanitizes numeric input
 */
export function sanitizeNumber(input: unknown, fallback = 0): number {
  const num = parseFloat(input);
  return isNaN(num) ? fallback : num;
}

/**
 * Creates user-friendly error messages
 */
export function formatValidationErrors(validation: ValidationResult): string {
  if (validation.isValid) return "";

  if (validation.errors.length === 1) {
    return validation.errors[0];
  }

  return `Multiple validation errors:\n• ${validation.errors.join("\n• ")}`;
}

/**
 * Checks if data appears to be corrupted
 */
export function isDataCorrupted(data: unknown): boolean {
  try {
    // Basic corruption checks
    if (!data || typeof data !== "object") return true;
    if (!data.hasOwnProperty("sprints") || !data.hasOwnProperty("config"))
      return true;
    if (!Array.isArray(data.sprints)) return true;

    // Check for obviously invalid data
    if (
      data.sprints.some(
        (s: { id?: string; sprintName?: string }) => !s.id || !s.sprintName
      )
    )
      return true;
    if (!data.config.hasOwnProperty("velocityCalculationSprints")) return true;

    return false;
  } catch {
    return true;
  }
}
