"use client";

import React, { useState, useEffect } from "react";
import { AppConfig } from "@/lib/types";

interface SettingsFormProps {
  config: AppConfig;
  onConfigUpdate: (config: AppConfig) => Promise<void>;
}

interface ValidationErrors {
  velocityCalculationSprints?: string;
  defaultMeetingPercentage?: string;
}

export default function SettingsForm({
  config,
  onConfigUpdate,
}: SettingsFormProps) {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Update form data when config prop changes
  useEffect(() => {
    setFormData(config);
    setIsDirty(false);
  }, [config]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate velocity calculation sprints
    if (
      !formData.velocityCalculationSprints ||
      formData.velocityCalculationSprints < 1 ||
      formData.velocityCalculationSprints > 20
    ) {
      newErrors.velocityCalculationSprints =
        "Must be a number between 1 and 20";
    }

    // Validate default meeting percentage
    if (
      formData.defaultMeetingPercentage < 0 ||
      formData.defaultMeetingPercentage > 100
    ) {
      newErrors.defaultMeetingPercentage = "Must be a number between 0 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof AppConfig, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setIsDirty(true);
    setSuccessMessage(null);

    // Clear specific field error when user starts typing
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfigUpdate(formData);
      setSuccessMessage("Settings saved successfully!");
      setIsDirty(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      // Error handling is done by parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(config);
    setErrors({});
    setIsDirty(false);
    setSuccessMessage(null);
  };

  const handleResetToDefaults = () => {
    const defaultConfig: AppConfig = {
      velocityCalculationSprints: 6,
      defaultMeetingPercentage: 20,
      teamMembers: formData.teamMembers, // Keep existing team members
    };
    setFormData(defaultConfig);
    setIsDirty(true);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-3"
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
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Velocity Calculation Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-blue-600 mr-2"
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
            Velocity Calculation Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="velocityPeriod"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Number of sprints for velocity calculation
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  id="velocityPeriod"
                  min="1"
                  max="20"
                  value={formData.velocityCalculationSprints}
                  onChange={(e) =>
                    handleInputChange(
                      "velocityCalculationSprints",
                      parseInt(e.target.value) || 1
                    )
                  }
                  className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.velocityCalculationSprints
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <span className="text-sm text-gray-700">
                  sprints (used for forecasting)
                </span>
              </div>
              {errors.velocityCalculationSprints && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.velocityCalculationSprints}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Higher values provide more stable forecasts but may be less
                responsive to recent changes. Recommended: 4-8 sprints.
              </p>
            </div>
          </div>
        </div>

        {/* Team Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <svg
              className="w-5 h-5 text-green-600 mr-2"
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
            Team Default Settings
          </h3>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="meetingPercentage"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Default meeting percentage
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="number"
                  id="meetingPercentage"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.defaultMeetingPercentage}
                  onChange={(e) =>
                    handleInputChange(
                      "defaultMeetingPercentage",
                      parseInt(e.target.value) || 0
                    )
                  }
                  className={`w-24 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.defaultMeetingPercentage
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <span className="text-sm text-gray-600">% of gross hours</span>
              </div>
              {errors.defaultMeetingPercentage && (
                <p className="text-red-600 text-xs mt-1">
                  {errors.defaultMeetingPercentage}
                </p>
              )}
              <p className="text-xs text-gray-600 mt-1">
                Default percentage of gross hours allocated to meetings for new
                team members. Typical range: 15-25%.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={handleResetToDefaults}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              Reset to Defaults
            </button>
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Cancel Changes
              </button>
            )}
          </div>

          <div className="flex space-x-3 w-full sm:w-auto">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isSubmitting || !isDirty
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-800 mb-1">
              About These Settings
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>
                • Changes to velocity calculation period will affect future
                forecasts immediately
              </li>
              <li>
                • Meeting percentage changes only apply to new team members or
                when recalculating existing members
              </li>
              <li>
                • Historical sprint data is not automatically recalculated when
                settings change
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Current Configuration Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">
              Velocity Calculation Period:
            </span>
            <span className="text-gray-600">
              {formData.velocityCalculationSprints} sprints
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">
              Default Meeting %:
            </span>
            <span className="text-gray-600">
              {formData.defaultMeetingPercentage}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Team Members:</span>
            <span className="text-gray-600">
              {formData.teamMembers.length} configured
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-gray-700">Data Storage:</span>
            <span className="text-gray-600">Local JSON Files</span>
          </div>
        </div>
      </div>
    </div>
  );
}
