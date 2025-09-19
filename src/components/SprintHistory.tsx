"use client";

import React, { useState } from "react";
import { Sprint } from "@/lib/types";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";

interface SprintHistoryProps {
  sprints: Sprint[];
  onEdit: (sprint: Sprint) => void;
  onDelete: (sprintId: string) => void;
}

export default function SprintHistory({
  sprints,
  onEdit,
  onDelete,
}: SprintHistoryProps) {
  const [sortField, setSortField] = useState<keyof Sprint>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sort sprints
  const sortedSprints = [...sprints].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  // Filter sprints based on search term
  const filteredSprints = sortedSprints.filter((sprint) =>
    sprint.sprintName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (field: keyof Sprint) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDeleteClick = (sprintId: string) => {
    setDeleteConfirmId(sprintId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId) {
      onDelete(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getSortIcon = (field: keyof Sprint) => {
    if (sortField !== field) return "↕️";
    return sortDirection === "asc" ? "↑" : "↓";
  };

  if (sprints.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Sprint History</h3>
        <EmptyState
          icon="📈"
          title="No Sprint History"
          description="Start tracking your team's performance by creating your first sprint. You'll be able to view historical data and trends here."
          actionText="Create First Sprint"
          onAction={() => (window.location.href = "/admin")}
        />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Sprint History</h3>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Search sprints..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("sprintName")}
              >
                Sprint Name {getSortIcon("sprintName")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("businessDays")}
              >
                Days {getSortIcon("businessDays")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("numberOfPeople")}
              >
                Team {getSortIcon("numberOfPeople")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("workingHours")}
              >
                Hours {getSortIcon("workingHours")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("plannedPoints")}
              >
                Planned {getSortIcon("plannedPoints")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("pointsCompleted")}
              >
                Completed {getSortIcon("pointsCompleted")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("percentComplete")}
              >
                % Complete {getSortIcon("percentComplete")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("velocity")}
              >
                Velocity {getSortIcon("velocity")}
              </th>
              <th
                className="text-left py-2 px-3 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("updatedAt")}
              >
                Updated {getSortIcon("updatedAt")}
              </th>
              <th className="text-left py-2 px-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSprints.map((sprint) => (
              <tr
                key={sprint.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-2 px-3 font-medium">{sprint.sprintName}</td>
                <td className="py-2 px-3">{sprint.businessDays}</td>
                <td className="py-2 px-3">{sprint.numberOfPeople}</td>
                <td className="py-2 px-3">{sprint.workingHours.toFixed(1)}h</td>
                <td className="py-2 px-3">{sprint.plannedPoints.toFixed(1)}</td>
                <td className="py-2 px-3">
                  {sprint.pointsCompleted.toFixed(1)}
                </td>
                <td className="py-2 px-3">
                  {sprint.percentComplete.toFixed(1)}%
                </td>
                <td className="py-2 px-3">{sprint.velocity.toFixed(3)}</td>
                <td className="py-2 px-3">{formatDate(sprint.updatedAt)}</td>
                <td className="py-2 px-3">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(sprint)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(sprint.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSprints.length === 0 && searchTerm && (
        <div className="text-center py-4 text-gray-500">
          <p>No sprints found matching &quot;{searchTerm}&quot;</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Sprint"
        message="Are you sure you want to delete this sprint? This action cannot be undone and will permanently remove all sprint data."
        confirmText="Delete Sprint"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
  );
}
