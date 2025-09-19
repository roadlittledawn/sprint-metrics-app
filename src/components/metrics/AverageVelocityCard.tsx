"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface AverageVelocityCardProps {
  averageVelocity: number;
  timePeriod?: string;
  previousVelocity?: number;
  isLoading?: boolean;
  className?: string;
}

export default function AverageVelocityCard({
  averageVelocity,
  timePeriod = "Last 6 sprints",
  previousVelocity,
  isLoading = false,
  className = "",
}: AverageVelocityCardProps) {
  const formatVelocity = (value: number): string => {
    return `${value.toFixed(3)} pts/hr`;
  };

  const getTrendDirection = (): TrendDirection => {
    if (!previousVelocity) {
      // If no previous velocity, use performance thresholds
      if (averageVelocity >= 0.3) return "up";
      if (averageVelocity >= 0.15) return "neutral";
      return "down";
    }

    const change = averageVelocity - previousVelocity;
    const changePercent =
      previousVelocity > 0 ? (change / previousVelocity) * 100 : 0;

    if (changePercent > 5) return "up";
    if (changePercent < -5) return "down";
    return "neutral";
  };

  const getTrendValue = (): string => {
    if (!previousVelocity) {
      if (averageVelocity >= 0.3) return "Excellent";
      if (averageVelocity >= 0.2) return "Good";
      if (averageVelocity >= 0.15) return "Fair";
      return "Low";
    }

    const change = averageVelocity - previousVelocity;
    const changePercent =
      previousVelocity > 0 ? (change / previousVelocity) * 100 : 0;
    return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
  };

  const getTrendLabel = (): string => {
    if (!previousVelocity) {
      return "performance level";
    }
    return "vs previous period";
  };

  return (
    <MetricsCard
      title="Average Velocity"
      value={averageVelocity}
      subtitle="Points completed per hour"
      trend={
        averageVelocity > 0
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
      valueFormatter={formatVelocity}
    />
  );
}
