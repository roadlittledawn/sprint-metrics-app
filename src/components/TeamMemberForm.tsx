"use client";

import React, { useState, useEffect } from "react";
import { TeamMember } from "@/lib/types";

interface TeamMemberFormProps {
  teamMember?: TeamMember;
  onSave: (teamMember: TeamMember) => void;
  onCancel: () => void;
  defaultMeetingPercentage: number;
}

export default function TeamMemberForm({
  teamMember,
  onSave,
  onCancel,
  defaultMeetingPercentage,
}: TeamMemberFormProps) {
  const [formData, setFormData] = useState<TeamMember>({
    name: "",
    totalGrossHours: 40,
    onCallHours: 0,
    meetingHours: 0,
    timeOffHours: 0,
    netHours: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [useMeetingPercentage, setUseMeetingPercentage] = useState(true);

  // Initialize form data when teamMember prop changes
  useEffect(() => {
    if (teamMember) {
      setFormData(teamMember);
      // Check if meeting hours matches the default percentage
      const expectedMeetingHours =
        (teamMember.totalGrossHours * defaultMeetingPercentage) / 100;
      setUseMeetingPercentage(
        Math.abs(teamMember.meetingHours - expectedMeetingHours) < 0.01
      );
    } else {
      const defaultMeetingHours = (40 * defaultMeetingPercentage) / 100;
      setFormData({
        name: "",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: defaultMeetingHours,
        timeOffHours: 0,
        netHours: 40 - defaultMeetingHours,
      });
    }
  }, [teamMember, defaultMeetingPercentage]);

  // Calculate net hours whenever relevant fields change
  useEffect(() => {
    const meetingHours = useMeetingPercentage
      ? (formData.totalGrossHours * defaultMeetingPercentage) / 100
      : formData.meetingHours;

    const netHours = Math.max(
      0,
      formData.totalGrossHours -
        formData.onCallHours -
        meetingHours -
        formData.timeOffHours
    );

    setFormData((prev) => ({
      ...prev,
      meetingHours,
      netHours,
    }));
  }, [
    formData.totalGrossHours,
    formData.onCallHours,
    formData.timeOffHours,
    useMeetingPercentage,
    defaultMeetingPercentage,
  ]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.totalGrossHours <= 0) {
      newErrors.totalGrossHours = "Total gross hours must be greater than 0";
    }

    if (formData.onCallHours < 0) {
      newErrors.onCallHours = "On-call hours cannot be negative";
    }

    if (formData.onCallHours > formData.totalGrossHours) {
      newErrors.onCallHours = "On-call hours cannot exceed total gross hours";
    }

    if (!useMeetingPercentage && formData.meetingHours < 0) {
      newErrors.meetingHours = "Meeting hours cannot be negative";
    }

    if (formData.timeOffHours < 0) {
      newErrors.timeOffHours = "Time off hours cannot be negative";
    }

    const totalDeductions =
      formData.onCallHours + formData.meetingHours + formData.timeOffHours;
    if (totalDeductions > formData.totalGrossHours) {
      newErrors.general =
        "Total deductions (on-call + meetings + time off) cannot exceed total gross hours";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (
    field: keyof TeamMember,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">
        {teamMember ? "Edit Team Member" : "Add Team Member"}
      </h3>

      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter team member name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="totalGrossHours"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Total Gross Hours *
          </label>
          <input
            type="number"
            id="totalGrossHours"
            value={formData.totalGrossHours}
            onChange={(e) =>
              handleInputChange(
                "totalGrossHours",
                parseFloat(e.target.value) || 0
              )
            }
            min="0"
            step="0.5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.totalGrossHours ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.totalGrossHours && (
            <p className="mt-1 text-sm text-red-600">
              {errors.totalGrossHours}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="onCallHours"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            On-Call Hours
          </label>
          <input
            type="number"
            id="onCallHours"
            value={formData.onCallHours}
            onChange={(e) =>
              handleInputChange("onCallHours", parseFloat(e.target.value) || 0)
            }
            min="0"
            step="0.5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.onCallHours ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.onCallHours && (
            <p className="mt-1 text-sm text-red-600">{errors.onCallHours}</p>
          )}
        </div>

        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="useMeetingPercentage"
              checked={useMeetingPercentage}
              onChange={(e) => setUseMeetingPercentage(e.target.checked)}
              className="mr-2"
            />
            <label
              htmlFor="useMeetingPercentage"
              className="text-sm font-medium text-gray-700"
            >
              Use default meeting percentage ({defaultMeetingPercentage}%)
            </label>
          </div>

          {!useMeetingPercentage && (
            <>
              <label
                htmlFor="meetingHours"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meeting Hours
              </label>
              <input
                type="number"
                id="meetingHours"
                value={formData.meetingHours}
                onChange={(e) =>
                  handleInputChange(
                    "meetingHours",
                    parseFloat(e.target.value) || 0
                  )
                }
                min="0"
                step="0.5"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.meetingHours ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.meetingHours && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.meetingHours}
                </p>
              )}
            </>
          )}

          {useMeetingPercentage && (
            <p className="text-sm text-gray-700">
              Meeting hours: {formData.meetingHours.toFixed(1)} hours (
              {defaultMeetingPercentage}% of gross hours)
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="timeOffHours"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Time Off Hours
          </label>
          <input
            type="number"
            id="timeOffHours"
            value={formData.timeOffHours}
            onChange={(e) =>
              handleInputChange("timeOffHours", parseFloat(e.target.value) || 0)
            }
            min="0"
            step="0.5"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.timeOffHours ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.timeOffHours && (
            <p className="mt-1 text-sm text-red-600">{errors.timeOffHours}</p>
          )}
        </div>

        <div className="bg-gray-50 p-3 rounded-md">
          <p className="text-sm font-medium text-gray-700">
            Net Working Hours:{" "}
            <span className="font-bold text-blue-600">
              {formData.netHours.toFixed(1)}
            </span>
          </p>
          <p className="text-xs text-gray-700 mt-1">
            Calculated as: Total Gross Hours - On-Call Hours - Meeting Hours -
            Time Off Hours
          </p>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {teamMember ? "Update" : "Add"} Team Member
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
