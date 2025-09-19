/**
 * Unit tests for calculation functions
 */

import { describe, it, expect } from "vitest";
import {
  calculateWorkingHours,
  calculateTeamMemberNetHours,
  validateTeamMemberHours,
  calculatePlannedPoints,
  calculateNewWorkPoints,
  calculatePointsCompleted,
  calculatePercentComplete,
  calculateVelocity,
  calculateSprintMetrics,
  calculateAverageVelocity,
  calculatePredictedCapacity,
  getForecastingInsights,
  calculateVelocityTrend,
} from "../calculations";
import { TeamMember, Sprint } from "../types";

describe("Working Hours Calculations", () => {
  describe("calculateWorkingHours", () => {
    it("should calculate net working hours for a single team member", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 0, // Will be calculated
        },
      ];

      const result = calculateWorkingHours(teamMembers);
      expect(result).toBe(32); // 40 - 0 - 8 - 0 = 32
    });

    it("should calculate net working hours for multiple team members", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 0,
        },
        {
          name: "Sarah",
          totalGrossHours: 40,
          onCallHours: 8,
          meetingHours: 8,
          timeOffHours: 8,
          netHours: 0,
        },
      ];

      const result = calculateWorkingHours(teamMembers);
      expect(result).toBe(48); // Eric: 32 + Sarah: 16 = 48
    });

    it("should use default meeting percentage when meetingHours is undefined", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: undefined as any, // Simulate undefined
          timeOffHours: 0,
          netHours: 0,
        },
      ];

      const result = calculateWorkingHours(teamMembers, 20);
      expect(result).toBe(32); // 40 - 0 - (40 * 0.2) - 0 = 32
    });

    it("should use custom meeting percentage", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: undefined as any,
          timeOffHours: 0,
          netHours: 0,
        },
      ];

      const result = calculateWorkingHours(teamMembers, 25);
      expect(result).toBe(30); // 40 - 0 - (40 * 0.25) - 0 = 30
    });

    it("should handle negative hours scenarios by returning 0 for that member", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Eron",
          totalGrossHours: 40,
          onCallHours: 40, // On-call for entire sprint
          meetingHours: 0,
          timeOffHours: 0,
          netHours: 0,
        },
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 0,
        },
      ];

      const result = calculateWorkingHours(teamMembers);
      expect(result).toBe(32); // Eron: 0 (negative clamped) + Eric: 32 = 32
    });

    it("should handle extreme negative scenario", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Overbooked",
          totalGrossHours: 40,
          onCallHours: 20,
          meetingHours: 15,
          timeOffHours: 10,
          netHours: 0,
        },
      ];

      const result = calculateWorkingHours(teamMembers);
      expect(result).toBe(0); // 40 - 20 - 15 - 10 = -5, clamped to 0
    });

    it("should handle empty team members array", () => {
      const result = calculateWorkingHours([]);
      expect(result).toBe(0);
    });
  });

  describe("calculateTeamMemberNetHours", () => {
    it("should calculate and update net hours for a team member", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = calculateTeamMemberNetHours(member);
      expect(result.netHours).toBe(32);
      expect(result.meetingHours).toBe(8);
    });

    it("should calculate meeting hours from percentage when not provided", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: undefined as any,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = calculateTeamMemberNetHours(member, 25);
      expect(result.netHours).toBe(30); // 40 - 0 - 10 - 0 = 30
      expect(result.meetingHours).toBe(10); // 40 * 0.25 = 10
    });

    it("should clamp negative net hours to 0", () => {
      const member: TeamMember = {
        name: "Overbooked",
        totalGrossHours: 40,
        onCallHours: 50,
        meetingHours: 0,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = calculateTeamMemberNetHours(member);
      expect(result.netHours).toBe(0);
    });
  });

  describe("validateTeamMemberHours", () => {
    it("should validate correct team member hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect negative gross hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: -10,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Eric: Total gross hours cannot be negative"
      );
    });

    it("should detect negative on-call hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: -5,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Eric: On-call hours cannot be negative");
    });

    it("should detect negative meeting hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: -3,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Eric: Meeting hours cannot be negative");
    });

    it("should detect negative time off hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: -2,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Eric: Time off hours cannot be negative"
      );
    });

    it("should detect when deductions exceed gross hours", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: 40,
        onCallHours: 20,
        meetingHours: 15,
        timeOffHours: 10,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Eric: Total deductions (45h) exceed gross hours (40h)"
      );
    });

    it("should detect multiple validation errors", () => {
      const member: TeamMember = {
        name: "Eric",
        totalGrossHours: -10,
        onCallHours: -5,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0,
      };

      const result = validateTeamMemberHours(member);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3); // Also detects deductions exceed gross hours
      expect(result.errors).toContain(
        "Eric: Total gross hours cannot be negative"
      );
      expect(result.errors).toContain("Eric: On-call hours cannot be negative");
      expect(result.errors).toContain(
        "Eric: Total deductions (3h) exceed gross hours (-10h)"
      );
    });
  });
});

describe("Sprint Metrics Calculations", () => {
  describe("calculatePlannedPoints", () => {
    it("should calculate planned points correctly", () => {
      const result = calculatePlannedPoints(30, 3);
      expect(result).toBe(27); // 30 - 3 = 27
    });

    it("should handle zero carry over completed points", () => {
      const result = calculatePlannedPoints(30, 0);
      expect(result).toBe(30);
    });

    it("should handle case where carry over completed equals total points", () => {
      const result = calculatePlannedPoints(30, 30);
      expect(result).toBe(0);
    });
  });

  describe("calculateNewWorkPoints", () => {
    it("should calculate new work points correctly", () => {
      const result = calculateNewWorkPoints(30, 5);
      expect(result).toBe(25); // 30 - 5 = 25
    });

    it("should handle zero carry over total points", () => {
      const result = calculateNewWorkPoints(30, 0);
      expect(result).toBe(30);
    });

    it("should handle case where carry over total equals total points", () => {
      const result = calculateNewWorkPoints(30, 30);
      expect(result).toBe(0);
    });
  });

  describe("calculatePointsCompleted", () => {
    it("should calculate points completed correctly", () => {
      const result = calculatePointsCompleted(28, 3);
      expect(result).toBe(25); // 28 - 3 = 25
    });

    it("should handle zero carry over completed points", () => {
      const result = calculatePointsCompleted(28, 0);
      expect(result).toBe(28);
    });

    it("should handle case where all completed points are carry over", () => {
      const result = calculatePointsCompleted(5, 5);
      expect(result).toBe(0);
    });
  });

  describe("calculatePercentComplete", () => {
    it("should calculate percent complete correctly", () => {
      const result = calculatePercentComplete(25, 27);
      expect(result).toBeCloseTo(92.59, 2); // (25/27) * 100 ≈ 92.59
    });

    it("should handle 100% completion", () => {
      const result = calculatePercentComplete(27, 27);
      expect(result).toBe(100);
    });

    it("should handle zero planned points (division by zero)", () => {
      const result = calculatePercentComplete(25, 0);
      expect(result).toBe(0);
    });

    it("should handle negative planned points", () => {
      const result = calculatePercentComplete(25, -5);
      expect(result).toBe(0);
    });

    it("should handle over-completion", () => {
      const result = calculatePercentComplete(30, 27);
      expect(result).toBeCloseTo(111.11, 2); // (30/27) * 100 ≈ 111.11
    });
  });

  describe("calculateVelocity", () => {
    it("should calculate velocity correctly", () => {
      const result = calculateVelocity(25, 120);
      expect(result).toBeCloseTo(0.208, 3); // 25/120 ≈ 0.208
    });

    it("should handle zero working hours (division by zero)", () => {
      const result = calculateVelocity(25, 0);
      expect(result).toBe(0);
    });

    it("should handle negative working hours", () => {
      const result = calculateVelocity(25, -10);
      expect(result).toBe(0);
    });

    it("should handle zero points completed", () => {
      const result = calculateVelocity(0, 120);
      expect(result).toBe(0);
    });

    it("should handle fractional results", () => {
      const result = calculateVelocity(13, 40);
      expect(result).toBe(0.325); // 13/40 = 0.325
    });
  });

  describe("calculateSprintMetrics", () => {
    it("should calculate all metrics correctly for a typical sprint", () => {
      const sprintData = {
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        totalCompletedPoints: 28,
        workingHours: 120,
      };

      const result = calculateSprintMetrics(sprintData);

      expect(result.plannedPoints).toBe(27); // 30 - 3
      expect(result.newWorkPoints).toBe(25); // 30 - 5
      expect(result.pointsCompleted).toBe(25); // 28 - 3
      expect(result.percentComplete).toBeCloseTo(92.59, 2); // (25/27) * 100
      expect(result.velocity).toBeCloseTo(0.208, 3); // 25/120
    });

    it("should handle edge case with zero working hours", () => {
      const sprintData = {
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        totalCompletedPoints: 28,
        workingHours: 0,
      };

      const result = calculateSprintMetrics(sprintData);

      expect(result.plannedPoints).toBe(27);
      expect(result.newWorkPoints).toBe(25);
      expect(result.pointsCompleted).toBe(25);
      expect(result.percentComplete).toBeCloseTo(92.59, 2);
      expect(result.velocity).toBe(0); // Division by zero handled
    });

    it("should handle edge case with zero planned points", () => {
      const sprintData = {
        totalPointsInSprint: 5,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 5,
        totalCompletedPoints: 5,
        workingHours: 120,
      };

      const result = calculateSprintMetrics(sprintData);

      expect(result.plannedPoints).toBe(0); // 5 - 5
      expect(result.newWorkPoints).toBe(0); // 5 - 5
      expect(result.pointsCompleted).toBe(0); // 5 - 5
      expect(result.percentComplete).toBe(0); // Division by zero handled
      expect(result.velocity).toBe(0); // 0/120
    });

    it("should handle sprint with no carry over", () => {
      const sprintData = {
        totalPointsInSprint: 30,
        carryOverPointsTotal: 0,
        carryOverPointsCompleted: 0,
        totalCompletedPoints: 25,
        workingHours: 120,
      };

      const result = calculateSprintMetrics(sprintData);

      expect(result.plannedPoints).toBe(30); // 30 - 0
      expect(result.newWorkPoints).toBe(30); // 30 - 0
      expect(result.pointsCompleted).toBe(25); // 25 - 0
      expect(result.percentComplete).toBeCloseTo(83.33, 2); // (25/30) * 100
      expect(result.velocity).toBeCloseTo(0.208, 3); // 25/120
    });
  });
});
describe("Forecasting and Average Velocity Functions", () => {
  // Sample sprint data for testing
  const sampleSprints: Sprint[] = [
    {
      id: "sprint-1",
      sprintName: "Sprint 1",
      businessDays: 10,
      numberOfPeople: 5,
      workingHours: 120,
      totalPointsInSprint: 30,
      carryOverPointsTotal: 0,
      carryOverPointsCompleted: 0,
      newWorkPoints: 30,
      unplannedPointsBroughtIn: 0,
      pointsCompleted: 25,
      plannedPoints: 30,
      percentComplete: 83.33,
      velocity: 0.208, // 25/120
      predictedCapacity: 0,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    },
    {
      id: "sprint-2",
      sprintName: "Sprint 2",
      businessDays: 10,
      numberOfPeople: 5,
      workingHours: 120,
      totalPointsInSprint: 32,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      newWorkPoints: 27,
      unplannedPointsBroughtIn: 2,
      pointsCompleted: 27,
      plannedPoints: 29,
      percentComplete: 93.1,
      velocity: 0.225, // 27/120
      predictedCapacity: 0,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-15",
    },
    {
      id: "sprint-3",
      sprintName: "Sprint 3",
      businessDays: 10,
      numberOfPeople: 5,
      workingHours: 120,
      totalPointsInSprint: 35,
      carryOverPointsTotal: 2,
      carryOverPointsCompleted: 2,
      newWorkPoints: 33,
      unplannedPointsBroughtIn: 0,
      pointsCompleted: 30,
      plannedPoints: 33,
      percentComplete: 90.9,
      velocity: 0.25, // 30/120
      predictedCapacity: 0,
      createdAt: "2024-02-01",
      updatedAt: "2024-02-01",
    },
  ];

  describe("calculateAverageVelocity", () => {
    it("should calculate average velocity correctly", () => {
      const result = calculateAverageVelocity(sampleSprints, 3);
      const expectedAverage = (0.208 + 0.225 + 0.25) / 3;
      expect(result).toBeCloseTo(expectedAverage, 3);
    });

    it("should handle fewer sprints than requested", () => {
      const result = calculateAverageVelocity(sampleSprints.slice(0, 2), 6);
      const expectedAverage = (0.208 + 0.225) / 2;
      expect(result).toBeCloseTo(expectedAverage, 3);
    });

    it("should handle empty sprint array", () => {
      const result = calculateAverageVelocity([], 6);
      expect(result).toBe(0);
    });

    it("should use default numberOfSprints when not provided", () => {
      const result = calculateAverageVelocity(sampleSprints);
      const expectedAverage = (0.208 + 0.225 + 0.25) / 3; // All 3 sprints since we have less than 6
      expect(result).toBeCloseTo(expectedAverage, 3);
    });

    it("should take only the most recent sprints", () => {
      const moreSprints = [
        ...sampleSprints,
        {
          ...sampleSprints[0],
          id: "sprint-4",
          velocity: 0.3,
        },
      ];

      const result = calculateAverageVelocity(moreSprints, 2);
      const expectedAverage = (0.25 + 0.3) / 2; // Last 2 sprints
      expect(result).toBeCloseTo(expectedAverage, 3);
    });
  });

  describe("calculatePredictedCapacity", () => {
    it("should calculate predicted capacity correctly", () => {
      const averageVelocity = 0.225;
      const upcomingWorkingHours = 120;
      const result = calculatePredictedCapacity(
        averageVelocity,
        upcomingWorkingHours
      );
      expect(result).toBeCloseTo(27, 1); // 0.225 * 120 = 27
    });

    it("should handle zero average velocity", () => {
      const result = calculatePredictedCapacity(0, 120);
      expect(result).toBe(0);
    });

    it("should handle negative average velocity", () => {
      const result = calculatePredictedCapacity(-0.1, 120);
      expect(result).toBe(0);
    });

    it("should handle zero working hours", () => {
      const result = calculatePredictedCapacity(0.225, 0);
      expect(result).toBe(0);
    });

    it("should handle negative working hours", () => {
      const result = calculatePredictedCapacity(0.225, -10);
      expect(result).toBe(0);
    });
  });

  describe("getForecastingInsights", () => {
    it("should provide insights for good data quality", () => {
      const result = getForecastingInsights(sampleSprints, 120, 3);

      expect(result.dataQuality).toBe("excellent");
      expect(result.sprintsUsed).toBe(3);
      expect(result.averageVelocity).toBeCloseTo(0.228, 2);
      expect(result.predictedCapacity).toBeCloseTo(27.3, 1);
      expect(result.warnings).toHaveLength(0);
    });

    it("should detect insufficient data", () => {
      const result = getForecastingInsights([], 120, 6);

      expect(result.dataQuality).toBe("insufficient");
      expect(result.sprintsUsed).toBe(0);
      expect(result.averageVelocity).toBe(0);
      expect(result.predictedCapacity).toBe(0);
      expect(result.warnings).toContain(
        "No historical sprint data available for forecasting"
      );
      expect(result.recommendations).toContain(
        "Complete at least 2-3 sprints to get meaningful forecasts"
      );
    });

    it("should detect limited data", () => {
      const result = getForecastingInsights(sampleSprints.slice(0, 2), 120, 6);

      expect(result.dataQuality).toBe("limited");
      expect(result.sprintsUsed).toBe(2);
      expect(result.warnings).toContain(
        "Only 2 sprint(s) available for forecasting - predictions may be unreliable"
      );
      expect(result.recommendations).toContain(
        "Complete more sprints to improve forecast accuracy"
      );
    });

    it("should detect good data quality when fewer sprints than requested", () => {
      const result = getForecastingInsights(sampleSprints, 120, 6);

      expect(result.dataQuality).toBe("good");
      expect(result.sprintsUsed).toBe(3);
      expect(result.warnings).toContain(
        "Using 3 sprints instead of requested 6 for forecasting"
      );
    });

    it("should detect zero velocity sprints", () => {
      const sprintsWithZero = [
        ...sampleSprints,
        {
          ...sampleSprints[0],
          id: "sprint-zero",
          velocity: 0,
        },
      ];

      const result = getForecastingInsights(sprintsWithZero, 120, 4);

      expect(result.warnings).toContain(
        "1 sprint(s) with zero velocity detected"
      );
      expect(result.recommendations).toContain(
        "Review sprints with zero velocity for data accuracy"
      );
    });
  });

  describe("calculateVelocityTrend", () => {
    it("should detect improving trend", () => {
      const improvingSprints = [
        { ...sampleSprints[0], velocity: 0.15 },
        { ...sampleSprints[1], velocity: 0.18 },
        { ...sampleSprints[2], velocity: 0.2 },
        { ...sampleSprints[0], id: "sprint-4", velocity: 0.25 },
        { ...sampleSprints[1], id: "sprint-5", velocity: 0.28 },
        { ...sampleSprints[2], id: "sprint-6", velocity: 0.3 },
      ];

      const result = calculateVelocityTrend(improvingSprints, 3);

      expect(result.trend).toBe("improving");
      expect(result.recentAverage).toBeCloseTo(0.277, 2); // (0.25 + 0.28 + 0.30) / 3
      expect(result.previousAverage).toBeCloseTo(0.177, 2); // (0.15 + 0.18 + 0.20) / 3
      expect(result.changePercent).toBeGreaterThan(0);
    });

    it("should detect declining trend", () => {
      const decliningSprints = [
        { ...sampleSprints[0], velocity: 0.3 },
        { ...sampleSprints[1], velocity: 0.28 },
        { ...sampleSprints[2], velocity: 0.25 },
        { ...sampleSprints[0], id: "sprint-4", velocity: 0.2 },
        { ...sampleSprints[1], id: "sprint-5", velocity: 0.18 },
        { ...sampleSprints[2], id: "sprint-6", velocity: 0.15 },
      ];

      const result = calculateVelocityTrend(decliningSprints, 3);

      expect(result.trend).toBe("declining");
      expect(result.recentAverage).toBeCloseTo(0.177, 2); // (0.20 + 0.18 + 0.15) / 3
      expect(result.previousAverage).toBeCloseTo(0.277, 2); // (0.30 + 0.28 + 0.25) / 3
      expect(result.changePercent).toBeLessThan(0);
    });

    it("should detect stable trend", () => {
      const stableSprints = [
        { ...sampleSprints[0], velocity: 0.2 },
        { ...sampleSprints[1], velocity: 0.21 },
        { ...sampleSprints[2], velocity: 0.19 },
        { ...sampleSprints[0], id: "sprint-4", velocity: 0.2 },
        { ...sampleSprints[1], id: "sprint-5", velocity: 0.21 },
        { ...sampleSprints[2], id: "sprint-6", velocity: 0.19 },
      ];

      const result = calculateVelocityTrend(stableSprints, 3);

      expect(result.trend).toBe("stable");
      expect(Math.abs(result.changePercent)).toBeLessThan(5);
    });

    it("should handle insufficient data", () => {
      const result = calculateVelocityTrend(sampleSprints.slice(0, 2), 3);

      expect(result.trend).toBe("insufficient_data");
      expect(result.trendStrength).toBe("weak");
      expect(result.recentAverage).toBe(0);
      expect(result.previousAverage).toBe(0);
      expect(result.changePercent).toBe(0);
    });

    it("should classify trend strength correctly", () => {
      // Strong improving trend (>30% change)
      const strongImprovingSprints = [
        { ...sampleSprints[0], velocity: 0.1 },
        { ...sampleSprints[1], velocity: 0.12 },
        { ...sampleSprints[2], velocity: 0.11 },
        { ...sampleSprints[0], id: "sprint-4", velocity: 0.16 },
        { ...sampleSprints[1], id: "sprint-5", velocity: 0.17 },
        { ...sampleSprints[2], id: "sprint-6", velocity: 0.15 },
      ];

      const result = calculateVelocityTrend(strongImprovingSprints, 3);

      expect(result.trend).toBe("improving");
      expect(result.trendStrength).toBe("strong");
    });
  });
});
