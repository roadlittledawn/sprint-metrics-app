"use client";

import React from "react";
import { Sprint } from "@/lib/types";

interface VelocityTrendChartProps {
  sprints: Sprint[];
  className?: string;
  height?: number;
  timeRangeOptions?: number[];
  defaultTimeRange?: number;
}

export default function VelocityTrendChartSimple({
  sprints,
  className = "",
  height = 400,
}: VelocityTrendChartProps) {
  return (
    <div
      className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Velocity Trend</h3>
      </div>

      {!sprints || sprints.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-700">
          <div className="text-center">
            <p className="text-lg mb-2">No sprint data available</p>
            <p className="text-sm">Add sprint data to see velocity trends</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-700">
          <div className="text-center">
            <p className="text-lg mb-2">Velocity Trend Chart</p>
            <p className="text-sm">Tracking {sprints.length} sprints</p>
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900">
                  Current Velocity
                </div>
                <div className="text-xl font-bold text-blue-600">
                  {sprints.length > 0
                    ? sprints[sprints.length - 1].velocity.toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-medium text-green-900">Avg Velocity</div>
                <div className="text-xl font-bold text-green-600">
                  {sprints.length > 0
                    ? (
                        sprints.reduce((sum, s) => sum + s.velocity, 0) /
                        sprints.length
                      ).toFixed(2)
                    : "0.00"}
                </div>
              </div>
              <div className="bg-purple-50 p-3 rounded">
                <div className="font-medium text-purple-900">Total Points</div>
                <div className="text-xl font-bold text-purple-600">
                  {sprints.reduce((sum, s) => sum + s.pointsCompleted, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
