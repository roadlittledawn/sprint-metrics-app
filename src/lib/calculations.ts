/**
 * Core calculation functions for Sprint Data Tracker
 */

import { TeamMember, Sprint } from "./types";

/**
 * Calculate net working hours from team member data
 * @param teamMembers Array of team members with their hour allocations
 * @param defaultMeetingPercentage Default percentage for meeting hours (default: 20)
 * @returns Total net working hours for the team
 */
export function calculateWorkingHours(
  teamMembers: TeamMember[],
  defaultMeetingPercentage: number = 20
): number {
  return teamMembers.reduce((total, member) => {
    // Use explicit meeting hours if provided, otherwise calculate from percentage
    const meetingHours =
      member.meetingHours !== undefined
        ? member.meetingHours
        : (member.totalGrossHours * defaultMeetingPercentage) / 100;

    // Calculate net hours: gross - on-call - meetings - time off
    const netHours =
      member.totalGrossHours -
      member.onCallHours -
      meetingHours -
      member.timeOffHours;

    // Ensure we don't add negative hours (validation for negative scenarios)
    return total + Math.max(0, netHours);
  }, 0);
}

/**
 * Update team member with calculated net hours
 * @param member Team member to update
 * @param defaultMeetingPercentage Default percentage for meeting hours
 * @returns Updated team member with calculated net hours
 */
export function calculateTeamMemberNetHours(
  member: TeamMember,
  defaultMeetingPercentage: number = 20
): TeamMember {
  const meetingHours =
    member.meetingHours !== undefined
      ? member.meetingHours
      : (member.totalGrossHours * defaultMeetingPercentage) / 100;

  const netHours = Math.max(
    0,
    member.totalGrossHours -
      member.onCallHours -
      meetingHours -
      member.timeOffHours
  );

  return {
    ...member,
    meetingHours,
    netHours,
  };
}

/**
 * Validate team member hours to ensure no negative values in final calculation
 * @param member Team member to validate
 * @returns Validation result with any error messages
 */
export function validateTeamMemberHours(member: TeamMember): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (member.totalGrossHours < 0) {
    errors.push(`${member.name}: Total gross hours cannot be negative`);
  }

  if (member.onCallHours < 0) {
    errors.push(`${member.name}: On-call hours cannot be negative`);
  }

  if (member.meetingHours < 0) {
    errors.push(`${member.name}: Meeting hours cannot be negative`);
  }

  if (member.timeOffHours < 0) {
    errors.push(`${member.name}: Time off hours cannot be negative`);
  }

  const totalDeductions =
    member.onCallHours + member.meetingHours + member.timeOffHours;
  if (totalDeductions > member.totalGrossHours) {
    errors.push(
      `${member.name}: Total deductions (${totalDeductions}h) exceed gross hours (${member.totalGrossHours}h)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sprint Metrics Calculation Functions
 */

/**
 * Calculate planned points for a sprint
 * Planned points = Total points in sprint - Carry over points already completed
 * @param totalPointsInSprint Total points assigned to the sprint
 * @param carryOverPointsCompleted Carry over points that were already completed
 * @returns Planned points for the sprint
 */
export function calculatePlannedPoints(
  totalPointsInSprint: number,
  carryOverPointsCompleted: number
): number {
  return totalPointsInSprint - carryOverPointsCompleted;
}

/**
 * Calculate new work points for a sprint
 * New work points = Total points in sprint - Total carry over points
 * @param totalPointsInSprint Total points assigned to the sprint
 * @param carryOverPointsTotal Total carry over points from previous sprint
 * @returns New work points for the sprint
 */
export function calculateNewWorkPoints(
  totalPointsInSprint: number,
  carryOverPointsTotal: number
): number {
  return totalPointsInSprint - carryOverPointsTotal;
}

/**
 * Calculate points completed for a sprint (excluding carry over)
 * Points completed = Total completed points - Carry over points completed
 * @param totalCompletedPoints Total points completed in the sprint
 * @param carryOverPointsCompleted Carry over points that were completed
 * @returns Points completed for new work in the sprint
 */
export function calculatePointsCompleted(
  totalCompletedPoints: number,
  carryOverPointsCompleted: number
): number {
  return totalCompletedPoints - carryOverPointsCompleted;
}

/**
 * Calculate percent complete for a sprint
 * Percent complete = (Points completed / Planned points) * 100
 * Handles division by zero by returning 0
 * @param pointsCompleted Points completed in the sprint
 * @param plannedPoints Planned points for the sprint
 * @returns Percent complete as a number (0-100)
 */
export function calculatePercentComplete(
  pointsCompleted: number,
  plannedPoints: number
): number {
  if (plannedPoints <= 0) {
    return 0;
  }
  return (pointsCompleted / plannedPoints) * 100;
}

/**
 * Calculate velocity for a sprint
 * Velocity = Points completed / Working hours
 * Handles division by zero by returning 0
 * @param pointsCompleted Points completed in the sprint
 * @param workingHours Net working hours for the sprint
 * @returns Velocity as points per hour
 */
export function calculateVelocity(
  pointsCompleted: number,
  workingHours: number
): number {
  if (workingHours <= 0) {
    return 0;
  }
  return pointsCompleted / workingHours;
}

/**
 * Calculate all sprint metrics at once
 * @param sprintData Raw sprint data
 * @returns Calculated sprint metrics
 */
export function calculateSprintMetrics(sprintData: {
  totalPointsInSprint: number;
  carryOverPointsTotal: number;
  carryOverPointsCompleted: number;
  totalCompletedPoints: number;
  workingHours: number;
}): {
  plannedPoints: number;
  newWorkPoints: number;
  pointsCompleted: number;
  percentComplete: number;
  velocity: number;
} {
  const plannedPoints = calculatePlannedPoints(
    sprintData.totalPointsInSprint,
    sprintData.carryOverPointsCompleted
  );

  const newWorkPoints = calculateNewWorkPoints(
    sprintData.totalPointsInSprint,
    sprintData.carryOverPointsTotal
  );

  const pointsCompleted = calculatePointsCompleted(
    sprintData.totalCompletedPoints,
    sprintData.carryOverPointsCompleted
  );

  const percentComplete = calculatePercentComplete(
    pointsCompleted,
    plannedPoints
  );

  const velocity = calculateVelocity(pointsCompleted, sprintData.workingHours);

  return {
    plannedPoints,
    newWorkPoints,
    pointsCompleted,
    percentComplete,
    velocity,
  };
}
/**
 * Forecasting and Average Velocity Functions
 */

/**
 * Calculate average velocity over the last N sprints
 * @param sprints Array of sprint data (should be sorted by date, most recent last)
 * @param numberOfSprints Number of recent sprints to include in average (default: 6)
 * @returns Average velocity over the specified number of sprints
 */
export function calculateAverageVelocity(
  sprints: Sprint[],
  numberOfSprints: number = 6
): number {
  if (sprints.length === 0) {
    return 0;
  }

  // Take the last N sprints (most recent)
  const recentSprints = sprints.slice(-numberOfSprints);

  if (recentSprints.length === 0) {
    return 0;
  }

  const totalVelocity = recentSprints.reduce(
    (sum, sprint) => sum + sprint.velocity,
    0
  );
  return totalVelocity / recentSprints.length;
}

/**
 * Calculate predicted capacity for an upcoming sprint
 * @param averageVelocity Average velocity from historical sprints
 * @param upcomingWorkingHours Working hours planned for the upcoming sprint
 * @returns Predicted capacity in story points
 */
export function calculatePredictedCapacity(
  averageVelocity: number,
  upcomingWorkingHours: number
): number {
  if (averageVelocity <= 0 || upcomingWorkingHours <= 0) {
    return 0;
  }
  return averageVelocity * upcomingWorkingHours;
}

/**
 * Get forecasting insights based on historical data
 * @param sprints Array of sprint data
 * @param upcomingWorkingHours Working hours for the upcoming sprint
 * @param numberOfSprints Number of sprints to use for averaging (default: 6)
 * @returns Forecasting insights including warnings and recommendations
 */
export function getForecastingInsights(
  sprints: Sprint[],
  upcomingWorkingHours: number,
  numberOfSprints: number = 6
): {
  averageVelocity: number;
  predictedCapacity: number;
  dataQuality: "insufficient" | "limited" | "good" | "excellent";
  warnings: string[];
  recommendations: string[];
  sprintsUsed: number;
} {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  // Calculate metrics
  const averageVelocity = calculateAverageVelocity(sprints, numberOfSprints);
  const predictedCapacity = calculatePredictedCapacity(
    averageVelocity,
    upcomingWorkingHours
  );
  const sprintsUsed = Math.min(sprints.length, numberOfSprints);

  // Determine data quality
  let dataQuality: "insufficient" | "limited" | "good" | "excellent";
  if (sprintsUsed === 0) {
    dataQuality = "insufficient";
    warnings.push("No historical sprint data available for forecasting");
    recommendations.push(
      "Complete at least 2-3 sprints to get meaningful forecasts"
    );
  } else if (sprintsUsed < 3) {
    dataQuality = "limited";
    warnings.push(
      `Only ${sprintsUsed} sprint(s) available for forecasting - predictions may be unreliable`
    );
    recommendations.push("Complete more sprints to improve forecast accuracy");
  } else if (sprintsUsed < numberOfSprints) {
    dataQuality = "good";
    warnings.push(
      `Using ${sprintsUsed} sprints instead of requested ${numberOfSprints} for forecasting`
    );
  } else {
    dataQuality = "excellent";
  }

  // Check for velocity consistency
  if (sprintsUsed >= 3) {
    const recentSprints = sprints.slice(-sprintsUsed);
    const velocities = recentSprints.map((s) => s.velocity);
    const minVelocity = Math.min(...velocities);
    const maxVelocity = Math.max(...velocities);
    const velocityRange = maxVelocity - minVelocity;
    const velocityVariation = velocityRange / averageVelocity;

    if (velocityVariation > 0.5) {
      warnings.push(
        "High velocity variation detected - forecasts may be less reliable"
      );
      recommendations.push(
        "Review sprint consistency and team capacity planning"
      );
    }
  }

  // Check for zero velocity sprints
  if (sprintsUsed > 0) {
    const zeroVelocitySprints = sprints
      .slice(-sprintsUsed)
      .filter((s) => s.velocity === 0).length;

    if (zeroVelocitySprints > 0) {
      warnings.push(
        `${zeroVelocitySprints} sprint(s) with zero velocity detected`
      );
      recommendations.push(
        "Review sprints with zero velocity for data accuracy"
      );
    }
  }

  // Add general recommendations based on data quality
  if (dataQuality === "good" && sprintsUsed < numberOfSprints) {
    recommendations.push("Complete more sprints to improve forecast accuracy");
  }

  return {
    averageVelocity,
    predictedCapacity,
    dataQuality,
    warnings,
    recommendations,
    sprintsUsed,
  };
}

/**
 * Calculate velocity trend over time
 * @param sprints Array of sprint data (should be sorted by date)
 * @param windowSize Number of sprints to use for trend calculation (default: 3)
 * @returns Trend analysis indicating if velocity is improving, declining, or stable
 */
export function calculateVelocityTrend(
  sprints: Sprint[],
  windowSize: number = 3
): {
  trend: "improving" | "declining" | "stable" | "insufficient_data";
  trendStrength: "weak" | "moderate" | "strong";
  recentAverage: number;
  previousAverage: number;
  changePercent: number;
} {
  if (sprints.length < windowSize * 2) {
    return {
      trend: "insufficient_data",
      trendStrength: "weak",
      recentAverage: 0,
      previousAverage: 0,
      changePercent: 0,
    };
  }

  // Calculate recent average (last windowSize sprints)
  const recentSprints = sprints.slice(-windowSize);
  const recentAverage =
    recentSprints.reduce((sum, s) => sum + s.velocity, 0) / windowSize;

  // Calculate previous average (windowSize sprints before the recent ones)
  const previousSprints = sprints.slice(-(windowSize * 2), -windowSize);
  const previousAverage =
    previousSprints.reduce((sum, s) => sum + s.velocity, 0) / windowSize;

  // Calculate change
  const changePercent =
    previousAverage > 0
      ? ((recentAverage - previousAverage) / previousAverage) * 100
      : 0;

  // Determine trend
  let trend: "improving" | "declining" | "stable" | "insufficient_data";
  let trendStrength: "weak" | "moderate" | "strong";

  const absChangePercent = Math.abs(changePercent);

  if (absChangePercent < 5) {
    trend = "stable";
    trendStrength = "weak";
  } else if (changePercent > 0) {
    trend = "improving";
    if (absChangePercent < 15) trendStrength = "weak";
    else if (absChangePercent < 30) trendStrength = "moderate";
    else trendStrength = "strong";
  } else {
    trend = "declining";
    if (absChangePercent < 15) trendStrength = "weak";
    else if (absChangePercent < 30) trendStrength = "moderate";
    else trendStrength = "strong";
  }

  return {
    trend,
    trendStrength,
    recentAverage,
    previousAverage,
    changePercent,
  };
}
