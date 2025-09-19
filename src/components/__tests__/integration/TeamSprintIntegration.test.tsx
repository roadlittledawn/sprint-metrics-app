import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppConfig, TeamMember } from "@/lib/types";
import {
  calculateWorkingHours,
  calculateSprintMetrics,
} from "@/lib/calculations";

// Mock components for integration testing
const MockSprintForm = ({ config, onSave }: any) => {
  const workingHours = calculateWorkingHours(
    config.teamMembers,
    config.defaultMeetingPercentage
  );

  const handleSubmit = () => {
    const sprintData = {
      totalPointsInSprint: 30,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      totalCompletedPoints: 28,
      workingHours,
    };

    const metrics = calculateSprintMetrics(sprintData);

    onSave({
      id: "test-sprint",
      sprintName: "Test Sprint",
      businessDays: 10,
      numberOfPeople: config.teamMembers.length,
      workingHours,
      ...sprintData,
      ...metrics,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div data-testid="sprint-form">
      <h3>Sprint Form</h3>
      <div>Working Hours: {workingHours.toFixed(1)}h</div>
      <div>Team Members: {config.teamMembers.length}</div>
      <button onClick={handleSubmit}>Save Sprint</button>
    </div>
  );
};

const MockTeamManagement = ({ config, onConfigUpdate }: any) => {
  const addTeamMember = () => {
    const newMember: TeamMember = {
      name: "New Member",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 8,
      timeOffHours: 0,
      netHours: 32,
    };

    onConfigUpdate({
      ...config,
      teamMembers: [...config.teamMembers, newMember],
    });
  };

  const removeTeamMember = (index: number) => {
    const updatedMembers = config.teamMembers.filter(
      (_: any, i: number) => i !== index
    );
    onConfigUpdate({
      ...config,
      teamMembers: updatedMembers,
    });
  };

  return (
    <div data-testid="team-management">
      <h3>Team Management</h3>
      <div>Total Team Members: {config.teamMembers.length}</div>
      <div>
        Total Net Hours:{" "}
        {calculateWorkingHours(
          config.teamMembers,
          config.defaultMeetingPercentage
        ).toFixed(1)}
        h
      </div>
      <button onClick={addTeamMember}>Add Team Member</button>
      {config.teamMembers.map((member: TeamMember, index: number) => (
        <div key={index}>
          <span>
            {member.name} ({member.netHours}h)
          </span>
          <button onClick={() => removeTeamMember(index)}>Remove</button>
        </div>
      ))}
    </div>
  );
};

const IntegratedApp = () => {
  const [config, setConfig] = React.useState<AppConfig>({
    velocityCalculationSprints: 6,
    defaultMeetingPercentage: 20,
    teamMembers: [
      {
        name: "John Doe",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32,
      },
      {
        name: "Jane Smith",
        totalGrossHours: 40,
        onCallHours: 8,
        meetingHours: 8,
        timeOffHours: 4,
        netHours: 20,
      },
    ],
  });

  const [savedSprints, setSavedSprints] = React.useState<any[]>([]);

  const handleSaveSprint = (sprint: any) => {
    setSavedSprints((prev) => [...prev, sprint]);
  };

  return (
    <div>
      <MockTeamManagement config={config} onConfigUpdate={setConfig} />
      <MockSprintForm config={config} onSave={handleSaveSprint} />
      <div data-testid="saved-sprints">
        <h3>Saved Sprints</h3>
        {savedSprints.map((sprint, index) => (
          <div key={index} data-testid={`sprint-${index}`}>
            <div>Sprint: {sprint.sprintName}</div>
            <div>Working Hours: {sprint.workingHours}h</div>
            <div>Team Size: {sprint.numberOfPeople}</div>
            <div>Velocity: {sprint.velocity.toFixed(3)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Import React for the component
import React from "react";

describe("Team-Sprint Integration", () => {
  it("should integrate team data with sprint calculations", async () => {
    render(<IntegratedApp />);

    // Verify initial team setup
    expect(screen.getByText("Total Team Members: 2")).toBeInTheDocument();
    expect(screen.getByText("Total Net Hours: 52.0h")).toBeInTheDocument();

    // Verify sprint form shows correct working hours
    expect(screen.getByText("Working Hours: 52.0h")).toBeInTheDocument();
    expect(screen.getByText("Team Members: 2")).toBeInTheDocument();

    // Save a sprint
    const saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Verify sprint was saved with correct calculations
    expect(screen.getByText("Sprint: Test Sprint")).toBeInTheDocument();
    expect(screen.getByText("Working Hours: 52h")).toBeInTheDocument();
    expect(screen.getByText("Team Size: 2")).toBeInTheDocument();
    expect(screen.getByText("Velocity: 0.481")).toBeInTheDocument(); // 25 points / 52 hours
  });

  it("should update sprint calculations when team changes", async () => {
    render(<IntegratedApp />);

    // Initial state
    expect(screen.getByText("Working Hours: 52.0h")).toBeInTheDocument();

    // Add a team member
    const addButton = screen.getByText("Add Team Member");
    await userEvent.click(addButton);

    // Verify team updated
    expect(screen.getByText("Total Team Members: 3")).toBeInTheDocument();
    expect(screen.getByText("Total Net Hours: 84.0h")).toBeInTheDocument(); // 52 + 32 = 84

    // Verify sprint form reflects the change
    expect(screen.getByText("Working Hours: 84.0h")).toBeInTheDocument();
    expect(screen.getByText("Team Members: 3")).toBeInTheDocument();

    // Save sprint with updated team
    const saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Verify sprint calculations updated
    expect(screen.getByText("Working Hours: 84h")).toBeInTheDocument();
    expect(screen.getByText("Team Size: 3")).toBeInTheDocument();
    expect(screen.getByText("Velocity: 0.298")).toBeInTheDocument(); // 25 points / 84 hours
  });

  it("should handle team member removal correctly", async () => {
    render(<IntegratedApp />);

    // Initial state
    expect(screen.getByText("Working Hours: 52.0h")).toBeInTheDocument();

    // Remove Jane Smith (20h net)
    const removeButtons = screen.getAllByText("Remove");
    await userEvent.click(removeButtons[1]); // Remove second member (Jane)

    // Verify team updated
    expect(screen.getByText("Total Team Members: 1")).toBeInTheDocument();
    expect(screen.getByText("Total Net Hours: 32.0h")).toBeInTheDocument(); // Only John's 32h

    // Verify sprint form reflects the change
    expect(screen.getByText("Working Hours: 32.0h")).toBeInTheDocument();
    expect(screen.getByText("Team Members: 1")).toBeInTheDocument();

    // Save sprint with reduced team
    const saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Verify sprint calculations updated
    expect(screen.getByText("Working Hours: 32h")).toBeInTheDocument();
    expect(screen.getByText("Team Size: 1")).toBeInTheDocument();
    expect(screen.getByText("Velocity: 0.781")).toBeInTheDocument(); // 25 points / 32 hours
  });

  it("should maintain calculation accuracy across multiple sprints", async () => {
    render(<IntegratedApp />);

    // Save first sprint
    let saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Add team member and save second sprint
    const addButton = screen.getByText("Add Team Member");
    await userEvent.click(addButton);

    saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Remove team member and save third sprint
    const removeButtons = screen.getAllByText("Remove");
    await userEvent.click(removeButtons[0]); // Remove first member

    saveButton = screen.getByText("Save Sprint");
    await userEvent.click(saveButton);

    // Verify all three sprints have correct calculations
    const sprint0 = screen.getByTestId("sprint-0");
    expect(sprint0).toHaveTextContent("Working Hours: 52h");
    expect(sprint0).toHaveTextContent("Team Size: 2");
    expect(sprint0).toHaveTextContent("Velocity: 0.481");

    const sprint1 = screen.getByTestId("sprint-1");
    expect(sprint1).toHaveTextContent("Working Hours: 84h");
    expect(sprint1).toHaveTextContent("Team Size: 3");
    expect(sprint1).toHaveTextContent("Velocity: 0.298");

    const sprint2 = screen.getByTestId("sprint-2");
    expect(sprint2).toHaveTextContent("Working Hours: 52h"); // Jane + New Member
    expect(sprint2).toHaveTextContent("Team Size: 2");
    expect(sprint2).toHaveTextContent("Velocity: 0.481");
  });
});

describe("Calculation Functions Integration", () => {
  it("should calculate working hours correctly with different team configurations", () => {
    const teamMembers: TeamMember[] = [
      {
        name: "Full Time",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32,
      },
      {
        name: "Part Time",
        totalGrossHours: 20,
        onCallHours: 0,
        meetingHours: 4,
        timeOffHours: 0,
        netHours: 16,
      },
      {
        name: "On Call Heavy",
        totalGrossHours: 40,
        onCallHours: 20,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 12,
      },
    ];

    const workingHours = calculateWorkingHours(teamMembers, 20);
    expect(workingHours).toBe(60); // 32 + 16 + 12
  });

  it("should calculate sprint metrics correctly with team-derived working hours", () => {
    const teamMembers: TeamMember[] = [
      {
        name: "Developer 1",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32,
      },
      {
        name: "Developer 2",
        totalGrossHours: 40,
        onCallHours: 8,
        meetingHours: 8,
        timeOffHours: 4,
        netHours: 20,
      },
    ];

    const workingHours = calculateWorkingHours(teamMembers, 20);

    const sprintData = {
      totalPointsInSprint: 30,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      totalCompletedPoints: 28,
      workingHours,
    };

    const metrics = calculateSprintMetrics(sprintData);

    expect(metrics.plannedPoints).toBe(27); // 30 - 3
    expect(metrics.newWorkPoints).toBe(25); // 30 - 5
    expect(metrics.pointsCompleted).toBe(25); // 28 - 3
    expect(metrics.percentComplete).toBeCloseTo(92.59, 1); // (25/27) * 100
    expect(metrics.velocity).toBeCloseTo(0.481, 3); // 25/52
  });

  it("should handle edge cases in team-sprint integration", () => {
    // Team with zero net hours
    const zeroHoursTeam: TeamMember[] = [
      {
        name: "Overbooked",
        totalGrossHours: 40,
        onCallHours: 40,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0,
      },
    ];

    const workingHours = calculateWorkingHours(zeroHoursTeam, 20);
    expect(workingHours).toBe(0);

    const sprintData = {
      totalPointsInSprint: 30,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      totalCompletedPoints: 28,
      workingHours,
    };

    const metrics = calculateSprintMetrics(sprintData);
    expect(metrics.velocity).toBe(0); // Division by zero handled
  });
});
