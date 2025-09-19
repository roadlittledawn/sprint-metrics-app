"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface CurrentSprintStatusCardProps {
  sprintName: string;
  percentComplete: number;
  pointsCompleted: number;
  plannedPoints: number;
  isLoading?: boolean;
  className?: string;
}

export default function CurrentSprintStatusCard({
  sprintName,
  percentComplete,
  pointsCompleted,
  plannedPoints,
  isLoading = false,
  className = "",
}: CurrentSprintStatusCardProps) {
  const getTrendDirection = (): TrendDirection => {
    if (percentComplete >= 90) return "up";
    if (percentComplete >= 70) return "neutral";
    return "down";
  };

  const getTrendLabel = (): string => {
    if (percentComplete >= 90) return "excellent progress";
    if (percentComplete >= 70) return "on track";
    return "needs attention";
  };

  return (
    <MetricsCard
      title="Current Sprint Status"
      value={sprintName}
      subtitle={`${pointsCompleted.toFixed(1)} of ${plannedPoints.toFixed(
        1
      )} points completed`}
      trend={
        percentComplete > 0
          ? {
              direction: getTrendDirection(),
              value: `${percentComplete.toFixed(1)}%`,
              label: getTrendLabel(),
            }
          : undefined
      }
      isLoading={isLoading}
      className={className}
      valueFormatter={(val) =>
        typeof val === "string" ? val : `Sprint ${val}`
      }
    />
  );
}
