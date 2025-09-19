"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface PointsPerHourCardProps {
  pointsPerHour: number;
  timePeriod?: string;
  previousPointsPerHour?: number;
  benchmarkPointsPerHour?: number;
  isLoading?: boolean;
  className?: string;
}

export default function PointsPerHourCard({
  pointsPerHour,
  timePeriod = "Last 6 sprints",
  previousPointsPerHour,
  benchmarkPointsPerHour = 0.25,
  isLoading = false,
  className = "",
}: PointsPerHourCardProps) {
  const formatEfficiency = (value: number): string => {
    return `${value.toFixed(3)} pts/hr`;
  };

  const getTrendDirection = (): TrendDirection => {
    if (previousPointsPerHour) {
      const change = pointsPerHour - previousPointsPerHour;
      const changePercent =
        previousPointsPerHour > 0 ? (change / previousPointsPerHour) * 100 : 0;

      if (changePercent > 5) return "up";
      if (changePercent < -5) return "down";
      return "neutral";
    }

    // Compare against benchmark if no previous data
    if (pointsPerHour >= benchmarkPointsPerHour * 1.2) return "up";
    if (pointsPerHour >= benchmarkPointsPerHour * 0.8) return "neutral";
    return "down";
  };

  const getTrendValue = (): string => {
    if (previousPointsPerHour) {
      const change = pointsPerHour - previousPointsPerHour;
      const changePercent =
        previousPointsPerHour > 0 ? (change / previousPointsPerHour) * 100 : 0;
      return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
    }

    // Compare against benchmark
    const benchmarkDiff =
      ((pointsPerHour - benchmarkPointsPerHour) / benchmarkPointsPerHour) * 100;
    return `${benchmarkDiff > 0 ? "+" : ""}${benchmarkDiff.toFixed(1)}%`;
  };

  const getTrendLabel = (): string => {
    if (previousPointsPerHour) {
      return "vs previous period";
    }
    return "vs benchmark";
  };

  const getEfficiencyLevel = (): string => {
    if (pointsPerHour >= 0.4) return "Exceptional";
    if (pointsPerHour >= 0.3) return "Excellent";
    if (pointsPerHour >= 0.2) return "Good";
    if (pointsPerHour >= 0.15) return "Fair";
    return "Needs Improvement";
  };

  const getSubtitle = (): string => {
    const level = getEfficiencyLevel();
    return `Team efficiency metric (${level})`;
  };

  return (
    <MetricsCard
      title="Points per Hour"
      value={pointsPerHour}
      subtitle={getSubtitle()}
      trend={
        pointsPerHour > 0
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
      valueFormatter={formatEfficiency}
    />
  );
}
