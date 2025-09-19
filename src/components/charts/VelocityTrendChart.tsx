"use client";

import React, { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Sprint, VelocityTrendData } from "@/lib/types";
import { calculateAverageVelocity } from "@/lib/calculations";

interface VelocityTrendChartProps {
  sprints: Sprint[];
  className?: string;
  height?: number;
  timeRangeOptions?: number[];
  defaultTimeRange?: number;
}

interface ChartDataPoint extends VelocityTrendData {
  averageVelocity?: number;
}

export default function VelocityTrendChart({
  sprints,
  className = "",
  height = 400,
  timeRangeOptions = [6, 12, 18, 24],
  defaultTimeRange = 12,
}: VelocityTrendChartProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(defaultTimeRange);

  // Process sprint data for chart display
  const chartData = useMemo(() => {
    if (!sprints || sprints.length === 0) return [];

    // Sort sprints by creation date and take the selected time range
    const sortedSprints = [...sprints]
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .slice(-selectedTimeRange);

    // Calculate average velocity for trend line
    const averageVelocity = calculateAverageVelocity(
      sortedSprints,
      sortedSprints.length
    );

    // Transform data for chart
    const data: ChartDataPoint[] = sortedSprints.map((sprint) => ({
      sprintName: sprint.sprintName,
      velocity: sprint.velocity,
      date: new Date(sprint.createdAt).toLocaleDateString(),
      averageVelocity: averageVelocity,
    }));

    return data;
  }, [sprints, selectedTimeRange]);

  // Custom tooltip component
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: unknown[];
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-sm text-gray-600">{`Date: ${data?.date}`}</p>
          <p className="text-blue-600">
            {`Velocity: ${data?.velocity?.toFixed(3)} pts/hr`}
          </p>
          {data?.averageVelocity && (
            <p className="text-orange-600">
              {`Average: ${data?.averageVelocity?.toFixed(3)} pts/hr`}
            </p>
          )}
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
          <h3 className="text-lg font-medium text-gray-900">Velocity Trend</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No sprint data available</p>
            <p className="text-sm">Add sprint data to see velocity trends</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}
    >
      {/* Header with time range selector */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Velocity Trend</h3>
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

      {/* Chart */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
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
                value: "Velocity (pts/hr)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            {/* Velocity line */}
            <Line
              type="monotone"
              dataKey="velocity"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2 }}
              name="Sprint Velocity"
            />

            {/* Average velocity reference line */}
            {chartData.length > 0 && chartData[0].averageVelocity && (
              <ReferenceLine
                y={chartData[0].averageVelocity}
                stroke="#f97316"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{
                  value: `Avg: ${chartData[0].averageVelocity.toFixed(3)}`,
                  position: "topRight",
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart insights */}
      {chartData.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">
                Current Velocity:
              </span>
              <span className="ml-2 text-blue-600">
                {chartData[chartData.length - 1]?.velocity.toFixed(3)} pts/hr
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">
                Average Velocity:
              </span>
              <span className="ml-2 text-orange-600">
                {chartData[0]?.averageVelocity?.toFixed(3)} pts/hr
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Sprints Shown:</span>
              <span className="ml-2 text-gray-600">
                {chartData.length} of {sprints.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
