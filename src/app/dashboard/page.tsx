"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardMetrics from "@/components/DashboardMetrics";
import {
  VelocityTrendChart,
  SprintComparisonCharts,
} from "@/components/charts";
import { Sprint, ApiResponse } from "@/lib/types";

export default function Dashboard() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/sprints");
      const result: ApiResponse<Sprint[]> = await response.json();

      if (result.success && result.data) {
        setSprints(result.data);
      } else {
        setError(result.error || "Failed to fetch sprints");
      }
    } catch (err) {
      setError("Failed to fetch sprints");
      console.error("Error fetching sprints:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="flex space-x-4">
              <button
                onClick={fetchSprints}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Go to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Sprint Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Track your team&apos;s sprint performance and metrics
              </p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Admin Panel
              </Link>
              <Link
                href="/"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Metrics Cards */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Key Metrics
            </h2>
            <DashboardMetrics />
          </section>

          {/* Charts Section */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Performance Charts
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Velocity Trend Chart */}
                <VelocityTrendChart
                  sprints={sprints}
                  height={350}
                  className="col-span-1"
                />

                {/* Sprint Comparison Charts */}
                <SprintComparisonCharts
                  sprints={sprints}
                  height={350}
                  className="col-span-1"
                />
              </div>
            )}
          </section>

          {/* Full Width Chart Section */}
          {!isLoading && sprints.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Detailed Analysis
              </h2>
              <SprintComparisonCharts
                sprints={sprints}
                height={450}
                defaultTimeRange={18}
                className="w-full"
              />
            </section>
          )}

          {/* Empty State */}
          {!isLoading && sprints.length === 0 && (
            <section className="text-center py-12">
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sprint Data Available
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first sprint in the admin panel.
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add Sprint Data
                </Link>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
