"use client";

import React, { useState, useEffect } from "react";
import MetricsCard, { TrendDirection } from "./MetricsCard";
import LoadingSpinner from "./ui/LoadingSpinner";
import EmptyState from "./ui/EmptyState";
import { SprintMetrics, ApiResponse } from "@/lib/types";

interface DashboardMetricsProps {
  className?: string;
  timePeriod?: string;
}

export default function DashboardMetrics({
  className = "",
  timePeriod = "Last 6 sprints",
}: DashboardMetricsProps) {
  const [metrics, setMetrics] = useState<SprintMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/metrics");
      const result: ApiResponse<SprintMetrics> = await response.json();

      if (result.success && result.data) {
        setMetrics(result.data);
      } else {
        setError(result.error || "Failed to fetch metrics");
      }
    } catch (err) {
      setError("Failed to fetch metrics");
      console.error("Error fetching metrics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine trend direction based on value comparison
  const getTrendDirection = (
    current: number,
    threshold: number
  ): TrendDirection => {
    if (current > threshold) return "up";
    if (current < threshold) return "down";
    return "neutral";
  };

  // Helper function to format percentage values
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Helper function to format velocity values
  const formatVelocity = (value: number): string => {
    return `${value.toFixed(3)} pts/hr`;
  };

  // Helper function to format capacity values
  const formatCapacity = (value: number): string => {
    return `${value.toFixed(1)} pts`;
  };

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <LoadingSpinner size="lg" text="Loading dashboard metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}
      >
        <h3 className="text-red-800 font-medium mb-2">Error Loading Metrics</h3>
        <p className="text-red-600 text-sm">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metrics || metrics.totalSprints === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No Sprint Data Available"
        description="Get started by creating your first sprint to see dashboard metrics and insights."
        actionText="Create Your First Sprint"
        onAction={() => (window.location.href = "/admin")}
        className={className}
      />
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {/* Current Sprint Status Card */}
      <MetricsCard
        title="Current Sprint Status"
        value={metrics?.currentSprintStatus.sprintName || "No Sprint"}
        subtitle={
          metrics
            ? `${metrics.currentSprintStatus.pointsCompleted.toFixed(
                1
              )} of ${metrics.currentSprintStatus.plannedPoints.toFixed(
                1
              )} points completed`
            : undefined
        }
        trend={
          metrics && metrics.currentSprintStatus.percentComplete > 0
            ? {
                direction: getTrendDirection(
                  metrics.currentSprintStatus.percentComplete,
                  80
                ),
                value: formatPercentage(
                  metrics.currentSprintStatus.percentComplete
                ),
                label: "completion rate",
              }
            : undefined
        }
        isLoading={isLoading}
        valueFormatter={(val) =>
          typeof val === "string" ? val : `Sprint ${val}`
        }
        className="lg:col-span-1"
      />

      {/* Average Velocity Card */}
      <MetricsCard
        title="Average Velocity"
        value={metrics?.averageVelocity || 0}
        subtitle="Points completed per hour"
        trend={
          metrics && metrics.averageVelocity > 0
            ? {
                direction: getTrendDirection(metrics.averageVelocity, 0.2),
                value: metrics.averageVelocity > 0.2 ? "+Good" : "Low",
                label: "performance indicator",
              }
            : undefined
        }
        timePeriod={timePeriod}
        isLoading={isLoading}
        valueFormatter={formatVelocity}
      />

      {/* Forecasted Capacity Card */}
      <MetricsCard
        title="Forecasted Capacity"
        value={metrics?.forecastedCapacity || 0}
        subtitle="Predicted points for next sprint"
        trend={
          metrics && metrics.forecastedCapacity > 0
            ? {
                direction: getTrendDirection(
                  metrics.forecastedCapacity,
                  metrics.currentSprintStatus.plannedPoints
                ),
                value:
                  metrics.forecastedCapacity >
                  metrics.currentSprintStatus.plannedPoints
                    ? "Higher"
                    : "Lower",
                label: "vs current sprint",
              }
            : undefined
        }
        isLoading={isLoading}
        valueFormatter={formatCapacity}
      />

      {/* Capacity Utilization Card */}
      <MetricsCard
        title="Capacity Utilization"
        value={metrics?.capacityUtilization || 0}
        subtitle="Average team capacity usage"
        trend={
          metrics && metrics.capacityUtilization > 0
            ? {
                direction: getTrendDirection(metrics.capacityUtilization, 85),
                value: formatPercentage(
                  Math.abs(metrics.capacityUtilization - 85)
                ),
                label:
                  metrics.capacityUtilization > 85
                    ? "over target"
                    : "under target",
              }
            : undefined
        }
        timePeriod={timePeriod}
        isLoading={isLoading}
        valueFormatter={formatPercentage}
      />

      {/* Sprint Completion Rate Card */}
      <MetricsCard
        title="Sprint Completion Rate"
        value={metrics?.sprintCompletionRate || 0}
        subtitle="Average sprint completion percentage"
        trend={
          metrics && metrics.sprintCompletionRate > 0
            ? {
                direction: getTrendDirection(metrics.sprintCompletionRate, 90),
                value: formatPercentage(
                  Math.abs(metrics.sprintCompletionRate - 90)
                ),
                label:
                  metrics.sprintCompletionRate >= 90
                    ? "above target"
                    : "below target",
              }
            : undefined
        }
        timePeriod={timePeriod}
        isLoading={isLoading}
        valueFormatter={formatPercentage}
      />

      {/* Points per Hour Efficiency Card */}
      <MetricsCard
        title="Points per Hour"
        value={metrics?.pointsPerHour || 0}
        subtitle="Team efficiency metric"
        trend={
          metrics && metrics.pointsPerHour > 0
            ? {
                direction: getTrendDirection(metrics.pointsPerHour, 0.25),
                value: metrics.pointsPerHour.toFixed(3),
                label: "current efficiency",
              }
            : undefined
        }
        timePeriod={timePeriod}
        isLoading={isLoading}
        valueFormatter={formatVelocity}
      />
    </div>
  );
}
