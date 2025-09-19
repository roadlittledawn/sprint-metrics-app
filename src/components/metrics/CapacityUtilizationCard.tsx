"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface CapacityUtilizationCardProps {
  capacityUtilization: number;
  timePeriod?: string;
  targetUtilization?: number;
  isLoading?: boolean;
  className?: string;
}

export default function CapacityUtilizationCard({
  capacityUtilization,
  timePeriod = "Last 6 sprints",
  targetUtilization = 85,
  isLoading = false,
  className = "",
}: CapacityUtilizationCardProps) {
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendDirection = (): TrendDirection => {
    const difference = capacityUtilization - targetUtilization;

    if (Math.abs(difference) <= 5) return "neutral"; // Within 5% of target is neutral
    if (capacityUtilization > targetUtilization) {
      // Over-utilization - could be good (productive) or bad (burnout risk)
      return capacityUtilization > targetUtilization + 15 ? "down" : "up";
    }
    return "down"; // Under-utilization
  };

  const getTrendValue = (): string => {
    const difference = Math.abs(capacityUtilization - targetUtilization);
    return `${difference.toFixed(1)}%`;
  };

  const getTrendLabel = (): string => {
    const difference = capacityUtilization - targetUtilization;

    if (Math.abs(difference) <= 5) {
      return "optimal range";
    }

    if (capacityUtilization > targetUtilization) {
      if (capacityUtilization > targetUtilization + 15) {
        return "over-utilized (risk)";
      }
      return "above target";
    }

    return "under-utilized";
  };

  const getSubtitle = (): string => {
    const baseSubtitle = "Average team capacity usage";
    return `${baseSubtitle} (target: ${targetUtilization}%)`;
  };

  return (
    <MetricsCard
      title="Capacity Utilization"
      value={capacityUtilization}
      subtitle={getSubtitle()}
      trend={
        capacityUtilization > 0
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
