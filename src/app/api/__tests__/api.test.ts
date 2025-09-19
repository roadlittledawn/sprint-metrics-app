/**
 * Integration tests for API routes
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  GET as getSprintsHandler,
  POST as postSprintsHandler,
  PUT as putSprintsHandler,
  DELETE as deleteSprintsHandler,
} from "../sprints/route";
import {
  GET as getMetricsHandler,
  POST as postMetricsHandler,
} from "../metrics/route";
import {
  GET as getConfigHandler,
  PUT as putConfigHandler,
  POST as postConfigHandler,
} from "../config/route";

// Mock the data manager
vi.mock("@/lib/dataManager", () => ({
  readSprints: vi.fn(),
  addSprint: vi.fn(),
  updateSprint: vi.fn(),
  deleteSprint: vi.fn(),
  getSprint: vi.fn(),
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}));

// Mock the calculations
vi.mock("@/lib/calculations", () => ({
  calculateSprintMetrics: vi.fn(),
  calculateAverageVelocity: vi.fn(),
  calculatePredictedCapacity: vi.fn(),
  getForecastingInsights: vi.fn(),
  calculateVelocityTrend: vi.fn(),
  calculateWorkingHours: vi.fn(),
  calculateTeamMemberNetHours: vi.fn(),
  validateTeamMemberHours: vi.fn(),
}));

import * as dataManager from "@/lib/dataManager";
import * as calculations from "@/lib/calculations";

const mockDataManager = dataManager as any;
const mockCalculations = calculations as any;

// Test data
const mockSprint = {
  id: "test-sprint-1",
  sprintName: "Test Sprint 1",
  taskeiLink: "https://taskei.com/sprint/1",
  businessDays: 10,
  numberOfPeople: 5,
  workingHours: 200,
  totalPointsInSprint: 50,
  carryOverPointsTotal: 10,
  carryOverPointsCompleted: 5,
  newWorkPoints: 40,
  unplannedPointsBroughtIn: 3,
  pointsCompleted: 45,
  plannedPoints: 45,
  percentComplete: 100,
  velocity: 0.225,
  predictedCapacity: 45,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockConfig = {
  velocityCalculationSprints: 6,
  teamMembers: [
    {
      name: "Test User",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 8,
      timeOffHours: 0,
      netHours: 32,
    },
  ],
  defaultMeetingPercentage: 20,
};

const mockSprintFormData = {
  sprintName: "New Sprint",
  businessDays: 10,
  numberOfPeople: 5,
  totalPointsInSprint: 50,
  carryOverPointsTotal: 10,
  carryOverPointsCompleted: 5,
  unplannedPointsBroughtIn: 3,
  pointsCompleted: 40,
};

describe("API Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("/api/sprints", () => {
    describe("GET", () => {
      it("should return all sprints", async () => {
        mockDataManager.readSprints.mockResolvedValue([mockSprint]);

        const request = new NextRequest("http://localhost:3000/api/sprints");
        const response = await getSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual([mockSprint]);
      });

      it("should handle errors when fetching sprints", async () => {
        mockDataManager.readSprints.mockRejectedValue(
          new Error("Database error")
        );

        const request = new NextRequest("http://localhost:3000/api/sprints");
        const response = await getSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe("Failed to fetch sprints");
      });
    });

    describe("POST", () => {
      it("should create a new sprint", async () => {
        mockCalculations.calculateSprintMetrics.mockReturnValue({
          plannedPoints: 45,
          newWorkPoints: 40,
          pointsCompleted: 40,
          percentComplete: 88.89,
          velocity: 0.2,
        });
        mockDataManager.addSprint.mockResolvedValue(undefined);

        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "POST",
          body: JSON.stringify(mockSprintFormData),
        });
        const response = await postSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(data.data.sprintName).toBe("New Sprint");
        expect(mockDataManager.addSprint).toHaveBeenCalled();
      });

      it("should validate required fields", async () => {
        const invalidData = { sprintName: "Test" }; // Missing required fields

        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "POST",
          body: JSON.stringify(invalidData),
        });
        const response = await postSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Missing required field");
      });

      it("should validate numeric fields", async () => {
        const invalidData = {
          ...mockSprintFormData,
          businessDays: -1, // Invalid negative value
        };

        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "POST",
          body: JSON.stringify(invalidData),
        });
        const response = await postSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Invalid value for businessDays");
      });
    });

    describe("PUT", () => {
      it("should update an existing sprint", async () => {
        mockDataManager.getSprint.mockResolvedValue(mockSprint);
        mockCalculations.calculateSprintMetrics.mockReturnValue({
          plannedPoints: 45,
          newWorkPoints: 40,
          pointsCompleted: 40,
          percentComplete: 88.89,
          velocity: 0.2,
        });
        mockDataManager.updateSprint.mockResolvedValue(undefined);

        const updateData = { ...mockSprintFormData, id: "test-sprint-1" };
        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "PUT",
          body: JSON.stringify(updateData),
        });
        const response = await putSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockDataManager.updateSprint).toHaveBeenCalled();
      });

      it("should return 404 for non-existent sprint", async () => {
        mockDataManager.getSprint.mockResolvedValue(null);

        const updateData = { ...mockSprintFormData, id: "non-existent" };
        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "PUT",
          body: JSON.stringify(updateData),
        });
        const response = await putSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(404);
        expect(data.success).toBe(false);
        expect(data.error).toContain("not found");
      });
    });

    describe("DELETE", () => {
      it("should delete a sprint", async () => {
        mockDataManager.deleteSprint.mockResolvedValue(undefined);

        const request = new NextRequest(
          "http://localhost:3000/api/sprints?id=test-sprint-1",
          {
            method: "DELETE",
          }
        );
        const response = await deleteSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockDataManager.deleteSprint).toHaveBeenCalledWith(
          "test-sprint-1"
        );
      });

      it("should require sprint ID for deletion", async () => {
        const request = new NextRequest("http://localhost:3000/api/sprints", {
          method: "DELETE",
        });
        const response = await deleteSprintsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Sprint ID is required");
      });
    });
  });

  describe("/api/metrics", () => {
    describe("GET", () => {
      it("should return calculated metrics", async () => {
        mockDataManager.readSprints.mockResolvedValue([mockSprint]);
        mockDataManager.readConfig.mockResolvedValue(mockConfig);
        mockCalculations.calculateAverageVelocity.mockReturnValue(0.225);
        mockCalculations.calculateWorkingHours.mockReturnValue(160);
        mockCalculations.calculatePredictedCapacity.mockReturnValue(36);

        const request = new NextRequest("http://localhost:3000/api/metrics");
        const response = await getMetricsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.currentSprintStatus).toBeDefined();
        expect(data.data.averageVelocity).toBe(0.225);
        expect(data.data.forecastedCapacity).toBe(36);
      });

      it("should handle empty sprint data", async () => {
        mockDataManager.readSprints.mockResolvedValue([]);
        mockDataManager.readConfig.mockResolvedValue(mockConfig);

        const request = new NextRequest("http://localhost:3000/api/metrics");
        const response = await getMetricsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.currentSprintStatus.sprintName).toBe(
          "No sprints available"
        );
        expect(data.data.averageVelocity).toBe(0);
      });
    });

    describe("POST (forecasting)", () => {
      it("should return forecasting insights", async () => {
        mockDataManager.readSprints.mockResolvedValue([mockSprint]);
        mockDataManager.readConfig.mockResolvedValue(mockConfig);
        mockCalculations.getForecastingInsights.mockReturnValue({
          dataQuality: "good",
          sprintsUsed: 1,
          averageVelocity: 0.225,
          predictedCapacity: 36,
          warnings: [],
          recommendations: [],
        });

        const request = new NextRequest("http://localhost:3000/api/metrics", {
          method: "POST",
          body: JSON.stringify({ upcomingWorkingHours: 160, sprintCount: 6 }),
        });
        const response = await postMetricsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.dataQuality).toBe("good");
      });

      it("should validate upcomingWorkingHours", async () => {
        const request = new NextRequest("http://localhost:3000/api/metrics", {
          method: "POST",
          body: JSON.stringify({ upcomingWorkingHours: -10 }),
        });
        const response = await postMetricsHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("Valid upcomingWorkingHours is required");
      });
    });
  });

  describe("/api/config", () => {
    describe("GET", () => {
      it("should return configuration", async () => {
        mockDataManager.readConfig.mockResolvedValue(mockConfig);

        const request = new NextRequest("http://localhost:3000/api/config");
        const response = await getConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockConfig);
      });
    });

    describe("PUT", () => {
      it("should update configuration", async () => {
        mockDataManager.readConfig.mockResolvedValue(mockConfig);
        mockDataManager.writeConfig.mockResolvedValue(undefined);

        const updateData = { velocityCalculationSprints: 8 };
        const request = new NextRequest("http://localhost:3000/api/config", {
          method: "PUT",
          body: JSON.stringify(updateData),
        });
        const response = await putConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.data.velocityCalculationSprints).toBe(8);
        expect(mockDataManager.writeConfig).toHaveBeenCalled();
      });

      it("should validate velocityCalculationSprints", async () => {
        const updateData = { velocityCalculationSprints: -1 };
        const request = new NextRequest("http://localhost:3000/api/config", {
          method: "PUT",
          body: JSON.stringify(updateData),
        });
        const response = await putConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain(
          "velocityCalculationSprints must be a number between 1 and 20"
        );
      });

      it("should validate defaultMeetingPercentage", async () => {
        const updateData = { defaultMeetingPercentage: 150 };
        const request = new NextRequest("http://localhost:3000/api/config", {
          method: "PUT",
          body: JSON.stringify(updateData),
        });
        const response = await putConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain(
          "defaultMeetingPercentage must be a number between 0 and 100"
        );
      });
    });

    describe("POST (team members)", () => {
      it("should update team members", async () => {
        mockDataManager.readConfig.mockResolvedValue(mockConfig);
        mockDataManager.writeConfig.mockResolvedValue(undefined);
        mockCalculations.calculateTeamMemberNetHours.mockReturnValue({
          name: "New Member",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        });
        mockCalculations.validateTeamMemberHours.mockReturnValue({
          isValid: true,
          errors: [],
        });

        const teamMemberData = {
          teamMembers: [
            {
              name: "New Member",
              totalGrossHours: 40,
              onCallHours: 0,
              meetingHours: 8,
              timeOffHours: 0,
              netHours: 0,
            },
          ],
        };

        const request = new NextRequest("http://localhost:3000/api/config", {
          method: "POST",
          body: JSON.stringify(teamMemberData),
        });
        const response = await postConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data.success).toBe(true);
        expect(mockDataManager.writeConfig).toHaveBeenCalled();
      });

      it("should validate team member data", async () => {
        const invalidTeamMemberData = {
          teamMembers: [
            {
              // Missing name
              totalGrossHours: 40,
              onCallHours: 0,
              meetingHours: 8,
              timeOffHours: 0,
              netHours: 0,
            },
          ],
        };

        const request = new NextRequest("http://localhost:3000/api/config", {
          method: "POST",
          body: JSON.stringify(invalidTeamMemberData),
        });
        const response = await postConfigHandler(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toContain("must have a valid name");
      });
    });
  });
});
