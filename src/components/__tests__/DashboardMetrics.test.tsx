import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DashboardMetrics from "../DashboardMetrics";
import { SprintMetrics, ApiResponse } from "@/lib/types";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("DashboardMetrics", () => {
  const mockMetrics: SprintMetrics = {
    currentSprintStatus: {
      sprintName: "Sprint 24.1",
      percentComplete: 85.5,
      pointsCompleted: 25.5,
      plannedPoints: 30.0,
    },
    averageVelocity: 0.245,
    forecastedCapacity: 28.5,
    capacityUtilization: 92.3,
    sprintCompletionRate: 88.7,
    pointsPerHour: 0.245,
  };

  const mockSuccessResponse: ApiResponse<SprintMetrics> = {
    success: true,
    data: mockMetrics,
  };

  const mockErrorResponse: ApiResponse<SprintMetrics> = {
    success: false,
    error: "Failed to fetch metrics",
  };

  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<DashboardMetrics />);

    // Should show loading skeletons
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("renders metrics cards when data is loaded successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(screen.getByText("CURRENT SPRINT STATUS")).toBeInTheDocument();
      expect(screen.getByText("AVERAGE VELOCITY")).toBeInTheDocument();
      expect(screen.getByText("FORECASTED CAPACITY")).toBeInTheDocument();
      expect(screen.getByText("CAPACITY UTILIZATION")).toBeInTheDocument();
      expect(screen.getByText("SPRINT COMPLETION RATE")).toBeInTheDocument();
      expect(screen.getByText("POINTS PER HOUR")).toBeInTheDocument();
    });
  });

  it("displays correct metric values", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
      expect(screen.getByText("0.245 pts/hr")).toBeInTheDocument();
      expect(screen.getByText("28.5 pts")).toBeInTheDocument();
      expect(screen.getByText("92.3%")).toBeInTheDocument();
      expect(screen.getByText("88.7%")).toBeInTheDocument();
    });
  });

  it("displays correct subtitles and descriptions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(
        screen.getByText("25.5 of 30.0 points completed")
      ).toBeInTheDocument();
      expect(screen.getByText("Points completed per hour")).toBeInTheDocument();
      expect(
        screen.getByText("Predicted points for next sprint")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Average team capacity usage")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Average sprint completion percentage")
      ).toBeInTheDocument();
      expect(screen.getByText("Team efficiency metric")).toBeInTheDocument();
    });
  });

  it("displays time period when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<DashboardMetrics timePeriod="Last 3 sprints" />);

    await waitFor(() => {
      expect(screen.getByText("Last 3 sprints")).toBeInTheDocument();
    });
  });

  it("renders error state when API call fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(screen.getByText("Error Loading Metrics")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch metrics")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("renders error state when network request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(screen.getByText("Error Loading Metrics")).toBeInTheDocument();
      expect(screen.getByText("Failed to fetch metrics")).toBeInTheDocument();
    });
  });

  it("handles empty metrics data", async () => {
    const emptyMetrics: SprintMetrics = {
      currentSprintStatus: {
        sprintName: "No sprints available",
        percentComplete: 0,
        pointsCompleted: 0,
        plannedPoints: 0,
      },
      averageVelocity: 0,
      forecastedCapacity: 0,
      capacityUtilization: 0,
      sprintCompletionRate: 0,
      pointsPerHour: 0,
    };

    const emptyResponse: ApiResponse<SprintMetrics> = {
      success: true,
      data: emptyMetrics,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => emptyResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(screen.getByText("No sprints available")).toBeInTheDocument();
      expect(screen.getByText("0.000 pts/hr")).toBeInTheDocument();
      expect(screen.getByText("0.0 pts")).toBeInTheDocument();
      expect(screen.getByText("0.0%")).toBeInTheDocument();
    });
  });

  it("applies custom className", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    const { container } = render(
      <DashboardMetrics className="custom-dashboard-class" />
    );

    await waitFor(() => {
      const dashboardElement = container.firstChild as HTMLElement;
      expect(dashboardElement).toHaveClass("custom-dashboard-class");
    });
  });

  it("makes API call to correct endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSuccessResponse,
    });

    render(<DashboardMetrics />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/metrics");
    });
  });

  describe("trend indicators", () => {
    it("shows appropriate trend directions for high performance metrics", async () => {
      const highPerformanceMetrics: SprintMetrics = {
        ...mockMetrics,
        currentSprintStatus: {
          ...mockMetrics.currentSprintStatus,
          percentComplete: 95.0, // High completion rate
        },
        averageVelocity: 0.35, // High velocity
        capacityUtilization: 95.0, // High utilization
        sprintCompletionRate: 95.0, // High completion rate
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: highPerformanceMetrics }),
      });

      render(<DashboardMetrics />);

      await waitFor(() => {
        expect(screen.getByText("95.0%")).toBeInTheDocument();
        expect(screen.getByText("0.350 pts/hr")).toBeInTheDocument();
      });
    });

    it("handles zero values gracefully", async () => {
      const zeroMetrics: SprintMetrics = {
        currentSprintStatus: {
          sprintName: "Sprint 24.1",
          percentComplete: 0,
          pointsCompleted: 0,
          plannedPoints: 0,
        },
        averageVelocity: 0,
        forecastedCapacity: 0,
        capacityUtilization: 0,
        sprintCompletionRate: 0,
        pointsPerHour: 0,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: zeroMetrics }),
      });

      render(<DashboardMetrics />);

      await waitFor(() => {
        expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
        expect(screen.getByText("0.000 pts/hr")).toBeInTheDocument();
        expect(screen.getByText("0.0 pts")).toBeInTheDocument();
        expect(screen.getByText("0.0%")).toBeInTheDocument();
      });
    });
  });
});
