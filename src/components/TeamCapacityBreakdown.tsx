"use client";

import React from "react";
import { TeamMember } from "@/lib/types";
import { calculateWorkingHours } from "@/lib/calculations";

interface TeamCapacityBreakdownProps {
  teamMembers: TeamMember[];
  defaultMeetingPercentage: number;
  title?: string;
  showDetails?: boolean;
}

export default function TeamCapacityBreakdown({
  teamMembers,
  defaultMeetingPercentage,
  title = "Team Capacity Breakdown",
  showDetails = true,
}: TeamCapacityBreakdownProps) {
  const totalWorkingHours = calculateWorkingHours(
    teamMembers,
    defaultMeetingPercentage
  );
  const totalGrossHours = teamMembers.reduce(
    (sum, member) => sum + member.totalGrossHours,
    0
  );
  const totalOnCallHours = teamMembers.reduce(
    (sum, member) => sum + member.onCallHours,
    0
  );
  const totalMeetingHours = teamMembers.reduce(
    (sum, member) => sum + member.meetingHours,
    0
  );
  const totalTimeOffHours = teamMembers.reduce(
    (sum, member) => sum + member.timeOffHours,
    0
  );

  if (teamMembers.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium text-gray-900 mb-2">{title}</h4>
        <p className="text-gray-600 text-sm">No team members configured</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-4">{title}</h4>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded-md text-center">
          <div className="text-2xl font-bold text-blue-600">
            {teamMembers.length}
          </div>
          <div className="text-sm text-blue-800">Team Members</div>
        </div>
        <div className="bg-green-50 p-3 rounded-md text-center">
          <div className="text-2xl font-bold text-green-600">
            {totalWorkingHours.toFixed(1)}h
          </div>
          <div className="text-sm text-green-800">Net Hours</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-md text-center">
          <div className="text-2xl font-bold text-gray-600">
            {totalGrossHours.toFixed(1)}h
          </div>
          <div className="text-sm text-gray-800">Gross Hours</div>
        </div>
        <div className="bg-purple-50 p-3 rounded-md text-center">
          <div className="text-2xl font-bold text-purple-600">
            {totalGrossHours > 0
              ? ((totalWorkingHours / totalGrossHours) * 100).toFixed(1)
              : 0}
            %
          </div>
          <div className="text-sm text-purple-800">Efficiency</div>
        </div>
      </div>

      {/* Hours Breakdown Chart */}
      <div className="mb-6">
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          Hours Allocation
        </h5>
        <div className="relative bg-gray-200 rounded-full h-6">
          {totalGrossHours > 0 && (
            <>
              <div
                className="absolute top-0 left-0 h-6 bg-green-500 rounded-l-full"
                style={{
                  width: `${(totalWorkingHours / totalGrossHours) * 100}%`,
                }}
                title={`Net Working Hours: ${totalWorkingHours.toFixed(1)}h`}
              />
              <div
                className="absolute top-0 h-6 bg-red-400"
                style={{
                  left: `${(totalWorkingHours / totalGrossHours) * 100}%`,
                  width: `${(totalOnCallHours / totalGrossHours) * 100}%`,
                }}
                title={`On-Call Hours: ${totalOnCallHours.toFixed(1)}h`}
              />
              <div
                className="absolute top-0 h-6 bg-yellow-400"
                style={{
                  left: `${
                    ((totalWorkingHours + totalOnCallHours) / totalGrossHours) *
                    100
                  }%`,
                  width: `${(totalMeetingHours / totalGrossHours) * 100}%`,
                }}
                title={`Meeting Hours: ${totalMeetingHours.toFixed(1)}h`}
              />
              <div
                className="absolute top-0 h-6 bg-blue-400 rounded-r-full"
                style={{
                  left: `${
                    ((totalWorkingHours +
                      totalOnCallHours +
                      totalMeetingHours) /
                      totalGrossHours) *
                    100
                  }%`,
                  width: `${(totalTimeOffHours / totalGrossHours) * 100}%`,
                }}
                title={`Time Off Hours: ${totalTimeOffHours.toFixed(1)}h`}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            Net ({totalWorkingHours.toFixed(1)}h)
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-1"></div>
            On-Call ({totalOnCallHours.toFixed(1)}h)
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-400 rounded mr-1"></div>
            Meetings ({totalMeetingHours.toFixed(1)}h)
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded mr-1"></div>
            Time Off ({totalTimeOffHours.toFixed(1)}h)
          </div>
        </div>
      </div>

      {/* Detailed Member Breakdown */}
      {showDetails && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">
            Individual Breakdown
          </h5>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Gross
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    On-Call
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Meetings
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Time Off
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Net
                  </th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member, index) => {
                  const efficiency =
                    member.totalGrossHours > 0
                      ? (member.netHours / member.totalGrossHours) * 100
                      : 0;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900">
                        {member.name}
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {member.totalGrossHours.toFixed(1)}h
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {member.onCallHours.toFixed(1)}h
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {member.meetingHours.toFixed(1)}h
                      </td>
                      <td className="px-3 py-2 text-right text-gray-600">
                        {member.timeOffHours.toFixed(1)}h
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-blue-600">
                        {member.netHours.toFixed(1)}h
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`font-medium ${
                            efficiency >= 70
                              ? "text-green-600"
                              : efficiency >= 50
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {efficiency.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
