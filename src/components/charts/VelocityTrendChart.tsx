"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Sprint } from "@/lib/types";

// Dynamically import the client component to avoid SSR issues
const VelocityTrendChartClient = dynamic(
  () => import("./VelocityTrendChartClient"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Velocity Trend</h3>
        </div>
        <div className="flex items-center justify-center h-64 text-gray-700">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2 w-32 mx-auto"></div>
              <div className="h-3 bg-gray-200 rounded w-24 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

interface VelocityTrendChartProps {
  sprints: Sprint[];
  className?: string;
  height?: number;
  timeRangeOptions?: number[];
  defaultTimeRange?: number;
}

export default function VelocityTrendChart({
  sprints,
  className = "",
  height = 400,
  timeRangeOptions = [6, 12, 18, 24],
  defaultTimeRange = 12,
}: VelocityTrendChartProps) {
  return (
    <VelocityTrendChartClient
      sprints={sprints}
      className={className}
      height={height}
      timeRangeOptions={timeRangeOptions}
      defaultTimeRange={defaultTimeRange}
    />
  );
}
