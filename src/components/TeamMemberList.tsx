"use client";

import React, { useState } from "react";
import { TeamMember } from "@/lib/types";

interface TeamMemberListProps {
  teamMembers: TeamMember[];
  onEdit: (teamMember: TeamMember, index: number) => void;
  onDelete: (index: number) => void;
  onAdd: () => void;
}

export default function TeamMemberList({
  teamMembers,
  onEdit,
  onDelete,
  onAdd,
}: TeamMemberListProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const handleDeleteClick = (index: number) => {
    setDeleteConfirm(index);
  };

  const handleDeleteConfirm = (index: number) => {
    onDelete(index);
    setDeleteConfirm(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const totalNetHours = teamMembers.reduce(
    (sum, member) => sum + member.netHours,
    0
  );
  const totalGrossHours = teamMembers.reduce(
    (sum, member) => sum + member.totalGrossHours,
    0
  );

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
          <button
            onClick={onAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Team Member
          </button>
        </div>

        {teamMembers.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="font-medium text-blue-900">Total Team Capacity</p>
              <p className="text-blue-700">
                <span className="font-bold">{totalNetHours.toFixed(1)}</span>{" "}
                net hours
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-gray-900">Total Gross Hours</p>
              <p className="text-gray-700">
                <span className="font-bold">{totalGrossHours.toFixed(1)}</span>{" "}
                gross hours
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {teamMembers.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-600 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                />
              </svg>
            </div>
            <p className="text-gray-700 text-lg">No team members added yet</p>
            <p className="text-gray-600 text-sm mt-1">
              Add team members to start tracking sprint capacity
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Gross Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    On-Call
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Meetings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Time Off
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Net Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamMembers.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {member.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.totalGrossHours}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.onCallHours}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.meetingHours}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.timeOffHours}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {member.netHours.toFixed(1)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {deleteConfirm === index ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteConfirm(index)}
                            className="text-red-600 hover:text-red-900 bg-red-100 px-2 py-1 rounded text-xs"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={handleDeleteCancel}
                            className="text-gray-600 hover:text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => onEdit(member, index)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(index)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
