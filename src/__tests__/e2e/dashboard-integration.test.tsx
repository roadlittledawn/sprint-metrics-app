/**
 * End-to-end dashboard integration tests
 * Tests complete dashboard functionality with real data flows
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { promises as fs } from "fs";
import React from "react";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

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

// Mock fetch for API calls
global.fetch = vi.fn();

// Import components after mocks
import DashboardMetrics from "@/components/DashboardMetrics";
import SprintForm from "@/components/SprintForm";
import TeamManagement from "@/components/TeamManagement";
import { Sprint, AppConfig, TeamMember } from "@/lib/types";

describe("Dashboard Integration Tests", () => {
  let mockDataStorage: any;
  const mockFetch = global.fetch as any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Initialize mock data storage
    mockDataStorage = {
      sprints: [
        {
          id: "dashboard-sprint-1",
          sprintName: "Dashboard Sprint 1",
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
          id: "dashboard-sprint-2",
          sprintName: "Dashboard Sprint 2",
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
          id: "dashboard-sprint-3",
          sprintName: "Dashboard Sprint 3",
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
      ],
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
          {
            name: "Charlie Developer",
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

    // Mock fetch responses
    mockFetch.mockImplementation((url: string, options?: any) => {
      if (url.includes("/api/metrics")) {
        const metrics = {
          totalSprints: mockDataStorage.sprints.length,
          averageVelocity: 0.23, // (0.208 + 0.233 + 0.25) / 3
          averageCompletionRate: 90.28, // (83.33 + 87.5 + 100) / 3
          currentSprint:
            mockDataStorage.sprints[mockDataStorage.sprints.length - 1],
          predictedCapacity: 27.6, // 0.230 * 120
          forecastingInsights: {
            dataQuality: "good",
            sprintsUsed: 3,
            averageVelocity: 0.23,
            predictedCapacity: 27.6,
            warnings: [
              "Using 3 sprints instead of requested 6 for forecasting",
            ],
            recommendations: [
              "Complete more sprints to improve forecast accuracy",
            ],
          },
        };
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ metrics }),
        });
      }

      if (url.includes("/api/sprints")) {
        if (options?.method === "POST") {
          const newSprint = JSON.parse(options.body);
          mockDataStorage.sprints.push(newSprint);
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () =>
              Promise.resolve({
                message: "Sprint created successfully",
                sprint: newSprint,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sprints: mockDataStorage.sprints }),
        });
      }

      if (url.includes("/api/config")) {
        if (options?.method === "PUT") {
          const newConfig = JSON.parse(options.body);
          mockDataStorage.config = newConfig;
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                message: "Configuration updated successfully",
                config: newConfig,
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ config: mockDataStorage.config }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      });
    });

    // Mock console methods
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Dashboard Metrics Display", () => {
    it("should display accurate metrics from API data", async () => {
      render(<DashboardMetrics />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText("Dashboard Metrics")).toBeInTheDocument();
      });

      // Verify key metrics are displayed
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument(); // Total sprints
      });

      // Check for average velocity (should be around 0.230)
      await waitFor(() => {
        expect(screen.getByText(/0\.23/)).toBeInTheDocument();
      });

      // Check for completion rate (should be around 90.28%)
      await waitFor(() => {
        expect(screen.getByText(/90/)).toBeInTheDocument();
      });

      // Check for predicted capacity (should be around 27.6)
      await waitFor(() => {
        expect(screen.getByText(/27/)).toBeInTheDocument();
      });
    });

    it("should handle loading states correctly", async () => {
      // Mock slow API response
      mockFetch.mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ metrics: {} }),
                }),
              100
            )
          )
      );

      render(<DashboardMetrics />);

      // Should show loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        },
        { timeout: 200 }
      );
    });

    it("should handle error states gracefully", async () => {
      // Mock API error
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: "Internal server error" }),
        })
      );

      render(<DashboardMetrics />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it("should update metrics when new sprint is added", async () => {
      const user = userEvent.setup();

      // Render dashboard and sprint form together
      const IntegratedView = () => (
        <div>
          <DashboardMetrics />
          <SprintForm />
        </div>
      );

      render(<IntegratedView />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument(); // Initial sprint count
      });

      // Fill out sprint form
      const sprintNameInput = screen.getByLabelText(/sprint name/i);
      await user.type(sprintNameInput, "New Dashboard Sprint");

      const totalPointsInput = screen.getByLabelText(/total points/i);
      await user.clear(totalPointsInput);
      await user.type(totalPointsInput, "40");

      const workingHoursInput = screen.getByLabelText(/working hours/i);
      await user.clear(workingHoursInput);
      await user.type(workingHoursInput, "120");

      const pointsCompletedInput = screen.getByLabelText(/points completed/i);
      await user.clear(pointsCompletedInput);
      await user.type(pointsCompletedInput, "35");

      // Submit form
      const submitButton = screen.getByRole("button", { name: /save sprint/i });
      await user.click(submitButton);

      // Wait for form submission and dashboard update
      await waitFor(() => {
        expect(screen.getByText("4")).toBeInTheDocument(); // Updated sprint count
      });
    });
  });

  describe("Team Management Integration", () => {
    it("should update working hours calculation when team changes", async () => {
      const user = userEvent.setup();

      const IntegratedView = () => (
        <div>
          <TeamManagement />
          <SprintForm />
        </div>
      );

      render(<IntegratedView />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Team Management")).toBeInTheDocument();
      });

      // Initial working hours should be calculated from 3 team members (32 + 20 + 32 = 84)
      await waitFor(() => {
        expect(screen.getByDisplayValue("84")).toBeInTheDocument();
      });

      // Add a new team member
      const addMemberButton = screen.getByRole("button", {
        name: /add team member/i,
      });
      await user.click(addMemberButton);

      // Fill out new member form
      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "David Developer");

      const grossHoursInput = screen.getByLabelText(/total gross hours/i);
      await user.type(grossHoursInput, "40");

      const meetingHoursInput = screen.getByLabelText(/meeting hours/i);
      await user.type(meetingHoursInput, "8");

      // Save new member
      const saveMemberButton = screen.getByRole("button", {
        name: /save member/i,
      });
      await user.click(saveMemberButton);

      // Working hours should update to include new member (84 + 32 = 116)
      await waitFor(() => {
        expect(screen.getByDisplayValue("116")).toBeInTheDocument();
      });
    });

    it("should maintain team data consistency across components", async () => {
      const user = userEvent.setup();

      render(<TeamManagement />);

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText("Alice Developer")).toBeInTheDocument();
        expect(screen.getByText("Bob Developer")).toBeInTheDocument();
        expect(screen.getByText("Charlie Developer")).toBeInTheDocument();
      });

      // Remove a team member
      const removeButtons = screen.getAllByRole("button", { name: /remove/i });
      await user.click(removeButtons[1]); // Remove Bob

      // Confirm removal
      const confirmButton = screen.getByRole("button", { name: /confirm/i });
      await user.click(confirmButton);

      // Verify member was removed
      await waitFor(() => {
        expect(screen.queryByText("Bob Developer")).not.toBeInTheDocument();
        expect(screen.getByText("Alice Developer")).toBeInTheDocument();
        expect(screen.getByText("Charlie Developer")).toBeInTheDocument();
      });

      // Verify API was called to update config
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/config",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("Alice Developer"),
        })
      );
    });
  });

  describe("Complete Workflow Integration", () => {
    it("should handle complete sprint creation workflow with team integration", async () => {
      const user = userEvent.setup();

      const FullWorkflowView = () => (
        <div>
          <TeamManagement />
          <SprintForm />
          <DashboardMetrics />
        </div>
      );

      render(<FullWorkflowView />);

      // Step 1: Verify initial state
      await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument(); // Initial sprint count
        expect(screen.getByDisplayValue("84")).toBeInTheDocument(); // Initial working hours
      });

      // Step 2: Modify team (add member)
      const addMemberButton = screen.getByRole("button", {
        name: /add team member/i,
      });
      await user.click(addMemberButton);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, "Eve Developer");

      const grossHoursInput = screen.getByLabelText(/total gross hours/i);
      await user.type(grossHoursInput, "32");

      const meetingHoursInput = screen.getByLabelText(/meeting hours/i);
      await user.type(meetingHoursInput, "6.4");

      const saveMemberButton = screen.getByRole("button", {
        name: /save member/i,
      });
      await user.click(saveMemberButton);

      // Step 3: Verify working hours updated
      await waitFor(() => {
        expect(screen.getByDisplayValue("109.6")).toBeInTheDocument(); // 84 + 25.6
      });

      // Step 4: Create new sprint with updated team
      const sprintNameInput = screen.getByLabelText(/sprint name/i);
      await user.type(sprintNameInput, "Workflow Test Sprint");

      const totalPointsInput = screen.getByLabelText(/total points/i);
      await user.clear(totalPointsInput);
      await user.type(totalPointsInput, "45");

      const pointsCompletedInput = screen.getByLabelText(/points completed/i);
      await user.clear(pointsCompletedInput);
      await user.type(pointsCompletedInput, "40");

      // Working hours should auto-populate from team calculation
      const workingHoursInput = screen.getByLabelText(/working hours/i);
      expect(workingHoursInput).toHaveValue(109.6);

      // Submit sprint
      const submitButton = screen.getByRole("button", { name: /save sprint/i });
      await user.click(submitButton);

      // Step 5: Verify dashboard updated
      await waitFor(() => {
        expect(screen.getByText("4")).toBeInTheDocument(); // Updated sprint count
      });

      // Step 6: Verify calculations are correct
      // New sprint should have velocity of 40/109.6 ≈ 0.365
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/sprints",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining("0.365"),
          })
        );
      });
    });

    it("should maintain calculation accuracy throughout workflow", async () => {
      const user = userEvent.setup();

      render(<SprintForm />);

      // Create sprint with specific values for calculation verification
      await waitFor(() => {
        expect(screen.getByLabelText(/sprint name/i)).toBeInTheDocument();
      });

      const sprintNameInput = screen.getByLabelText(/sprint name/i);
      await user.type(sprintNameInput, "Calculation Test Sprint");

      // Set specific values for easy calculation verification
      const totalPointsInput = screen.getByLabelText(/total points/i);
      await user.clear(totalPointsInput);
      await user.type(totalPointsInput, "50");

      const carryOverTotalInput = screen.getByLabelText(/carry over total/i);
      await user.clear(carryOverTotalInput);
      await user.type(carryOverTotalInput, "10");

      const carryOverCompletedInput =
        screen.getByLabelText(/carry over completed/i);
      await user.clear(carryOverCompletedInput);
      await user.type(carryOverCompletedInput, "8");

      const workingHoursInput = screen.getByLabelText(/working hours/i);
      await user.clear(workingHoursInput);
      await user.type(workingHoursInput, "100");

      const pointsCompletedInput = screen.getByLabelText(/points completed/i);
      await user.clear(pointsCompletedInput);
      await user.type(pointsCompletedInput, "35");

      // Submit and verify calculations
      const submitButton = screen.getByRole("button", { name: /save sprint/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/sprints",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"plannedPoints":42'), // 50 - 8
          })
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/sprints",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"newWorkPoints":40'), // 50 - 10
          })
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/sprints",
          expect.objectContaining({
            method: "POST",
            body: expect.stringContaining('"velocity":0.27'), // 27/100 (35-8=27 points completed)
          })
        );
      });
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle API failures gracefully", async () => {
      // Mock API failure
      mockFetch.mockImplementationOnce(() =>
        Promise.reject(new Error("Network error"))
      );

      render(<DashboardMetrics />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });

      // Should provide retry option
      expect(
        screen.getByRole("button", { name: /retry/i })
      ).toBeInTheDocument();
    });

    it("should handle empty data states", async () => {
      // Mock empty data
      mockDataStorage.sprints = [];
      mockFetch.mockImplementation((url: string) => {
        if (url.includes("/api/metrics")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                metrics: {
                  totalSprints: 0,
                  averageVelocity: 0,
                  averageCompletionRate: 0,
                  currentSprint: null,
                  predictedCapacity: 0,
                  forecastingInsights: {
                    dataQuality: "insufficient",
                    warnings: ["No historical sprint data available"],
                  },
                },
              }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ sprints: [] }),
        });
      });

      render(<DashboardMetrics />);

      // Should show empty state messaging
      await waitFor(() => {
        expect(screen.getByText(/no sprint data/i)).toBeInTheDocument();
      });

      // Should show guidance for getting started
      expect(screen.getByText(/create your first sprint/i)).toBeInTheDocument();
    });

    it("should validate form inputs and show appropriate errors", async () => {
      const user = userEvent.setup();

      render(<SprintForm />);

      // Try to submit empty form
      const submitButton = screen.getByRole("button", { name: /save sprint/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(
          screen.getByText(/sprint name is required/i)
        ).toBeInTheDocument();
      });

      // Try invalid numeric values
      const totalPointsInput = screen.getByLabelText(/total points/i);
      await user.type(totalPointsInput, "-10");

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
      });
    });
  });
});
