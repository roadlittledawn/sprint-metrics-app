"use client";

import React from "react";
import MetricsCard, { TrendDirection } from "../MetricsCard";

interface ForecastedCapacityCardProps {
  forecastedCapacity: number;
  currentSprintPlannedPoints?: number;
  confidence?: "low" | "medium" | "high";
  isLoading?: boolean;
  className?: string;
}

export default function ForecastedCapacityCard({
  forecastedCapacity,
  currentSprintPlannedPoints,
  confidence = "medium",
  isLoading = false,
  className = "",
}: ForecastedCapacityCardProps) {
  const formatCapacity = (value: number): string => {
    return `${value.toFixed(1)} pts`;
  };

  const getTrendDirection = (): TrendDirection => {
    if (!currentSprintPlannedPoints) {
      return "neutral";
    }

    const difference = forecastedCapacity - currentSprintPlannedPoints;
    const changePercent =
      currentSprintPlannedPoints > 0
        ? (difference / currentSprintPlannedPoints) * 100
        : 0;

    if (changePercent > 10) return "up";
    if (changePercent < -10) return "down";
    return "neutral";
  };

  const getTrendValue = (): string => {
    if (!currentSprintPlannedPoints) {
      return "N/A";
    }

    const difference = forecastedCapacity - currentSprintPlannedPoints;
    const changePercent =
      currentSprintPlannedPoints > 0
        ? (difference / currentSprintPlannedPoints) * 100
        : 0;

    if (Math.abs(changePercent) < 5) {
      return "Similar";
    }

    return `${changePercent > 0 ? "+" : ""}${changePercent.toFixed(1)}%`;
  };

  const getTrendLabel = (): string => {
    if (!currentSprintPlannedPoints) {
      return "no comparison available";
    }
    return "vs current sprint";
  };

  const getSubtitle = (): string => {
    const baseSubtitle = "Predicted points for next sprint";

    if (confidence === "low") {
      return `${baseSubtitle} (low confidence)`;
    } else if (confidence === "high") {
      return `${baseSubtitle} (high confidence)`;
    }

    return baseSubtitle;
  };

  return (
    <MetricsCard
      title="Forecasted Capacity"
      value={forecastedCapacity}
      subtitle={getSubtitle()}
      trend={
        forecastedCapacity > 0 && currentSprintPlannedPoints
          ? {
              direction: getTrendDirection(),
              value: getTrendValue(),
              label: getTrendLabel(),
            }
          : undefined
      }
      isLoading={isLoading}
      className={className}
      valueFormatter={formatCapacity}
    />
  );
}
