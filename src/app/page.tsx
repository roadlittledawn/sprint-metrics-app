"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import DashboardMetrics from "@/components/DashboardMetrics";
import VelocityTrendChart from "@/components/charts/VelocityTrendChartSimple";
import SprintComparisonCharts from "@/components/charts/SprintComparisonChartsSimple";
import { Sprint, ApiResponse } from "@/lib/types";

export default function Home() {
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-red-800 font-medium mb-2">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={fetchSprints}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition-colors"
              >
                Retry
              </button>
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm text-center transition-colors"
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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Sprint Dashboard
              </h1>
              <p className="text-gray-700 mt-1 text-sm sm:text-base">
                Track your team&apos;s sprint performance and metrics
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Link
                href="/admin"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm sm:text-base"
              >
                Admin Panel
              </Link>
              <Link
                href="/dashboard"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center text-sm sm:text-base"
              >
                Legacy Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Metrics Cards */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Key Metrics
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 animate-pulse"
                  >
                    <div className="h-4 bg-gray-200 rounded mb-2 w-2/3"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <DashboardMetrics />
            )}
          </section>

          {/* Charts Section */}
          <section>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
              Performance Charts
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-1/3"></div>
                  <div className="h-48 sm:h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-8">
                {/* Velocity Trend Chart */}
                <VelocityTrendChart
                  sprints={sprints}
                  height={300}
                  className="col-span-1"
                />

                {/* Sprint Comparison Charts */}
                <SprintComparisonCharts
                  sprints={sprints}
                  height={300}
                  className="col-span-1"
                />
              </div>
            )}
          </section>

          {/* Full Width Chart Section */}
          {!isLoading && sprints.length > 0 && (
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                Detailed Analysis
              </h2>
              <div className="overflow-x-auto">
                <SprintComparisonCharts
                  sprints={sprints}
                  height={400}
                  defaultTimeRange={18}
                  className="w-full min-w-[600px]"
                />
              </div>
            </section>
          )}

          {/* Empty State */}
          {!isLoading && sprints.length === 0 && (
            <section className="text-center py-8 sm:py-12">
              <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-500 mb-4"
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
                <p className="text-gray-700 mb-6 text-sm sm:text-base">
                  Get started by adding your first sprint in the admin panel.
                </p>
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
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

          {/* Quick Actions */}
          {!isLoading && sprints.length > 0 && (
            <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Link
                  href="/admin"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base text-center"
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
                  Add New Sprint
                </Link>
                <button
                  onClick={fetchSprints}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
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
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh Data
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-8 sm:mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-sm text-gray-600 text-center">
            © 2024 Sprint Data Tracker. Built with Next.js and Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
