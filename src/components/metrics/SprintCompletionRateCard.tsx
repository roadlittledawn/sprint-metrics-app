"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface SprintCompletionRateCardProps {
  sprintCompletionRate: number;
  timePeriod?: string;
  targetCompletionRate?: number;
  isLoading?: boolean;
  className?: string;
}

export default function SprintCompletionRateCard({
  sprintCompletionRate,
  timePeriod = "Last 6 sprints",
  targetCompletionRate = 90,
  isLoading = false,
  className = "",
}: SprintCompletionRateCardProps) {
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendDirection = (): TrendDirection => {
    if (sprintCompletionRate >= targetCompletionRate) return "up";
    if (sprintCompletionRate >= targetCompletionRate - 10) return "neutral";
    return "down";
  };

  const getTrendValue = (): string => {
    const difference = sprintCompletionRate - targetCompletionRate;
    return `${difference >= 0 ? "+" : ""}${difference.toFixed(1)}%`;
  };

  const getTrendLabel = (): string => {
    const difference = sprintCompletionRate - targetCompletionRate;

    if (difference >= 0) {
      return "above target";
    } else if (difference >= -10) {
      return "near target";
    } else {
      return "below target";
    }
  };

  const getSubtitle = (): string => {
    return `Average sprint completion percentage (target: ${targetCompletionRate}%)`;
  };

  const getPerformanceIndicator = (): string => {
    if (sprintCompletionRate >= 95) return "Excellent";
    if (sprintCompletionRate >= 85) return "Good";
    if (sprintCompletionRate >= 70) return "Fair";
    return "Needs Improvement";
  };

  return (
    <MetricsCard
      title="Sprint Completion Rate"
      value={sprintCompletionRate}
      subtitle={getSubtitle()}
      trend={
        sprintCompletionRate > 0
          ? {
              direction: getTrendDirection(),
              value: getTrendValue(),
              label: getTrendLabel(),
            }
          : undefined
      }
      timePeriod={timePeriod}
      isLoading={isLoading}
      className={className}
      valueFormatter={formatPercentage}
    />
  );
}
