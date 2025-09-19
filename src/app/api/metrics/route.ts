/**
 * API routes for calculated metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { readSprints, readConfig } from "@/lib/dataManager";
import {
  calculateAverageVelocity,
  calculatePredictedCapacity,
  getForecastingInsights,
  calculateVelocityTrend,
  calculateWorkingHours,
} from "@/lib/calculations";
import { ApiResponse, SprintMetrics } from "@/lib/types";

// GET /api/metrics - Get calculated metrics for dashboard
export async function GET(request: NextRequest) {
  try {
    const sprints = await readSprints();
    const config = await readConfig();

    if (sprints.length === 0) {
      // Return empty metrics when no sprints exist
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

      const response: ApiResponse<SprintMetrics> = {
        success: true,
        data: emptyMetrics,
      };

      return NextResponse.json(response);
    }

    // Get the most recent sprint for current status
    const currentSprint = sprints[sprints.length - 1];

    // Calculate average velocity
    const averageVelocity = calculateAverageVelocity(
      sprints,
      config.velocityCalculationSprints
    );

    // Calculate working hours for next sprint (using team members if available)
    const nextSprintWorkingHours =
      config.teamMembers.length > 0
        ? calculateWorkingHours(
            config.teamMembers,
            config.defaultMeetingPercentage
          )
        : currentSprint.workingHours; // Fallback to last sprint's working hours

    // Calculate forecasted capacity
    const forecastedCapacity = calculatePredictedCapacity(
      averageVelocity,
      nextSprintWorkingHours
    );

    // Calculate capacity utilization (average across all sprints)
    const totalCapacityUtilization = sprints.reduce((sum, sprint) => {
      const utilization =
        sprint.workingHours > 0
          ? (sprint.pointsCompleted / sprint.workingHours / averageVelocity) *
            100
          : 0;
      return sum + Math.min(utilization, 100); // Cap at 100%
    }, 0);
    const capacityUtilization =
      sprints.length > 0 ? totalCapacityUtilization / sprints.length : 0;

    // Calculate sprint completion rate (average percent complete)
    const totalCompletionRate = sprints.reduce(
      (sum, sprint) => sum + sprint.percentComplete,
      0
    );
    const sprintCompletionRate =
      sprints.length > 0 ? totalCompletionRate / sprints.length : 0;

    // Calculate points per hour (same as average velocity)
    const pointsPerHour = averageVelocity;

    const metrics: SprintMetrics = {
      currentSprintStatus: {
        sprintName: currentSprint.sprintName,
        percentComplete: currentSprint.percentComplete,
        pointsCompleted: currentSprint.pointsCompleted,
        plannedPoints: currentSprint.plannedPoints,
      },
      averageVelocity,
      forecastedCapacity,
      capacityUtilization,
      sprintCompletionRate,
      pointsPerHour,
    };

    const response: ApiResponse<SprintMetrics> = {
      success: true,
      data: metrics,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error calculating metrics:", error);

    const response: ApiResponse<SprintMetrics> = {
      success: false,
      error: "Failed to calculate metrics",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// GET /api/metrics/forecasting - Get detailed forecasting insights
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { upcomingWorkingHours, sprintCount } = body;

    if (typeof upcomingWorkingHours !== "number" || upcomingWorkingHours <= 0) {
      const response: ApiResponse<any> = {
        success: false,
        error: "Valid upcomingWorkingHours is required",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const sprints = await readSprints();
    const config = await readConfig();

    const forecastingInsights = getForecastingInsights(
      sprints,
      upcomingWorkingHours,
      sprintCount || config.velocityCalculationSprints
    );

    const response: ApiResponse<typeof forecastingInsights> = {
      success: true,
      data: forecastingInsights,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error getting forecasting insights:", error);

    const response: ApiResponse<any> = {
      success: false,
      error: "Failed to get forecasting insights",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
