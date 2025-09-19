"use client";

import React, { useState, useEffect } from "react";
import { Sprint, SprintFormData, TeamMember, AppConfig } from "@/lib/types";
import {
  calculateWorkingHours,
  calculateSprintMetrics,
} from "@/lib/calculations";
import LoadingSpinner from "./ui/LoadingSpinner";
import ConfirmDialog from "./ui/ConfirmDialog";

interface SprintFormProps {
  sprint?: Sprint;
  config: AppConfig;
  onSave: (sprintData: Sprint) => void;
  onCancel: () => void;
}

export default function SprintForm({
  sprint,
  config,
  onSave,
  onCancel,
}: SprintFormProps) {
  const [formData, setFormData] = useState<SprintFormData>({
    sprintName: "",
    taskeiLink: "",
    businessDays: 10,
    numberOfPeople: config.teamMembers.length,
    totalPointsInSprint: 0,
    carryOverPointsTotal: 0,
    carryOverPointsCompleted: 0,
    unplannedPointsBroughtIn: 0,
    pointsCompleted: 0,
  });

  const [selectedTeamMembers, setSelectedTeamMembers] = useState<TeamMember[]>(
    config.teamMembers
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [calculatedWorkingHours, setCalculatedWorkingHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form data when sprint prop changes
  useEffect(() => {
    if (sprint) {
      setFormData({
        sprintName: sprint.sprintName,
        taskeiLink: sprint.taskeiLink || "",
        businessDays: sprint.businessDays,
        numberOfPeople: sprint.numberOfPeople,
        totalPointsInSprint: sprint.totalPointsInSprint,
        carryOverPointsTotal: sprint.carryOverPointsTotal,
        carryOverPointsCompleted: sprint.carryOverPointsCompleted,
        unplannedPointsBroughtIn: sprint.unplannedPointsBroughtIn,
        pointsCompleted: sprint.pointsCompleted,
      });
      // For editing, we'll use the current team configuration
      setSelectedTeamMembers(config.teamMembers);
    }
  }, [sprint, config.teamMembers]);

  // Calculate working hours whenever team selection changes
  useEffect(() => {
    const workingHours = calculateWorkingHours(
      selectedTeamMembers,
      config.defaultMeetingPercentage
    );
    setCalculatedWorkingHours(workingHours);
  }, [selectedTeamMembers, config.defaultMeetingPercentage]);

  // Calculate derived metrics for display
  const calculatedMetrics = calculateSprintMetrics({
    totalPointsInSprint: formData.totalPointsInSprint,
    carryOverPointsTotal: formData.carryOverPointsTotal,
    carryOverPointsCompleted: formData.carryOverPointsCompleted,
    totalCompletedPoints:
      formData.pointsCompleted + formData.carryOverPointsCompleted,
    workingHours: calculatedWorkingHours,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.sprintName.trim()) {
      newErrors.sprintName = "Sprint name is required";
    }

    if (formData.businessDays <= 0) {
      newErrors.businessDays = "Business days must be greater than 0";
    }

    if (formData.totalPointsInSprint < 0) {
      newErrors.totalPointsInSprint = "Total points cannot be negative";
    }

    if (formData.carryOverPointsTotal < 0) {
      newErrors.carryOverPointsTotal = "Carry over points cannot be negative";
    }

    if (formData.carryOverPointsCompleted < 0) {
      newErrors.carryOverPointsCompleted =
        "Carry over completed points cannot be negative";
    }

    if (formData.carryOverPointsCompleted > formData.carryOverPointsTotal) {
      newErrors.carryOverPointsCompleted =
        "Carry over completed cannot exceed carry over total";
    }

    if (formData.unplannedPointsBroughtIn < 0) {
      newErrors.unplannedPointsBroughtIn =
        "Unplanned points cannot be negative";
    }

    if (formData.pointsCompleted < 0) {
      newErrors.pointsCompleted = "Points completed cannot be negative";
    }

    if (selectedTeamMembers.length === 0) {
      newErrors.teamMembers = "At least one team member must be selected";
    }

    if (calculatedWorkingHours <= 0) {
      newErrors.workingHours =
        "Total working hours must be greater than 0. Check team member configurations.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        const sprintData: Sprint = {
          id: sprint?.id || `sprint-${Date.now()}`,
          sprintName: formData.sprintName,
          taskeiLink: formData.taskeiLink,
          businessDays: formData.businessDays,
          numberOfPeople: selectedTeamMembers.length,
          workingHours: calculatedWorkingHours,
          totalPointsInSprint: formData.totalPointsInSprint,
          carryOverPointsTotal: formData.carryOverPointsTotal,
          carryOverPointsCompleted: formData.carryOverPointsCompleted,
          newWorkPoints: calculatedMetrics.newWorkPoints,
          unplannedPointsBroughtIn: formData.unplannedPointsBroughtIn,
          pointsCompleted: calculatedMetrics.pointsCompleted,
          plannedPoints: calculatedMetrics.plannedPoints,
          percentComplete: calculatedMetrics.percentComplete,
          velocity: calculatedMetrics.velocity,
          predictedCapacity: 0, // This will be calculated separately based on historical data
          createdAt: sprint?.createdAt || now,
          updatedAt: now,
        };

        await onSave(sprintData);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Error saving sprint:", error);
        setErrors({ submit: "Failed to save sprint. Please try again." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (
    field: keyof SprintFormData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasUnsavedChanges(true);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      onCancel();
    }
  };

  const confirmCancel = () => {
    setShowCancelConfirm(false);
    setHasUnsavedChanges(false);
    onCancel();
  };

  const handleTeamMemberToggle = (member: TeamMember, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTeamMembers((prev) => [...prev, member]);
    } else {
      setSelectedTeamMembers((prev) =>
        prev.filter((m) => m.name !== member.name)
      );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {sprint ? "Edit Sprint" : "Add New Sprint"}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Sprint Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="sprintName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sprint Name *
            </label>
            <input
              type="text"
              id="sprintName"
              value={formData.sprintName}
              onChange={(e) => handleInputChange("sprintName", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sprintName ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Sprint 24.1"
            />
            {errors.sprintName && (
              <p className="mt-1 text-sm text-red-600">{errors.sprintName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="taskeiLink"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Taskei Link
            </label>
            <input
              type="url"
              id="taskeiLink"
              value={formData.taskeiLink}
              onChange={(e) => handleInputChange("taskeiLink", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://taskei.com/sprint/..."
            />
          </div>

          <div>
            <label
              htmlFor="businessDays"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Business Days *
            </label>
            <input
              type="number"
              id="businessDays"
              value={formData.businessDays}
              onChange={(e) =>
                handleInputChange("businessDays", parseInt(e.target.value) || 0)
              }
              min="1"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.businessDays ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.businessDays && (
              <p className="mt-1 text-sm text-red-600">{errors.businessDays}</p>
            )}
          </div>
        </div>

        {/* Team Member Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Members for this Sprint *
          </label>
          {config.teamMembers.length === 0 ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-yellow-800">
                No team members configured. Please add team members in the team
                management section first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
              {config.teamMembers.map((member, index) => {
                const isSelected = selectedTeamMembers.some(
                  (m) => m.name === member.name
                );
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`member-${index}`}
                        checked={isSelected}
                        onChange={(e) =>
                          handleTeamMemberToggle(member, e.target.checked)
                        }
                        className="mr-2"
                      />
                      <label
                        htmlFor={`member-${index}`}
                        className="text-sm font-medium"
                      >
                        {member.name}
                      </label>
                    </div>
                    <div className="text-sm text-gray-600">
                      {member.netHours.toFixed(1)}h net
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {errors.teamMembers && (
            <p className="mt-1 text-sm text-red-600">{errors.teamMembers}</p>
          )}
        </div>

        {/* Working Hours Display */}
        <div className="bg-blue-50 p-4 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">
            Team Capacity Summary
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Selected Team Members:</span>
              <span className="font-bold ml-2">
                {selectedTeamMembers.length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Total Working Hours:</span>
              <span className="font-bold ml-2">
                {calculatedWorkingHours.toFixed(1)}h
              </span>
            </div>
          </div>
          {errors.workingHours && (
            <p className="mt-2 text-sm text-red-600">{errors.workingHours}</p>
          )}
        </div>

        {/* Sprint Points Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="totalPointsInSprint"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Total Points in Sprint *
            </label>
            <input
              type="number"
              id="totalPointsInSprint"
              value={formData.totalPointsInSprint}
              onChange={(e) =>
                handleInputChange(
                  "totalPointsInSprint",
                  parseFloat(e.target.value) || 0
                )
              }
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.totalPointsInSprint
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.totalPointsInSprint && (
              <p className="mt-1 text-sm text-red-600">
                {errors.totalPointsInSprint}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="carryOverPointsTotal"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Carry Over Points (Total)
            </label>
            <input
              type="number"
              id="carryOverPointsTotal"
              value={formData.carryOverPointsTotal}
              onChange={(e) =>
                handleInputChange(
                  "carryOverPointsTotal",
                  parseFloat(e.target.value) || 0
                )
              }
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.carryOverPointsTotal
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.carryOverPointsTotal && (
              <p className="mt-1 text-sm text-red-600">
                {errors.carryOverPointsTotal}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="carryOverPointsCompleted"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Carry Over Points Completed
            </label>
            <input
              type="number"
              id="carryOverPointsCompleted"
              value={formData.carryOverPointsCompleted}
              onChange={(e) =>
                handleInputChange(
                  "carryOverPointsCompleted",
                  parseFloat(e.target.value) || 0
                )
              }
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.carryOverPointsCompleted
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.carryOverPointsCompleted && (
              <p className="mt-1 text-sm text-red-600">
                {errors.carryOverPointsCompleted}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="unplannedPointsBroughtIn"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Unplanned Points Brought In
            </label>
            <input
              type="number"
              id="unplannedPointsBroughtIn"
              value={formData.unplannedPointsBroughtIn}
              onChange={(e) =>
                handleInputChange(
                  "unplannedPointsBroughtIn",
                  parseFloat(e.target.value) || 0
                )
              }
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.unplannedPointsBroughtIn
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />
            {errors.unplannedPointsBroughtIn && (
              <p className="mt-1 text-sm text-red-600">
                {errors.unplannedPointsBroughtIn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="pointsCompleted"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Points Completed (New Work) *
            </label>
            <input
              type="number"
              id="pointsCompleted"
              value={formData.pointsCompleted}
              onChange={(e) =>
                handleInputChange(
                  "pointsCompleted",
                  parseFloat(e.target.value) || 0
                )
              }
              min="0"
              step="0.5"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.pointsCompleted ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.pointsCompleted && (
              <p className="mt-1 text-sm text-red-600">
                {errors.pointsCompleted}
              </p>
            )}
          </div>
        </div>

        {/* Calculated Metrics Display */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium text-gray-900 mb-3">Calculated Metrics</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Planned Points:</span>
              <div className="font-bold text-lg">
                {calculatedMetrics.plannedPoints.toFixed(1)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">New Work Points:</span>
              <div className="font-bold text-lg">
                {calculatedMetrics.newWorkPoints.toFixed(1)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Percent Complete:</span>
              <div className="font-bold text-lg">
                {calculatedMetrics.percentComplete.toFixed(1)}%
              </div>
            </div>
            <div>
              <span className="text-gray-600">Velocity:</span>
              <div className="font-bold text-lg">
                {calculatedMetrics.velocity.toFixed(3)} pts/hr
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {sprint ? "Updating..." : "Saving..."}
              </>
            ) : sprint ? (
              "Update Sprint"
            ) : (
              "Save Sprint"
            )}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        </div>

        {/* Error Display */}
        {errors.submit && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to cancel and lose your changes?"
        confirmText="Discard Changes"
        cancelText="Keep Editing"
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelConfirm(false)}
        variant="warning"
      />
    </div>
  );
}
