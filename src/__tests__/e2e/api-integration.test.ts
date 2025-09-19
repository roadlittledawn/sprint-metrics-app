/**
 * End-to-end API integration tests
 * Tests API routes with real data flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as sprintsGET,
  POST as sprintsPOST,
  PUT as sprintsPUT,
  DELETE as sprintsDELETE,
} from "@/app/api/sprints/route";
import { GET as metricsGET } from "@/app/api/metrics/route";
import { GET as configGET, PUT as configPUT } from "@/app/api/config/route";
import { promises as fs } from "fs";
import { Sprint, AppConfig, TeamMember } from "@/lib/types";

// Mock fs module
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

describe("API Integration Tests", () => {
  let mockDataStorage: any;

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
            name: "Test Developer",
            totalGrossHours: 40,
            onCallHours: 0,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 32,
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

  describe("Sprints API Workflow", () => {
    it("should handle complete CRUD workflow for sprints", async () => {
      // Step 1: GET empty sprints list
      const getEmptyRequest = new NextRequest(
        "http://localhost:3000/api/sprints"
      );
      const getEmptyResponse = await sprintsGET(getEmptyRequest);
      const emptyData = await getEmptyResponse.json();

      expect(getEmptyResponse.status).toBe(200);
      expect(emptyData.sprints).toHaveLength(0);

      // Step 2: POST new sprint
      const newSprint: Sprint = {
        id: "api-test-sprint",
        sprintName: "API Test Sprint",
        taskeiLink: "https://taskei.com/sprint/api-test",
        businessDays: 10,
        numberOfPeople: 2,
        workingHours: 64, // 2 * 32 hours
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        newWorkPoints: 25,
        unplannedPointsBroughtIn: 2,
        pointsCompleted: 25,
        plannedPoints: 27,
        percentComplete: 92.59,
        velocity: 0.391, // 25/64
        predictedCapacity: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const postRequest = new NextRequest("http://localhost:3000/api/sprints", {
        method: "POST",
        body: JSON.stringify(newSprint),
        headers: { "Content-Type": "application/json" },
      });

      const postResponse = await sprintsPOST(postRequest);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(201);
      expect(postData.message).toBe("Sprint created successfully");
      expect(postData.sprint.id).toBe("api-test-sprint");

      // Step 3: GET sprint list with new sprint
      const getRequest = new NextRequest("http://localhost:3000/api/sprints");
      const getResponse = await sprintsGET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.sprints).toHaveLength(1);
      expect(getData.sprints[0].id).toBe("api-test-sprint");

      // Step 4: PUT update sprint
      const updatedSprint = {
        ...newSprint,
        sprintName: "Updated API Test Sprint",
        pointsCompleted: 27,
        percentComplete: 100,
        velocity: 0.422, // 27/64
        updatedAt: new Date().toISOString(),
      };

      const putRequest = new NextRequest("http://localhost:3000/api/sprints", {
        method: "PUT",
        body: JSON.stringify({ id: "api-test-sprint", sprint: updatedSprint }),
        headers: { "Content-Type": "application/json" },
      });

      const putResponse = await sprintsPUT(putRequest);
      const putData = await putResponse.json();

      expect(putResponse.status).toBe(200);
      expect(putData.message).toBe("Sprint updated successfully");
      expect(putData.sprint.sprintName).toBe("Updated API Test Sprint");

      // Step 5: Verify update
      const getUpdatedRequest = new NextRequest(
        "http://localhost:3000/api/sprints"
      );
      const getUpdatedResponse = await sprintsGET(getUpdatedRequest);
      const getUpdatedData = await getUpdatedResponse.json();

      expect(getUpdatedData.sprints[0].sprintName).toBe(
        "Updated API Test Sprint"
      );
      expect(getUpdatedData.sprints[0].pointsCompleted).toBe(27);

      // Step 6: DELETE sprint
      const deleteRequest = new NextRequest(
        "http://localhost:3000/api/sprints",
        {
          method: "DELETE",
          body: JSON.stringify({ id: "api-test-sprint" }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const deleteResponse = await sprintsDELETE(deleteRequest);
      const deleteData = await deleteResponse.json();

      expect(deleteResponse.status).toBe(200);
      expect(deleteData.message).toBe("Sprint deleted successfully");

      // Step 7: Verify deletion
      const getFinalRequest = new NextRequest(
        "http://localhost:3000/api/sprints"
      );
      const getFinalResponse = await sprintsGET(getFinalRequest);
      const getFinalData = await getFinalResponse.json();

      expect(getFinalData.sprints).toHaveLength(0);
    });

    it("should handle validation errors in sprint API", async () => {
      // Test invalid sprint data
      const invalidSprint = {
        id: "", // Invalid empty ID
        sprintName: "",
        businessDays: -1, // Invalid negative
        numberOfPeople: 0,
        workingHours: -10, // Invalid negative
        totalPointsInSprint: "invalid", // Invalid type
      };

      const postRequest = new NextRequest("http://localhost:3000/api/sprints", {
        method: "POST",
        body: JSON.stringify(invalidSprint),
        headers: { "Content-Type": "application/json" },
      });

      const postResponse = await sprintsPOST(postRequest);
      const postData = await postResponse.json();

      expect(postResponse.status).toBe(400);
      expect(postData.error).toContain("validation");
    });

    it("should handle duplicate sprint ID errors", async () => {
      // Add first sprint
      const sprint1: Sprint = {
        id: "duplicate-test",
        sprintName: "First Sprint",
        businessDays: 10,
        numberOfPeople: 2,
        workingHours: 64,
        totalPointsInSprint: 30,
        carryOverPointsTotal: 0,
        carryOverPointsCompleted: 0,
        newWorkPoints: 30,
        unplannedPointsBroughtIn: 0,
        pointsCompleted: 25,
        plannedPoints: 30,
        percentComplete: 83.33,
        velocity: 0.391,
        predictedCapacity: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const postRequest1 = new NextRequest(
        "http://localhost:3000/api/sprints",
        {
          method: "POST",
          body: JSON.stringify(sprint1),
          headers: { "Content-Type": "application/json" },
        }
      );

      const postResponse1 = await sprintsPOST(postRequest1);
      expect(postResponse1.status).toBe(201);

      // Try to add duplicate
      const sprint2 = { ...sprint1, sprintName: "Duplicate Sprint" };
      const postRequest2 = new NextRequest(
        "http://localhost:3000/api/sprints",
        {
          method: "POST",
          body: JSON.stringify(sprint2),
          headers: { "Content-Type": "application/json" },
        }
      );

      const postResponse2 = await sprintsPOST(postRequest2);
      const postData2 = await postResponse2.json();

      expect(postResponse2.status).toBe(400);
      expect(postData2.error).toContain("already exists");
    });
  });

  describe("Metrics API Integration", () => {
    beforeEach(async () => {
      // Add test sprints for metrics calculation
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
          velocity: 0.208,
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
          velocity: 0.233,
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
          velocity: 0.25,
          predictedCapacity: 0,
          createdAt: "2024-02-01T00:00:00.000Z",
          updatedAt: "2024-02-01T00:00:00.000Z",
        },
      ];

      mockDataStorage.sprints = testSprints;
    });

    it("should calculate and return accurate dashboard metrics", async () => {
      const metricsRequest = new NextRequest(
        "http://localhost:3000/api/metrics"
      );
      const metricsResponse = await metricsGET(metricsRequest);
      const metricsData = await metricsResponse.json();

      expect(metricsResponse.status).toBe(200);
      expect(metricsData.metrics).toBeDefined();

      // Verify key metrics
      expect(metricsData.metrics.totalSprints).toBe(3);
      expect(metricsData.metrics.averageVelocity).toBeCloseTo(0.23, 3); // (0.208 + 0.233 + 0.25) / 3
      expect(metricsData.metrics.averageCompletionRate).toBeCloseTo(90.28, 2); // (83.33 + 87.5 + 100) / 3

      // Verify current sprint (most recent)
      expect(metricsData.metrics.currentSprint).toBeDefined();
      expect(metricsData.metrics.currentSprint.id).toBe("metrics-sprint-3");
      expect(metricsData.metrics.currentSprint.percentComplete).toBe(100);

      // Verify forecasting
      expect(metricsData.metrics.predictedCapacity).toBeCloseTo(27.6, 1); // 0.230 * 120
      expect(metricsData.metrics.forecastingInsights).toBeDefined();
      expect(metricsData.metrics.forecastingInsights.dataQuality).toBe("good");
    });

    it("should handle metrics calculation with different parameters", async () => {
      const metricsRequest = new NextRequest(
        "http://localhost:3000/api/metrics?sprints=2&workingHours=100"
      );
      const metricsResponse = await metricsGET(metricsRequest);
      const metricsData = await metricsResponse.json();

      expect(metricsResponse.status).toBe(200);

      // Should use last 2 sprints for average
      expect(metricsData.metrics.averageVelocity).toBeCloseTo(0.242, 3); // (0.233 + 0.25) / 2

      // Should use 100 working hours for prediction
      expect(metricsData.metrics.predictedCapacity).toBeCloseTo(24.2, 1); // 0.242 * 100
    });

    it("should handle empty metrics gracefully", async () => {
      // Clear sprints
      mockDataStorage.sprints = [];

      const metricsRequest = new NextRequest(
        "http://localhost:3000/api/metrics"
      );
      const metricsResponse = await metricsGET(metricsRequest);
      const metricsData = await metricsResponse.json();

      expect(metricsResponse.status).toBe(200);
      expect(metricsData.metrics.totalSprints).toBe(0);
      expect(metricsData.metrics.averageVelocity).toBe(0);
      expect(metricsData.metrics.predictedCapacity).toBe(0);
      expect(metricsData.metrics.currentSprint).toBeNull();
      expect(metricsData.metrics.forecastingInsights.dataQuality).toBe(
        "insufficient"
      );
    });
  });

  describe("Config API Integration", () => {
    it("should handle complete config workflow", async () => {
      // Step 1: GET initial config
      const getRequest = new NextRequest("http://localhost:3000/api/config");
      const getResponse = await configGET(getRequest);
      const getData = await getResponse.json();

      expect(getResponse.status).toBe(200);
      expect(getData.config).toBeDefined();
      expect(getData.config.velocityCalculationSprints).toBe(6);
      expect(getData.config.teamMembers).toHaveLength(1);

      // Step 2: PUT update config
      const updatedConfig: AppConfig = {
        velocityCalculationSprints: 8,
        defaultMeetingPercentage: 25,
        teamMembers: [
          {
            name: "Updated Developer",
            totalGrossHours: 40,
            onCallHours: 4,
            meetingHours: 10,
            timeOffHours: 2,
            netHours: 24,
          },
          {
            name: "New Developer",
            totalGrossHours: 32,
            onCallHours: 0,
            meetingHours: 6.4,
            timeOffHours: 0,
            netHours: 25.6,
          },
        ],
      };

      const putRequest = new NextRequest("http://localhost:3000/api/config", {
        method: "PUT",
        body: JSON.stringify(updatedConfig),
        headers: { "Content-Type": "application/json" },
      });

      const putResponse = await configPUT(putRequest);
      const putData = await putResponse.json();

      expect(putResponse.status).toBe(200);
      expect(putData.message).toBe("Configuration updated successfully");
      expect(putData.config.velocityCalculationSprints).toBe(8);
      expect(putData.config.teamMembers).toHaveLength(2);

      // Step 3: Verify update
      const getUpdatedRequest = new NextRequest(
        "http://localhost:3000/api/config"
      );
      const getUpdatedResponse = await configGET(getUpdatedRequest);
      const getUpdatedData = await getUpdatedResponse.json();

      expect(getUpdatedData.config.velocityCalculationSprints).toBe(8);
      expect(getUpdatedData.config.defaultMeetingPercentage).toBe(25);
      expect(getUpdatedData.config.teamMembers).toHaveLength(2);
      expect(getUpdatedData.config.teamMembers[1].name).toBe("New Developer");
    });

    it("should validate config data", async () => {
      const invalidConfig = {
        velocityCalculationSprints: -1, // Invalid negative
        defaultMeetingPercentage: 150, // Invalid > 100
        teamMembers: [
          {
            name: "", // Invalid empty name
            totalGrossHours: -10, // Invalid negative
            onCallHours: 50, // More than gross hours
            meetingHours: -5, // Invalid negative
            timeOffHours: 0,
            netHours: 0,
          },
        ],
      };

      const putRequest = new NextRequest("http://localhost:3000/api/config", {
        method: "PUT",
        body: JSON.stringify(invalidConfig),
        headers: { "Content-Type": "application/json" },
      });

      const putResponse = await configPUT(putRequest);
      const putData = await putResponse.json();

      expect(putResponse.status).toBe(400);
      expect(putData.error).toContain("validation");
    });
  });

  describe("Cross-API Integration", () => {
    it("should maintain data consistency across API operations", async () => {
      // Step 1: Update config with team
      const config: AppConfig = {
        velocityCalculationSprints: 6,
        defaultMeetingPercentage: 20,
        teamMembers: [
          {
            name: "Alice",
            totalGrossHours: 40,
            onCallHours: 0,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 32,
          },
          {
            name: "Bob",
            totalGrossHours: 40,
            onCallHours: 8,
            meetingHours: 8,
            timeOffHours: 4,
            netHours: 20,
          },
        ],
      };

      const configRequest = new NextRequest(
        "http://localhost:3000/api/config",
        {
          method: "PUT",
          body: JSON.stringify(config),
          headers: { "Content-Type": "application/json" },
        }
      );

      await configPUT(configRequest);

      // Step 2: Add sprint using team-calculated working hours
      const sprint: Sprint = {
        id: "integration-sprint",
        sprintName: "Integration Sprint",
        businessDays: 10,
        numberOfPeople: 2,
        workingHours: 52, // 32 + 20 from team calculation
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        newWorkPoints: 25,
        unplannedPointsBroughtIn: 2,
        pointsCompleted: 25,
        plannedPoints: 27,
        percentComplete: 92.59,
        velocity: 0.481, // 25/52
        predictedCapacity: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sprintRequest = new NextRequest(
        "http://localhost:3000/api/sprints",
        {
          method: "POST",
          body: JSON.stringify(sprint),
          headers: { "Content-Type": "application/json" },
        }
      );

      await sprintsPOST(sprintRequest);

      // Step 3: Get metrics and verify consistency
      const metricsRequest = new NextRequest(
        "http://localhost:3000/api/metrics"
      );
      const metricsResponse = await metricsGET(metricsRequest);
      const metricsData = await metricsResponse.json();

      expect(metricsData.metrics.currentSprint.workingHours).toBe(52);
      expect(metricsData.metrics.currentSprint.velocity).toBeCloseTo(0.481, 3);
      expect(metricsData.metrics.currentSprint.numberOfPeople).toBe(2);

      // Step 4: Update team and verify metrics would change for new sprints
      const updatedConfig = {
        ...config,
        teamMembers: [
          ...config.teamMembers,
          {
            name: "Charlie",
            totalGrossHours: 40,
            onCallHours: 0,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 32,
          },
        ],
      };

      const updateConfigRequest = new NextRequest(
        "http://localhost:3000/api/config",
        {
          method: "PUT",
          body: JSON.stringify(updatedConfig),
          headers: { "Content-Type": "application/json" },
        }
      );

      await configPUT(updateConfigRequest);

      // Verify config was updated
      const getConfigRequest = new NextRequest(
        "http://localhost:3000/api/config"
      );
      const getConfigResponse = await configGET(getConfigRequest);
      const getConfigData = await getConfigResponse.json();

      expect(getConfigData.config.teamMembers).toHaveLength(3);

      // The existing sprint should remain unchanged
      const finalMetricsRequest = new NextRequest(
        "http://localhost:3000/api/metrics"
      );
      const finalMetricsResponse = await metricsGET(finalMetricsRequest);
      const finalMetricsData = await finalMetricsResponse.json();

      expect(finalMetricsData.metrics.currentSprint.workingHours).toBe(52); // Unchanged
      expect(finalMetricsData.metrics.currentSprint.numberOfPeople).toBe(2); // Unchanged
    });
  });
});
