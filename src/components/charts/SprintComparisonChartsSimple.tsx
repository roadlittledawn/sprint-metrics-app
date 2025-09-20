"use client";

import React from "react";
import { Sprint } from "@/lib/types";

interface SprintComparisonChartsProps {
  sprints: Sprint[];
  className?: string;
  height?: number;
  timeRangeOptions?: number[];
  defaultTimeRange?: number;
}

export default function SprintComparisonChartsSimple({
  sprints,
  className = "",
  height = 400,
}: SprintComparisonChartsProps) {
  return (
    <div
      className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sprint Comparison</h3>
      </div>

      {!sprints || sprints.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-700">
          <div className="text-center">
            <p className="text-lg mb-2">No sprint data available</p>
            <p className="text-sm">Add sprint data to see comparisons</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-700">
          <div className="text-center">
            <p className="text-lg mb-2">Chart Component</p>
            <p className="text-sm">Showing {sprints.length} sprints</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50 p-3 rounded">
                <div className="font-medium text-blue-900">Total Sprints</div>
                <div className="text-2xl font-bold text-blue-600">
                  {sprints.length}
                </div>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <div className="font-medium text-green-900">Avg Completion</div>
                <div className="text-2xl font-bold text-green-600">
                  {sprints.length > 0
                    ? Math.round(
                        sprints.reduce((sum, s) => sum + s.percentComplete, 0) /
                          sprints.length
                      )
                    : 0}
                  %
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
