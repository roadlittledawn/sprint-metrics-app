/**
 * End-to-end workflow tests for Sprint Data Tracker
 * Tests complete user workflows from data entry to dashboard metrics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import {
  readSprintData,
  writeSprintData,
  addSprint,
  updateSprint,
  deleteSprint,
  readSprints,
  readConfig,
  writeConfig,
} from "@/lib/dataManager";
import {
  calculateWorkingHours,
  calculateSprintMetrics,
  calculateAverageVelocity,
  calculatePredictedCapacity,
  getForecastingInsights,
} from "@/lib/calculations";
import { validateSprintData } from "@/lib/validation";
import { AppData, Sprint, TeamMember, AppConfig } from "@/lib/types";

// Mock fs module for controlled testing
vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copyFile: vi.fn(),
  },
}));

const mockFs = fs as any;

describe("End-to-End Workflow Tests", () => {
  let mockDataStorage: AppData;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize mock data storage
    mockDataStorage = {
      sprints: [],
      config: {
        velocityCalculationSprints: 6,
        defaultMeetingPercentage: 20,
        teamMembers: [
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
        ],
      },
    };

    // Mock file system operations
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.copyFile.mockResolvedValue(undefined);

    mockFs.readFile.mockImplementation(() =>
      Promise.resolve(JSON.stringify(mockDataStorage))
    );

    mockFs.writeFile.mockImplementation((filePath: string, data: string) => {
      mockDataStorage = JSON.parse(data);
      return Promise.resolve();
    });

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Complete Sprint Creation Workflow", () => {
    it("should handle complete sprint creation from team setup to metrics calculation", async () => {
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

      const config: AppConfig = {
        velocityCalculationSprints: 6,
        defaultMeetingPercentage: 20,
        teamMembers,
      };

      await writeConfig(config);

      // Step 2: Calculate working hours from team
      const workingHours = calculateWorkingHours(
        teamMembers,
        config.defaultMeetingPercentage
      );
      expect(workingHours).toBeCloseTo(69.6, 1); // 32 + 20 + 17.6

      // Step 3: Create sprint with calculated working hours
      const sprintData = {
        totalPointsInSprint: 45,
        carryOverPointsTotal: 8,
        carryOverPointsCompleted: 5,
        totalCompletedPoints: 42,
        workingHours,
      };

      const metrics = calculateSprintMetrics(sprintData);

      const sprint: Sprint = {
        id: "sprint-001",
        sprintName: "Sprint 1 - Feature Development",
        taskeiLink: "https://taskei.com/sprint/1",
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
        predictedCapacity: 0, // Will be calculated after we have historical data
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      // Step 4: Validate sprint data
      const validation = validateSprintData(sprint);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Step 5: Save sprint
      await addSprint(sprint);

      // Step 6: Verify sprint was saved correctly
      const savedSprints = await readSprints();
      expect(savedSprints).toHaveLength(1);
      expect(savedSprints[0].id).toBe("sprint-001");
      expect(savedSprints[0].workingHours).toBeCloseTo(69.6, 1);
      expect(savedSprints[0].velocity).toBeCloseTo(0.532, 3); // 37 points / 69.6 hours

      // Step 7: Verify calculations are correct
      expect(savedSprints[0].plannedPoints).toBe(40); // 45 - 5
      expect(savedSprints[0].newWorkPoints).toBe(37); // 45 - 8
      expect(savedSprints[0].pointsCompleted).toBe(37); // 42 - 5
      expect(savedSprints[0].percentComplete).toBe(92.5); // (37/40) * 100
    });

    it("should handle sprint creation with edge cases", async () => {
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

      const config: AppConfig = {
        velocityCalculationSprints: 6,
        defaultMeetingPercentage: 20,
        teamMembers,
      };

      await writeConfig(config);

      const workingHours = calculateWorkingHours(
        teamMembers,
        config.defaultMeetingPercentage
      );
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
        id: "sprint-challenging",
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

      await addSprint(sprint);

      const savedSprints = await readSprints();
      const savedSprint = savedSprints.find(
        (s) => s.id === "sprint-challenging"
      );

      expect(savedSprint).toBeDefined();
      expect(savedSprint!.plannedPoints).toBe(10); // 20 - 10
      expect(savedSprint!.newWorkPoints).toBe(5); // 20 - 15
      expect(savedSprint!.pointsCompleted).toBe(2); // 12 - 10
      expect(savedSprint!.percentComplete).toBe(20); // (2/10) * 100
      expect(savedSprint!.velocity).toBeCloseTo(0.133, 3); // 2/15
    });
  });

  describe("Dashboard Metrics Calculation Accuracy", () => {
    beforeEach(async () => {
      // Create a series of sprints with known data for testing
      const sprints: Sprint[] = [
        {
          id: "sprint-001",
          sprintName: "Sprint 1",
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
          id: "sprint-002",
          sprintName: "Sprint 2",
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
          id: "sprint-003",
          sprintName: "Sprint 3",
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

      // Save all sprints
      for (const sprint of sprints) {
        await addSprint(sprint);
      }
    });

    it("should calculate average velocity correctly", async () => {
      const sprints = await readSprints();

      // Test different averaging periods
      const avg3 = calculateAverageVelocity(sprints, 3);
      expect(avg3).toBeCloseTo(0.23, 3); // (0.208 + 0.233 + 0.25) / 3

      const avg2 = calculateAverageVelocity(sprints, 2);
      expect(avg2).toBeCloseTo(0.242, 3); // (0.233 + 0.25) / 2 (last 2 sprints)

      const avgAll = calculateAverageVelocity(sprints, 10);
      expect(avgAll).toBeCloseTo(0.23, 3); // All 3 sprints
    });

    it("should calculate predicted capacity accurately", async () => {
      const sprints = await readSprints();
      const avgVelocity = calculateAverageVelocity(sprints, 3);

      // Test with different working hours scenarios
      const capacity120 = calculatePredictedCapacity(avgVelocity, 120);
      expect(capacity120).toBeCloseTo(27.6, 1); // 0.230 * 120

      const capacity100 = calculatePredictedCapacity(avgVelocity, 100);
      expect(capacity100).toBeCloseTo(23.0, 1); // 0.230 * 100

      const capacity150 = calculatePredictedCapacity(avgVelocity, 150);
      expect(capacity150).toBeCloseTo(34.5, 1); // 0.230 * 150
    });

    it("should provide accurate forecasting insights", async () => {
      const sprints = await readSprints();
      const insights = getForecastingInsights(sprints, 120, 6);

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

    it("should validate calculations against spreadsheet formulas", async () => {
      const sprints = await readSprints();

      // Manually verify each sprint's calculations match expected spreadsheet formulas
      for (const sprint of sprints) {
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

  describe("Data Persistence Across Application Restarts", () => {
    it("should maintain data integrity across multiple read/write cycles", async () => {
      // Create initial data
      const initialSprint: Sprint = {
        id: "persistence-test",
        sprintName: "Persistence Test Sprint",
        businessDays: 10,
        numberOfPeople: 2,
        workingHours: 80,
        totalPointsInSprint: 25,
        carryOverPointsTotal: 3,
        carryOverPointsCompleted: 2,
        newWorkPoints: 22,
        unplannedPointsBroughtIn: 1,
        pointsCompleted: 20,
        plannedPoints: 23,
        percentComplete: 86.96,
        velocity: 0.25,
        predictedCapacity: 20,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
      };

      // Save initial data
      await addSprint(initialSprint);

      // Simulate application restart by reading data fresh
      let data = await readSprintData();
      expect(data.sprints).toHaveLength(1);
      expect(data.sprints[0].id).toBe("persistence-test");

      // Modify data
      const updatedSprint = {
        ...initialSprint,
        sprintName: "Updated Sprint Name",
      };
      await updateSprint("persistence-test", updatedSprint);

      // Simulate another restart
      data = await readSprintData();
      expect(data.sprints[0].sprintName).toBe("Updated Sprint Name");

      // Add more data
      const secondSprint: Sprint = {
        ...initialSprint,
        id: "persistence-test-2",
        sprintName: "Second Sprint",
      };
      await addSprint(secondSprint);

      // Final restart verification
      data = await readSprintData();
      expect(data.sprints).toHaveLength(2);
      expect(
        data.sprints.find((s) => s.id === "persistence-test")?.sprintName
      ).toBe("Updated Sprint Name");
      expect(
        data.sprints.find((s) => s.id === "persistence-test-2")?.sprintName
      ).toBe("Second Sprint");
    });

    it("should handle configuration changes across restarts", async () => {
      // Initial config
      const initialConfig: AppConfig = {
        velocityCalculationSprints: 6,
        defaultMeetingPercentage: 20,
        teamMembers: [
          {
            name: "Initial Member",
            totalGrossHours: 40,
            onCallHours: 0,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 32,
          },
        ],
      };

      await writeConfig(initialConfig);

      // Simulate restart
      let config = await readConfig();
      expect(config.teamMembers).toHaveLength(1);
      expect(config.teamMembers[0].name).toBe("Initial Member");

      // Update config
      const updatedConfig: AppConfig = {
        ...initialConfig,
        velocityCalculationSprints: 8,
        teamMembers: [
          ...initialConfig.teamMembers,
          {
            name: "New Member",
            totalGrossHours: 40,
            onCallHours: 8,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 24,
          },
        ],
      };

      await writeConfig(updatedConfig);

      // Simulate another restart
      config = await readConfig();
      expect(config.velocityCalculationSprints).toBe(8);
      expect(config.teamMembers).toHaveLength(2);
      expect(config.teamMembers[1].name).toBe("New Member");
    });
  });

  describe("Various Data Scenarios", () => {
    it("should handle empty data state correctly", async () => {
      // Start with empty data
      mockDataStorage = {
        sprints: [],
        config: {
          velocityCalculationSprints: 6,
          defaultMeetingPercentage: 20,
          teamMembers: [],
        },
      };

      const data = await readSprintData();
      expect(data.sprints).toHaveLength(0);
      expect(data.config.teamMembers).toHaveLength(0);

      // Verify calculations handle empty state
      const avgVelocity = calculateAverageVelocity(data.sprints, 6);
      expect(avgVelocity).toBe(0);

      const predictedCapacity = calculatePredictedCapacity(avgVelocity, 120);
      expect(predictedCapacity).toBe(0);

      const insights = getForecastingInsights(data.sprints, 120, 6);
      expect(insights.dataQuality).toBe("insufficient");
      expect(insights.warnings).toContain(
        "No historical sprint data available for forecasting"
      );
    });

    it("should handle large datasets efficiently", async () => {
      // Create 50 sprints with varying data
      const sprints: Sprint[] = [];
      for (let i = 1; i <= 50; i++) {
        const sprint: Sprint = {
          id: `sprint-${i.toString().padStart(3, "0")}`,
          sprintName: `Sprint ${i}`,
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

      // Save all sprints (this tests write performance)
      for (const sprint of sprints) {
        await addSprint(sprint);
      }

      // Verify all sprints were saved
      const savedSprints = await readSprints();
      expect(savedSprints).toHaveLength(50);

      // Test calculations with large dataset
      const avgVelocity = calculateAverageVelocity(savedSprints, 10);
      expect(avgVelocity).toBeGreaterThan(0);

      const insights = getForecastingInsights(savedSprints, 120, 10);
      expect(insights.dataQuality).toBe("excellent");
      expect(insights.sprintsUsed).toBe(10);

      // Test filtering and searching (simulate dashboard operations)
      const recentSprints = savedSprints.slice(-10);
      expect(recentSprints).toHaveLength(10);
      expect(recentSprints[0].id).toBe("sprint-041");
      expect(recentSprints[9].id).toBe("sprint-050");
    });

    it("should handle data with extreme values", async () => {
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

      for (const sprint of extremeSprints) {
        await addSprint(sprint);
      }

      const savedSprints = await readSprints();
      expect(savedSprints).toHaveLength(2);

      // Verify calculations handle extreme values
      const avgVelocity = calculateAverageVelocity(savedSprints, 2);
      expect(avgVelocity).toBeCloseTo(0.141, 3); // (0 + 0.28125) / 2

      const insights = getForecastingInsights(savedSprints, 120, 2);
      expect(insights.dataQuality).toBe("limited");
      expect(insights.warnings).toContain(
        "1 sprint(s) with zero velocity detected"
      );
    });
  });
});
