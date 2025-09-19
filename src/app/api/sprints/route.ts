/**
 * API routes for sprint CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import {
  readSprints,
  addSprint,
  updateSprint,
  deleteSprint,
  getSprint,
} from "@/lib/dataManager";
import { calculateSprintMetrics } from "@/lib/calculations";
import { Sprint, SprintFormData, ApiResponse } from "@/lib/types";

// GET /api/sprints - Get all sprints
export async function GET(request: NextRequest) {
  try {
    const sprints = await readSprints();

    const response: ApiResponse<Sprint[]> = {
      success: true,
      data: sprints,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching sprints:", error);

    const response: ApiResponse<Sprint[]> = {
      success: false,
      error: "Failed to fetch sprints",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/sprints - Create a new sprint
export async function POST(request: NextRequest) {
  try {
    const body: SprintFormData = await request.json();

    // Validate required fields
    const requiredFields = [
      "sprintName",
      "businessDays",
      "numberOfPeople",
      "totalPointsInSprint",
      "carryOverPointsTotal",
      "carryOverPointsCompleted",
      "unplannedPointsBroughtIn",
      "pointsCompleted",
    ];

    for (const field of requiredFields) {
      if (
        !(field in body) ||
        body[field as keyof SprintFormData] === undefined
      ) {
        const response: ApiResponse<Sprint> = {
          success: false,
          error: `Missing required field: ${field}`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate numeric fields
    const numericFields = [
      "businessDays",
      "numberOfPeople",
      "totalPointsInSprint",
      "carryOverPointsTotal",
      "carryOverPointsCompleted",
      "unplannedPointsBroughtIn",
      "pointsCompleted",
    ];

    for (const field of numericFields) {
      const value = body[field as keyof SprintFormData];
      if (typeof value !== "number" || isNaN(value) || value < 0) {
        const response: ApiResponse<Sprint> = {
          success: false,
          error: `Invalid value for ${field}: must be a non-negative number`,
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Calculate derived metrics
    const sprintData = {
      totalPointsInSprint: body.totalPointsInSprint,
      carryOverPointsTotal: body.carryOverPointsTotal,
      carryOverPointsCompleted: body.carryOverPointsCompleted,
      totalCompletedPoints:
        body.pointsCompleted + body.carryOverPointsCompleted,
      workingHours: body.numberOfPeople * body.businessDays * 8, // Simplified calculation
    };

    const metrics = calculateSprintMetrics(sprintData);

    // Create sprint object
    const sprint: Sprint = {
      id: `sprint-${Date.now()}`, // Simple ID generation
      sprintName: body.sprintName,
      taskeiLink: body.taskeiLink,
      businessDays: body.businessDays,
      numberOfPeople: body.numberOfPeople,
      workingHours: sprintData.workingHours,
      totalPointsInSprint: body.totalPointsInSprint,
      carryOverPointsTotal: body.carryOverPointsTotal,
      carryOverPointsCompleted: body.carryOverPointsCompleted,
      newWorkPoints: metrics.newWorkPoints,
      unplannedPointsBroughtIn: body.unplannedPointsBroughtIn,
      pointsCompleted: metrics.pointsCompleted,
      plannedPoints: metrics.plannedPoints,
      percentComplete: metrics.percentComplete,
      velocity: metrics.velocity,
      predictedCapacity: 0, // Will be calculated based on historical data
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await addSprint(sprint);

    const response: ApiResponse<Sprint> = {
      success: true,
      data: sprint,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating sprint:", error);

    let errorMessage = "Failed to create sprint";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse<Sprint> = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/sprints - Update an existing sprint or bulk import sprints
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a bulk import (has sprints array)
    if (body.sprints && Array.isArray(body.sprints)) {
      // Bulk import sprints
      const { writeSprintsData } = await import("@/lib/dataManager");
      await writeSprintsData(body.sprints);

      const response: ApiResponse<Sprint[]> = {
        success: true,
        data: body.sprints,
      };

      return NextResponse.json(response);
    }

    if (!body.id) {
      const response: ApiResponse<Sprint> = {
        success: false,
        error: "Sprint ID is required for updates",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Check if sprint exists
    const existingSprint = await getSprint(body.id);
    if (!existingSprint) {
      const response: ApiResponse<Sprint> = {
        success: false,
        error: `Sprint with ID ${body.id} not found`,
      };
      return NextResponse.json(response, { status: 404 });
    }

    // Validate and calculate metrics similar to POST
    const sprintData = {
      totalPointsInSprint: body.totalPointsInSprint,
      carryOverPointsTotal: body.carryOverPointsTotal,
      carryOverPointsCompleted: body.carryOverPointsCompleted,
      totalCompletedPoints:
        body.pointsCompleted + body.carryOverPointsCompleted,
      workingHours: body.numberOfPeople * body.businessDays * 8,
    };

    const metrics = calculateSprintMetrics(sprintData);

    const updatedSprint: Sprint = {
      ...existingSprint,
      sprintName: body.sprintName,
      taskeiLink: body.taskeiLink,
      businessDays: body.businessDays,
      numberOfPeople: body.numberOfPeople,
      workingHours: sprintData.workingHours,
      totalPointsInSprint: body.totalPointsInSprint,
      carryOverPointsTotal: body.carryOverPointsTotal,
      carryOverPointsCompleted: body.carryOverPointsCompleted,
      newWorkPoints: metrics.newWorkPoints,
      unplannedPointsBroughtIn: body.unplannedPointsBroughtIn,
      pointsCompleted: metrics.pointsCompleted,
      plannedPoints: metrics.plannedPoints,
      percentComplete: metrics.percentComplete,
      velocity: metrics.velocity,
      updatedAt: new Date().toISOString(),
    };

    await updateSprint(body.id, updatedSprint);

    const response: ApiResponse<Sprint> = {
      success: true,
      data: updatedSprint,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating sprint:", error);

    let errorMessage = "Failed to update sprint";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse<Sprint> = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// DELETE /api/sprints - Delete a sprint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sprintId = searchParams.get("id");

    if (!sprintId) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Sprint ID is required for deletion",
      };
      return NextResponse.json(response, { status: 400 });
    }

    await deleteSprint(sprintId);

    const response: ApiResponse<null> = {
      success: true,
      data: null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error deleting sprint:", error);

    let errorMessage = "Failed to delete sprint";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse<null> = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
