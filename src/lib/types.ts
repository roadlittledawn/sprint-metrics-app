/**
 * Type definitions for Sprint Data Tracker application
 */

export interface Sprint {
  id: string;
  sprintName: string;
  taskeiLink?: string;
  businessDays: number;
  numberOfPeople: number;
  workingHours: number; // Net hours after subtracting on-call, meetings, PTO
  totalPointsInSprint: number; // All points on tickets
  carryOverPointsTotal: number; // Remaining estimates from previous sprint
  carryOverPointsCompleted: number; // Carry over points finished this sprint
  newWorkPoints: number; // Calculated: totalPointsInSprint - carryOverPointsTotal
  unplannedPointsBroughtIn: number; // Mid-sprint additions
  pointsCompleted: number; // Calculated: total completed - carryOverPointsCompleted
  plannedPoints: number; // Calculated: totalPointsInSprint - carryOverPointsCompleted
  percentComplete: number; // Calculated: (pointsCompleted / plannedPoints) * 100
  velocity: number; // Calculated: pointsCompleted / workingHours
  predictedCapacity: number; // Forecasted based on average velocity
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  name: string;
  totalGrossHours: number;
  onCallHours: number;
  meetingHours: number; // 20% of gross hours by default
  timeOffHours: number;
  netHours: number; // Calculated
}

export interface AppConfig {
  velocityCalculationSprints: number; // Default: 6
  teamMembers: TeamMember[];
  defaultMeetingPercentage: number; // Default: 20
}

// Data structure for the complete application data
export interface AppData {
  sprints: Sprint[];
  config: AppConfig;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Form data types for creating/updating sprints
export interface SprintFormData {
  sprintName: string;
  taskeiLink?: string;
  businessDays: number;
  numberOfPeople: number;
  totalPointsInSprint: number;
  carryOverPointsTotal: number;
  carryOverPointsCompleted: number;
  unplannedPointsBroughtIn: number;
  pointsCompleted: number;
}

// Metrics calculation results
export interface SprintMetrics {
  currentSprintStatus: {
    sprintName: string;
    percentComplete: number;
    pointsCompleted: number;
    plannedPoints: number;
  };
  averageVelocity: number;
  forecastedCapacity: number;
  capacityUtilization: number;
  sprintCompletionRate: number;
  pointsPerHour: number;
}

// Chart data types
export interface VelocityTrendData {
  sprintName: string;
  velocity: number;
  date: string;
}

export interface SprintComparisonData {
  sprintName: string;
  plannedPoints: number;
  actualPoints: number;
}
