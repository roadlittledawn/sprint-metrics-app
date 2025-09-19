/**
 * Basic end-to-end workflow tests
 * Tests core functionality without complex environment dependencies
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  calculateWorkingHours,
  calculateSprintMetrics,
  calculateAverageVelocity,
  calculatePredictedCapacity,
  getForecastingInsights,
} from "@/lib/calculations";
import { validateSprint, validateTeamMember } from "@/lib/validation";
import { Sprint, TeamMember, AppConfig } from "@/lib/types";

describe("Basic End-to-End Workflow Tests", () => {
  describe("Complete Sprint Creation Workflow", () => {
    it("should handle complete sprint creation from team setup to metrics calculation", () => {
      // Step 1: Setup team configuration
      const teamMembers: TeamMember[] = [
        {
          name: "Alice Developer",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        },
        {
          name: "Bob Developer",
          totalGrossHours: 40,
          onCallHours: 8,
          meetingHours: 8,
          timeOffHours: 4,
          netHours: 20,
        },
        {
          name: "Charlie Developer",
          totalGrossHours: 32, // Part-time
          onCallHours: 0,
          meetingHours: 6.4, // 20% of 32
          timeOffHours: 8, // Taking some time off
          netHours: 17.6,
        },
      ];

      // Step 2: Validate team members
      for (const member of teamMembers) {
        const validation = validateTeamMember(member);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      }

      // Step 3: Calculate working hours from team
      const workingHours = calculateWorkingHours(teamMembers, 20);
      expect(workingHours).toBeCloseTo(69.6, 1); // 32 + 20 + 17.6

      // Step 4: Create sprint with calculated working hours
      const sprintData = {
        totalPointsInSprint: 45,
        carryOverPointsTotal: 8,
        carryOverPointsCompleted: 5,
        totalCompletedPoints: 42,
        workingHours,
      };

      const metrics = calculateSprintMetrics(sprintData);

      const sprint: Sprint = {
        id: "workflow-test-sprint",
        sprintName: "Workflow Test Sprint",
        taskeiLink: "https://taskei.com/sprint/test",
        businessDays: 10,
        numberOfPeople: teamMembers.length,
        workingHours,
        totalPointsInSprint: sprintData.totalPointsInSprint,
        carryOverPointsTotal: sprintData.carryOverPointsTotal,
        carryOverPointsCompleted: sprintData.carryOverPointsCompleted,
        newWorkPoints: metrics.newWorkPoints,
        unplannedPointsBroughtIn: 3,
        pointsCompleted: metrics.pointsCompleted,
        plannedPoints: metrics.plannedPoints,
        percentComplete: metrics.percentComplete,
        velocity: metrics.velocity,
        predictedCapacity: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      // Step 5: Validate sprint data
      const validation = validateSprint(sprint);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 6: Verify calculations are correct
      expect(sprint.plannedPoints).toBe(40); // 45 - 5
      expect(sprint.newWorkPoints).toBe(37); // 45 - 8
      expect(sprint.pointsCompleted).toBe(37); // 42 - 5
      expect(sprint.percentComplete).toBe(92.5); // (37/40) * 100
      expect(sprint.velocity).toBeCloseTo(0.532, 3); // 37/69.6
    });

    it("should handle sprint creation with edge cases", () => {
      // Team with challenging hours allocation
      const teamMembers: TeamMember[] = [
        {
          name: "On-call Heavy",
          totalGrossHours: 40,
          onCallHours: 35, // Heavy on-call
          meetingHours: 2,
          timeOffHours: 0,
          netHours: 3,
        },
        {
          name: "Meeting Heavy",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 20, // Lots of meetings
          timeOffHours: 8,
          netHours: 12,
        },
      ];

      const workingHours = calculateWorkingHours(teamMembers, 20);
      expect(workingHours).toBe(15); // 3 + 12

      // Sprint with challenging metrics
      const sprintData = {
        totalPointsInSprint: 20,
        carryOverPointsTotal: 15, // Lots of carry over
        carryOverPointsCompleted: 10,
        totalCompletedPoints: 12, // Low completion
        workingHours,
      };

      const metrics = calculateSprintMetrics(sprintData);

      const sprint: Sprint = {
        id: "challenging-sprint",
        sprintName: "Challenging Sprint",
        businessDays: 10,
        numberOfPeople: teamMembers.length,
        workingHours,
        totalPointsInSprint: sprintData.totalPointsInSprint,
        carryOverPointsTotal: sprintData.carryOverPointsTotal,
        carryOverPointsCompleted: sprintData.carryOverPointsCompleted,
        newWorkPoints: metrics.newWorkPoints,
        unplannedPointsBroughtIn: 0,
        pointsCompleted: metrics.pointsCompleted,
        plannedPoints: metrics.plannedPoints,
        percentComplete: metrics.percentComplete,
        velocity: metrics.velocity,
        predictedCapacity: 0,
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: "2024-01-15T00:00:00.000Z",
      };

      expect(sprint.plannedPoints).toBe(10); // 20 - 10
      expect(sprint.newWorkPoints).toBe(5); // 20 - 15
      expect(sprint.pointsCompleted).toBe(2); // 12 - 10
      expect(sprint.percentComplete).toBe(20); // (2/10) * 100
      expect(sprint.velocity).toBeCloseTo(0.133, 3); // 2/15
    });
  });

  describe("Dashboard Metrics Calculation Accuracy", () => {
    const testSprints: Sprint[] = [
      {
        id: "metrics-sprint-1",
        sprintName: "Metrics Sprint 1",
        businessDays: 10,
        numberOfPeople: 3,
        workingHours: 120,
        totalPointsInSprint: 30,
        carryOverPointsTotal: 0,
        carryOverPointsCompleted: 0,
        newWorkPoints: 30,
        unplannedPointsBroughtIn: 2,
        pointsCompleted: 25,
        plannedPoints: 30,
        percentComplete: 83.33,
        velocity: 0.208, // 25/120
        predictedCapacity: 0,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      },
      {
        id: "metrics-sprint-2",
        sprintName: "Metrics Sprint 2",
        businessDays: 10,
        numberOfPeople: 3,
        workingHours: 120,
        totalPointsInSprint: 35,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        newWorkPoints: 30,
        unplannedPointsBroughtIn: 1,
        pointsCompleted: 28,
        plannedPoints: 32,
        percentComplete: 87.5,
        velocity: 0.233, // 28/120
        predictedCapacity: 0,
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: "2024-01-15T00:00:00.000Z",
      },
      {
        id: "metrics-sprint-3",
        sprintName: "Metrics Sprint 3",
        businessDays: 10,
        numberOfPeople: 3,
        workingHours: 120,
        totalPointsInSprint: 32,
        carryOverPointsTotal: 2,
        carryOverPointsCompleted: 2,
        newWorkPoints: 30,
        unplannedPointsBroughtIn: 0,
        pointsCompleted: 30,
        plannedPoints: 30,
        percentComplete: 100,
        velocity: 0.25, // 30/120
        predictedCapacity: 0,
        createdAt: "2024-02-01T00:00:00.000Z",
        updatedAt: "2024-02-01T00:00:00.000Z",
      },
    ];

    it("should calculate average velocity correctly", () => {
      // Test different averaging periods
      const avg3 = calculateAverageVelocity(testSprints, 3);
      expect(avg3).toBeCloseTo(0.23, 3); // (0.208 + 0.233 + 0.25) / 3

      const avg2 = calculateAverageVelocity(testSprints, 2);
      expect(avg2).toBeCloseTo(0.2415, 3); // (0.233 + 0.25) / 2 (last 2 sprints)

      const avgAll = calculateAverageVelocity(testSprints, 10);
      expect(avgAll).toBeCloseTo(0.23, 3); // All 3 sprints
    });

    it("should calculate predicted capacity accurately", () => {
      const avgVelocity = calculateAverageVelocity(testSprints, 3);

      // Test with different working hours scenarios
      const capacity120 = calculatePredictedCapacity(avgVelocity, 120);
      expect(capacity120).toBeCloseTo(27.6, 1); // 0.230 * 120

      const capacity100 = calculatePredictedCapacity(avgVelocity, 100);
      expect(capacity100).toBeCloseTo(23.0, 1); // 0.230 * 100

      const capacity150 = calculatePredictedCapacity(avgVelocity, 150);
      expect(capacity150).toBeCloseTo(34.55, 1); // 0.230 * 150
    });

    it("should provide accurate forecasting insights", () => {
      const insights = getForecastingInsights(testSprints, 120, 6);

      expect(insights.dataQuality).toBe("good");
      expect(insights.sprintsUsed).toBe(3);
      expect(insights.averageVelocity).toBeCloseTo(0.23, 3);
      expect(insights.predictedCapacity).toBeCloseTo(27.6, 1);
      expect(insights.warnings).toContain(
        "Using 3 sprints instead of requested 6 for forecasting"
      );
      expect(insights.recommendations).toContain(
        "Complete more sprints to improve forecast accuracy"
      );
    });

    it("should validate calculations against spreadsheet formulas", () => {
      // Manually verify each sprint's calculations match expected spreadsheet formulas
      for (const sprint of testSprints) {
        // Planned Points = Total Points - Carry Over Completed
        const expectedPlannedPoints =
          sprint.totalPointsInSprint - sprint.carryOverPointsCompleted;
        expect(sprint.plannedPoints).toBe(expectedPlannedPoints);

        // New Work Points = Total Points - Carry Over Total
        const expectedNewWorkPoints =
          sprint.totalPointsInSprint - sprint.carryOverPointsTotal;
        expect(sprint.newWorkPoints).toBe(expectedNewWorkPoints);

        // Points Completed = Total Completed - Carry Over Completed
        // We need to reverse-calculate total completed from points completed
        const totalCompleted =
          sprint.pointsCompleted + sprint.carryOverPointsCompleted;
        const expectedPointsCompleted =
          totalCompleted - sprint.carryOverPointsCompleted;
        expect(sprint.pointsCompleted).toBe(expectedPointsCompleted);

        // Percent Complete = (Points Completed / Planned Points) * 100
        const expectedPercentComplete =
          sprint.plannedPoints > 0
            ? (sprint.pointsCompleted / sprint.plannedPoints) * 100
            : 0;
        expect(sprint.percentComplete).toBeCloseTo(expectedPercentComplete, 2);

        // Velocity = Points Completed / Working Hours
        const expectedVelocity =
          sprint.workingHours > 0
            ? sprint.pointsCompleted / sprint.workingHours
            : 0;
        expect(sprint.velocity).toBeCloseTo(expectedVelocity, 3);
      }
    });
  });

  describe("Various Data Scenarios", () => {
    it("should handle empty data state correctly", () => {
      const emptySprints: Sprint[] = [];

      // Verify calculations handle empty state
      const avgVelocity = calculateAverageVelocity(emptySprints, 6);
      expect(avgVelocity).toBe(0);

      const predictedCapacity = calculatePredictedCapacity(avgVelocity, 120);
      expect(predictedCapacity).toBe(0);

      const insights = getForecastingInsights(emptySprints, 120, 6);
      expect(insights.dataQuality).toBe("insufficient");
      expect(insights.warnings).toContain(
        "No historical sprint data available for forecasting"
      );
    });

    it("should handle large datasets efficiently", () => {
      // Create 50 sprints with varying data
      const sprints: Sprint[] = [];
      for (let i = 1; i <= 50; i++) {
        const sprint: Sprint = {
          id: `large-dataset-sprint-${i.toString().padStart(3, "0")}`,
          sprintName: `Large Dataset Sprint ${i}`,
          businessDays: 10,
          numberOfPeople: 3 + (i % 3), // Vary team size
          workingHours: 100 + (i % 50), // Vary working hours
          totalPointsInSprint: 20 + (i % 30), // Vary points
          carryOverPointsTotal: i % 10, // Vary carry over
          carryOverPointsCompleted: Math.floor((i % 10) * 0.7), // 70% of carry over completed
          newWorkPoints: 20 + (i % 30) - (i % 10),
          unplannedPointsBroughtIn: i % 5,
          pointsCompleted: Math.floor((20 + (i % 30)) * 0.8), // 80% completion rate
          plannedPoints: 20 + (i % 30) - Math.floor((i % 10) * 0.7),
          percentComplete: 80,
          velocity: Math.floor((20 + (i % 30)) * 0.8) / (100 + (i % 50)),
          predictedCapacity: 0,
          createdAt: new Date(2024, 0, i).toISOString(),
          updatedAt: new Date(2024, 0, i).toISOString(),
        };
        sprints.push(sprint);
      }

      // Test calculations with large dataset
      const avgVelocity = calculateAverageVelocity(sprints, 10);
      expect(avgVelocity).toBeGreaterThan(0);

      const insights = getForecastingInsights(sprints, 120, 10);
      expect(insights.dataQuality).toBe("excellent");
      expect(insights.sprintsUsed).toBe(10);

      // Test filtering and searching (simulate dashboard operations)
      const recentSprints = sprints.slice(-10);
      expect(recentSprints).toHaveLength(10);
      expect(recentSprints[0].id).toBe("large-dataset-sprint-041");
      expect(recentSprints[9].id).toBe("large-dataset-sprint-050");
    });

    it("should handle data with extreme values", () => {
      const extremeSprints: Sprint[] = [
        // Zero values sprint
        {
          id: "extreme-zero",
          sprintName: "Zero Values Sprint",
          businessDays: 0,
          numberOfPeople: 0,
          workingHours: 0,
          totalPointsInSprint: 0,
          carryOverPointsTotal: 0,
          carryOverPointsCompleted: 0,
          newWorkPoints: 0,
          unplannedPointsBroughtIn: 0,
          pointsCompleted: 0,
          plannedPoints: 0,
          percentComplete: 0,
          velocity: 0,
          predictedCapacity: 0,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-01T00:00:00.000Z",
        },
        // Very high values sprint
        {
          id: "extreme-high",
          sprintName: "High Values Sprint",
          businessDays: 20,
          numberOfPeople: 20,
          workingHours: 1600, // 20 people * 80 hours
          totalPointsInSprint: 500,
          carryOverPointsTotal: 100,
          carryOverPointsCompleted: 80,
          newWorkPoints: 400,
          unplannedPointsBroughtIn: 50,
          pointsCompleted: 450,
          plannedPoints: 420,
          percentComplete: 107.14, // Over 100%
          velocity: 0.28125, // 450/1600
          predictedCapacity: 450,
          createdAt: "2024-01-02T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
        },
      ];

      // Verify calculations handle extreme values
      const avgVelocity = calculateAverageVelocity(extremeSprints, 2);
      expect(avgVelocity).toBeCloseTo(0.141, 3); // (0 + 0.28125) / 2

      const insights = getForecastingInsights(extremeSprints, 120, 2);
      expect(insights.dataQuality).toBe("limited");
      expect(insights.warnings).toContain(
        "1 sprint(s) with zero velocity detected"
      );
    });
  });

  describe("Team-Sprint Integration", () => {
    it("should integrate team data with sprint calculations correctly", () => {
      const teamMembers: TeamMember[] = [
        {
          name: "Full Time Developer",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        },
        {
          name: "Part Time Developer",
          totalGrossHours: 20,
          onCallHours: 0,
          meetingHours: 4,
          timeOffHours: 0,
          netHours: 16,
        },
        {
          name: "On Call Developer",
          totalGrossHours: 40,
          onCallHours: 20,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 12,
        },
      ];

      const workingHours = calculateWorkingHours(teamMembers, 20);
      expect(workingHours).toBe(60); // 32 + 16 + 12

      const sprintData = {
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        totalCompletedPoints: 28,
        workingHours,
      };

      const metrics = calculateSprintMetrics(sprintData);

      expect(metrics.plannedPoints).toBe(27); // 30 - 3
      expect(metrics.newWorkPoints).toBe(25); // 30 - 5
      expect(metrics.pointsCompleted).toBe(25); // 28 - 3
      expect(metrics.percentComplete).toBeCloseTo(92.59, 1); // (25/27) * 100
      expect(metrics.velocity).toBeCloseTo(0.417, 3); // 25/60
    });

    it("should handle edge cases in team-sprint integration", () => {
      // Team with zero net hours
      const zeroHoursTeam: TeamMember[] = [
        {
          name: "Overbooked Developer",
          totalGrossHours: 40,
          onCallHours: 40,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 0,
        },
      ];

      const workingHours = calculateWorkingHours(zeroHoursTeam, 20);
      expect(workingHours).toBe(0);

      const sprintData = {
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        totalCompletedPoints: 28,
        workingHours,
      };

      const metrics = calculateSprintMetrics(sprintData);
      expect(metrics.velocity).toBe(0); // Division by zero handled
    });
  });
});
