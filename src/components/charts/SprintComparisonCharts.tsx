"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { Sprint } from "@/lib/types";

interface SprintComparisonChartsProps {
  sprints: Sprint[];
  className?: string;
  height?: number;
  timeRangeOptions?: number[];
  defaultTimeRange?: number;
}

interface PlannedVsActualData {
  sprintName: string;
  plannedPoints: number;
  actualPoints: number;
  completionRate: number;
}

interface CapacityUtilizationData {
  sprintName: string;
  capacityUtilization: number;
  velocity: number;
  workingHours: number;
}

interface BurndownData {
  sprintName: string;
  totalPoints: number;
  completedPoints: number;
  remainingPoints: number;
  percentComplete: number;
}

export default function SprintComparisonCharts({
  sprints,
  className = "",
  height = 400,
  timeRangeOptions = [6, 12, 18, 24],
  defaultTimeRange = 12,
}: SprintComparisonChartsProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeRange);
  const [activeChart, setActiveChart] = useState<
    "planned-vs-actual" | "capacity" | "burndown"
  >("planned-vs-actual");

  // Process sprint data for different chart types
  const chartData = useMemo(() => {
    if (!sprints || sprints.length === 0)
      return { plannedVsActual: [], capacity: [], burndown: [] };

    // Sort sprints by creation date and take the selected time range
    const sortedSprints = [...sprints]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-selectedTimeRange);

    // Planned vs Actual data
    const plannedVsActual: PlannedVsActualData[] = sortedSprints.map(
      (sprint) => ({
        sprintName: sprint.sprintName,
        plannedPoints: sprint.plannedPoints,
        actualPoints: sprint.pointsCompleted,
        completionRate: sprint.percentComplete,
      })
    );

    // Capacity utilization data
    const capacity: CapacityUtilizationData[] = sortedSprints.map((sprint) => {
      // Calculate capacity utilization as percentage of planned vs actual
      const capacityUtilization =
        sprint.plannedPoints > 0
          ? (sprint.pointsCompleted / sprint.plannedPoints) * 100
          : 0;

      return {
        sprintName: sprint.sprintName,
        capacityUtilization: Math.min(capacityUtilization, 150), // Cap at 150% for chart readability
        velocity: sprint.velocity,
        workingHours: sprint.workingHours,
        targetLine: 100, // Reference line at 100%
      };
    });

    // Burndown-style data (current sprint focus)
    const burndown: BurndownData[] = sortedSprints.map((sprint) => ({
      sprintName: sprint.sprintName,
      totalPoints: sprint.plannedPoints,
      completedPoints: sprint.pointsCompleted,
      remainingPoints: Math.max(
        0,
        sprint.plannedPoints - sprint.pointsCompleted
      ),
      percentComplete: sprint.percentComplete,
    }));

    return { plannedVsActual, capacity, burndown };
  }, [sprints, selectedTimeRange]);

  // Custom tooltip components
  const PlannedVsActualTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-blue-600">
            {`Planned: ${data?.plannedPoints?.toFixed(1)} pts`}
          </p>
          <p className="text-green-600">
            {`Actual: ${data?.actualPoints?.toFixed(1)} pts`}
          </p>
          <p className="text-purple-600">
            {`Completion: ${data?.completionRate?.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const CapacityTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-orange-600">
            {`Capacity Utilization: ${data?.capacityUtilization?.toFixed(1)}%`}
          </p>
          <p className="text-blue-600">
            {`Velocity: ${data?.velocity?.toFixed(3)} pts/hr`}
          </p>
          <p className="text-gray-600">
            {`Working Hours: ${data?.workingHours} hrs`}
          </p>
        </div>
      );
    }
    return null;
  };

  const BurndownTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: any[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-blue-600">
            {`Total Points: ${data?.totalPoints?.toFixed(1)} pts`}
          </p>
          <p className="text-green-600">
            {`Completed: ${data?.completedPoints?.toFixed(1)} pts`}
          </p>
          <p className="text-red-600">
            {`Remaining: ${data?.remainingPoints?.toFixed(1)} pts`}
          </p>
          <p className="text-purple-600">
            {`Progress: ${data?.percentComplete?.toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty state
  if (!sprints || sprints.length === 0) {
    return (
      <div
        className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Sprint Comparison
          </h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No sprint data available</p>
            <p className="text-sm">Add sprint data to see comparisons</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}
    >
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h3 className="text-lg font-medium text-gray-900">Sprint Comparison</h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Chart type selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="chartType" className="text-sm text-gray-600">
              Chart:
            </label>
            <select
              id="chartType"
              value={activeChart}
              onChange={(e) => setActiveChart(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="planned-vs-actual">Planned vs Actual</option>
              <option value="capacity">Capacity Utilization</option>
              <option value="burndown">Sprint Progress</option>
            </select>
          </div>

          {/* Time range selector */}
          <div className="flex items-center space-x-2">
            <label htmlFor="timeRange" className="text-sm text-gray-600">
              Show last:
            </label>
            <select
              id="timeRange"
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {timeRangeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} sprints
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === "planned-vs-actual" && (
            <BarChart
              data={chartData.plannedVsActual}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="sprintName"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Story Points",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<PlannedVsActualTooltip />} />
              <Legend />
              <Bar
                dataKey="plannedPoints"
                fill="#3b82f6"
                name="Planned Points"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="actualPoints"
                fill="#10b981"
                name="Actual Points"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          )}

          {activeChart === "capacity" && (
            <LineChart
              data={chartData.capacity}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="sprintName"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Capacity Utilization (%)",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<CapacityTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="capacityUtilization"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ fill: "#f97316", strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: "#f97316", strokeWidth: 2 }}
                name="Capacity Utilization"
              />
              {/* Reference line at 100% */}
              <Line
                type="monotone"
                dataKey="targetLine"
                stroke="#6b7280"
                strokeDasharray="5 5"
                strokeWidth={1}
                dot={false}
                name="Target (100%)"
              />
            </LineChart>
          )}

          {activeChart === "burndown" && (
            <AreaChart
              data={chartData.burndown}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="sprintName"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
              />
              <YAxis
                tick={{ fontSize: 12 }}
                label={{
                  value: "Story Points",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip content={<BurndownTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="completedPoints"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.6}
                name="Completed Points"
              />
              <Area
                type="monotone"
                dataKey="remainingPoints"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
                name="Remaining Points"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Chart insights */}
      {chartData.plannedVsActual.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {activeChart === "planned-vs-actual" && (
              <>
                <div>
                  <span className="font-medium text-gray-700">
                    Avg Completion Rate:
                  </span>
                  <span className="ml-2 text-green-600">
                    {(
                      chartData.plannedVsActual.reduce(
                        (sum, d) => sum + d.completionRate,
                        0
                      ) / chartData.plannedVsActual.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Best Sprint:
                  </span>
                  <span className="ml-2 text-blue-600">
                    {
                      chartData.plannedVsActual.reduce((best, current) =>
                        current.completionRate > best.completionRate
                          ? current
                          : best
                      ).sprintName
                    }
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Sprints Shown:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {chartData.plannedVsActual.length} of {sprints.length}
                  </span>
                </div>
              </>
            )}

            {activeChart === "capacity" && (
              <>
                <div>
                  <span className="font-medium text-gray-700">
                    Avg Utilization:
                  </span>
                  <span className="ml-2 text-orange-600">
                    {(
                      chartData.capacity.reduce(
                        (sum, d) => sum + d.capacityUtilization,
                        0
                      ) / chartData.capacity.length
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Target Range:
                  </span>
                  <span className="ml-2 text-gray-600">80-100%</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Sprints Shown:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {chartData.capacity.length} of {sprints.length}
                  </span>
                </div>
              </>
            )}

            {activeChart === "burndown" && (
              <>
                <div>
                  <span className="font-medium text-gray-700">
                    Latest Sprint:
                  </span>
                  <span className="ml-2 text-blue-600">
                    {chartData.burndown[chartData.burndown.length - 1]
                      ?.sprintName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Latest Progress:
                  </span>
                  <span className="ml-2 text-green-600">
                    {chartData.burndown[
                      chartData.burndown.length - 1
                    ]?.percentComplete.toFixed(1) || "0"}
                    %
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">
                    Sprints Shown:
                  </span>
                  <span className="ml-2 text-gray-600">
                    {chartData.burndown.length} of {sprints.length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
