"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import SprintForm from "@/components/SprintForm";
import SprintHistory from "@/components/SprintHistory";
import TeamManagement from "@/components/TeamManagement";
import DataExportImport from "@/components/DataExportImport";
import SettingsForm from "@/components/SettingsForm";
import { Sprint, AppConfig, AppData } from "@/lib/types";

export default function AdminPage() {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "sprints" | "team" | "data" | "settings"
  >("sprints");
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null);
  const [showSprintForm, setShowSprintForm] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load sprints
      const sprintsResponse = await fetch("/api/sprints");
      if (!sprintsResponse.ok) {
        throw new Error("Failed to load sprints");
      }
      const sprintsData = await sprintsResponse.json();

      // Load config
      const configResponse = await fetch("/api/config");
      if (!configResponse.ok) {
        throw new Error("Failed to load configuration");
      }
      const configData = await configResponse.json();

      setAppData({
        sprints: sprintsData.data || [],
        config: configData.data || {
          velocityCalculationSprints: 6,
          teamMembers: [],
          defaultMeetingPercentage: 20,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSprint = async (sprintData: Sprint) => {
    try {
      const method = editingSprint ? "PUT" : "POST";
      const response = await fetch("/api/sprints", {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sprintData),
      });

      if (!response.ok) {
        throw new Error("Failed to save sprint");
      }

      // Reload data to get updated list
      await loadData();

      // Reset form state
      setEditingSprint(null);
      setShowSprintForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save sprint");
    }
  };

  const handleEditSprint = (sprint: Sprint) => {
    setEditingSprint(sprint);
    setShowSprintForm(true);
  };

  const handleDeleteSprint = async (sprintId: string) => {
    try {
      const response = await fetch(`/api/sprints?id=${sprintId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sprint");
      }

      // Reload data to get updated list
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete sprint");
    }
  };

  const handleCancelSprintForm = () => {
    setEditingSprint(null);
    setShowSprintForm(false);
  };

  const handleNewSprint = () => {
    setEditingSprint(null);
    setShowSprintForm(true);
  };

  const handleConfigUpdate = async (newConfig: AppConfig) => {
    try {
      const response = await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        throw new Error("Failed to update configuration");
      }

      // Reload data to get updated config
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update configuration"
      );
    }
  };

  const handleDataImport = async (importedData: AppData) => {
    try {
      // Update sprints
      const sprintsResponse = await fetch("/api/sprints", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sprints: importedData.sprints }),
      });

      if (!sprintsResponse.ok) {
        throw new Error("Failed to import sprints");
      }

      // Update config
      const configResponse = await fetch("/api/config", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importedData.config),
      });

      if (!configResponse.ok) {
        throw new Error("Failed to import configuration");
      }

      // Reload data to reflect changes
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import data");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="text-red-600 mb-4">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-lg font-semibold">Error Loading Admin Panel</p>
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={loadData}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
              <Link
                href="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-center"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!appData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Admin Panel
              </h1>
              <p className="text-gray-700 mt-1 text-sm sm:text-base">
                Manage your sprint data and team configuration
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <Link
                href="/"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center text-sm sm:text-base"
              >
                Dashboard
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Navigation Tabs */}
        <div className="mb-6 sm:mb-8">
          <nav className="flex flex-wrap gap-2 sm:gap-0 sm:space-x-8">
            <button
              onClick={() => setActiveTab("sprints")}
              className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm rounded-t-lg sm:rounded-none transition-colors ${
                activeTab === "sprints"
                  ? "border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent"
              }`}
            >
              <svg
                className="w-4 h-4 inline mr-2 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Sprint Management
            </button>
            <button
              onClick={() => setActiveTab("team")}
              className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm rounded-t-lg sm:rounded-none transition-colors ${
                activeTab === "team"
                  ? "border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent"
              }`}
            >
              <svg
                className="w-4 h-4 inline mr-2 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              Team Management
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm rounded-t-lg sm:rounded-none transition-colors ${
                activeTab === "data"
                  ? "border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent"
              }`}
            >
              <svg
                className="w-4 h-4 inline mr-2 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Data Management
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-2 px-3 sm:px-1 border-b-2 font-medium text-sm rounded-t-lg sm:rounded-none transition-colors ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600 bg-blue-50 sm:bg-transparent"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300 hover:bg-gray-50 sm:hover:bg-transparent"
              }`}
            >
              <svg
                className="w-4 h-4 inline mr-2 sm:hidden"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </button>
          </nav>
        </div>

        {/* Sprint Management Tab */}
        {activeTab === "sprints" && (
          <div className="space-y-6">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                {showSprintForm
                  ? editingSprint
                    ? "Edit Sprint"
                    : "Add New Sprint"
                  : "Sprint Management"}
              </h2>
              {!showSprintForm && (
                <button
                  onClick={handleNewSprint}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center justify-center"
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
                </button>
              )}
            </div>

            {/* Sprint Form */}
            {showSprintForm && (
              <SprintForm
                sprint={editingSprint || undefined}
                config={appData.config}
                onSave={handleSaveSprint}
                onCancel={handleCancelSprintForm}
              />
            )}

            {/* Sprint History */}
            {!showSprintForm && (
              <SprintHistory
                sprints={appData.sprints}
                onEdit={handleEditSprint}
                onDelete={handleDeleteSprint}
              />
            )}
          </div>
        )}

        {/* Team Management Tab */}
        {activeTab === "team" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Team Management
              </h2>
            </div>
            <TeamManagement
              config={appData.config}
              onConfigUpdate={handleConfigUpdate}
            />
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === "data" && (
          <div className="space-y-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Data Management
            </h2>
            <DataExportImport appData={appData} onImport={handleDataImport} />
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Application Settings
              </h2>
            </div>
            <SettingsForm
              config={appData.config}
              onConfigUpdate={handleConfigUpdate}
            />
          </div>
        )}

        {/* Quick Stats */}
        {!showSprintForm && (
          <div className="mt-6 sm:mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Stats
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-blue-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Total Sprints
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {appData.sprints.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-green-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Team Members
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {appData.config.teamMembers.length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-purple-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Avg Velocity
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {appData.sprints.length > 0
                        ? (
                            appData.sprints.reduce(
                              (sum, s) => sum + s.velocity,
                              0
                            ) / appData.sprints.length
                          ).toFixed(3)
                        : "0.000"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-orange-600 mr-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Avg Completion
                    </h3>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {appData.sprints.length > 0
                        ? (
                            appData.sprints.reduce(
                              (sum, s) => sum + s.percentComplete,
                              0
                            ) / appData.sprints.length
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
