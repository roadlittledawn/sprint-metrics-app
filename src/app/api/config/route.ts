/**
 * API routes for application configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/lib/dataManager";
import {
  calculateTeamMemberNetHours,
  validateTeamMemberHours,
} from "@/lib/calculations";
import { ApiResponse, AppConfig, TeamMember } from "@/lib/types";

// GET /api/config - Get application configuration
export async function GET(request: NextRequest) {
  try {
    const config = await readConfig();

    const response: ApiResponse<AppConfig> = {
      success: true,
      data: config,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching config:", error);

    const response: ApiResponse<AppConfig> = {
      success: false,
      error: "Failed to fetch configuration",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// PUT /api/config - Update application configuration
export async function PUT(request: NextRequest) {
  try {
    const body: Partial<AppConfig> = await request.json();
    const currentConfig = await readConfig();

    // Validate velocityCalculationSprints if provided
    if (body.velocityCalculationSprints !== undefined) {
      if (
        typeof body.velocityCalculationSprints !== "number" ||
        body.velocityCalculationSprints < 1 ||
        body.velocityCalculationSprints > 20
      ) {
        const response: ApiResponse<AppConfig> = {
          success: false,
          error: "velocityCalculationSprints must be a number between 1 and 20",
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate defaultMeetingPercentage if provided
    if (body.defaultMeetingPercentage !== undefined) {
      if (
        typeof body.defaultMeetingPercentage !== "number" ||
        body.defaultMeetingPercentage < 0 ||
        body.defaultMeetingPercentage > 100
      ) {
        const response: ApiResponse<AppConfig> = {
          success: false,
          error: "defaultMeetingPercentage must be a number between 0 and 100",
        };
        return NextResponse.json(response, { status: 400 });
      }
    }

    // Validate team members if provided
    if (body.teamMembers !== undefined) {
      if (!Array.isArray(body.teamMembers)) {
        const response: ApiResponse<AppConfig> = {
          success: false,
          error: "teamMembers must be an array",
        };
        return NextResponse.json(response, { status: 400 });
      }

      // Validate each team member
      const validationErrors: string[] = [];
      const processedMembers: TeamMember[] = [];

      for (const member of body.teamMembers) {
        if (!member.name || typeof member.name !== "string") {
          validationErrors.push("Each team member must have a valid name");
          continue;
        }

        // Calculate net hours and validate
        const processedMember = calculateTeamMemberNetHours(
          member,
          body.defaultMeetingPercentage ||
            currentConfig.defaultMeetingPercentage
        );

        const validation = validateTeamMemberHours(processedMember);
        if (!validation.isValid) {
          validationErrors.push(...validation.errors);
        } else {
          processedMembers.push(processedMember);
        }
      }

      if (validationErrors.length > 0) {
        const response: ApiResponse<AppConfig> = {
          success: false,
          error: `Team member validation errors: ${validationErrors.join(
            ", "
          )}`,
        };
        return NextResponse.json(response, { status: 400 });
      }

      body.teamMembers = processedMembers;
    }

    // Merge with current config
    const updatedConfig: AppConfig = {
      ...currentConfig,
      ...body,
    };

    await writeConfig(updatedConfig);

    const response: ApiResponse<AppConfig> = {
      success: true,
      data: updatedConfig,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error updating config:", error);

    let errorMessage = "Failed to update configuration";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse<AppConfig> = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// POST /api/config/team-members - Add or update team members
export async function POST(request: NextRequest) {
  try {
    const body: { teamMembers: TeamMember[] } = await request.json();

    if (!Array.isArray(body.teamMembers)) {
      const response: ApiResponse<AppConfig> = {
        success: false,
        error: "teamMembers must be an array",
      };
      return NextResponse.json(response, { status: 400 });
    }

    const config = await readConfig();

    // Process and validate team members
    const validationErrors: string[] = [];
    const processedMembers: TeamMember[] = [];

    for (const member of body.teamMembers) {
      if (!member.name || typeof member.name !== "string") {
        validationErrors.push("Each team member must have a valid name");
        continue;
      }

      const processedMember = calculateTeamMemberNetHours(
        member,
        config.defaultMeetingPercentage
      );

      const validation = validateTeamMemberHours(processedMember);
      if (!validation.isValid) {
        validationErrors.push(...validation.errors);
      } else {
        processedMembers.push(processedMember);
      }
    }

    if (validationErrors.length > 0) {
      const response: ApiResponse<AppConfig> = {
        success: false,
        error: `Team member validation errors: ${validationErrors.join(", ")}`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Update config with new team members
    const updatedConfig: AppConfig = {
      ...config,
      teamMembers: processedMembers,
    };

    await writeConfig(updatedConfig);

    const response: ApiResponse<AppConfig> = {
      success: true,
      data: updatedConfig,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error updating team members:", error);

    let errorMessage = "Failed to update team members";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse<AppConfig> = {
      success: false,
      error: errorMessage,
    };

    return NextResponse.json(response, { status: 500 });
  }
}
