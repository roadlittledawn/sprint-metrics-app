import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SprintForm from "../SprintForm";
import { AppConfig, TeamMember, Sprint } from "@/lib/types";

describe("SprintForm", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  const sampleTeamMembers: TeamMember[] = [
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
  ];

  const sampleConfig: AppConfig = {
    velocityCalculationSprints: 6,
    defaultMeetingPercentage: 20,
    teamMembers: sampleTeamMembers,
  };

  const defaultProps = {
    config: sampleConfig,
    onSave: mockOnSave,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render form for adding new sprint", () => {
    render(<SprintForm {...defaultProps} />);

    expect(screen.getByText("Add New Sprint")).toBeInTheDocument();
    expect(screen.getByLabelText(/sprint name/i)).toBeInTheDocument();
    expect(
      screen.getByText("Team Members for this Sprint")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save sprint/i })
    ).toBeInTheDocument();
  });

  it("should render form for editing existing sprint", () => {
    const existingSprint: Sprint = {
      id: "sprint-1",
      sprintName: "Sprint 24.1",
      businessDays: 10,
      numberOfPeople: 2,
      workingHours: 52,
      totalPointsInSprint: 30,
      carryOverPointsTotal: 5,
      carryOverPointsCompleted: 3,
      newWorkPoints: 25,
      unplannedPointsBroughtIn: 2,
      pointsCompleted: 25,
      plannedPoints: 27,
      percentComplete: 92.6,
      velocity: 0.48,
      predictedCapacity: 25,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };

    render(<SprintForm {...defaultProps} sprint={existingSprint} />);

    expect(screen.getByText("Edit Sprint")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sprint 24.1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("30")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update sprint/i })
    ).toBeInTheDocument();
  });

  it("should calculate working hours automatically from selected team members", () => {
    render(<SprintForm {...defaultProps} />);

    // Both team members should be selected by default
    // John: 32h net, Jane: 20h net = 52h total
    expect(screen.getByText("52.0h")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // 2 selected team members
  });

  it("should update working hours when team member selection changes", async () => {
    render(<SprintForm {...defaultProps} />);

    // Initially both members selected (52h total)
    expect(screen.getByText("52.0h")).toBeInTheDocument();

    // Uncheck Jane Smith
    const janeCheckbox = screen.getByLabelText("Jane Smith");
    await userEvent.click(janeCheckbox);

    // Should now show only John's hours (32h)
    expect(screen.getByText("32.0h")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 selected team member
  });

  it("should display calculated metrics in real-time", async () => {
    render(<SprintForm {...defaultProps} />);

    // Fill in sprint data
    const totalPointsInput = screen.getByLabelText(/total points in sprint/i);
    const carryOverTotalInput = screen.getByLabelText(
      /carry over points \(total\)/i
    );
    const carryOverCompletedInput = screen.getByLabelText(
      /carry over points completed/i
    );
    const pointsCompletedInput = screen.getByLabelText(
      /points completed \(new work\)/i
    );

    await userEvent.clear(totalPointsInput);
    await userEvent.type(totalPointsInput, "30");
    await userEvent.clear(carryOverTotalInput);
    await userEvent.type(carryOverTotalInput, "5");
    await userEvent.clear(carryOverCompletedInput);
    await userEvent.type(carryOverCompletedInput, "3");
    await userEvent.clear(pointsCompletedInput);
    await userEvent.type(pointsCompletedInput, "25");

    // Check calculated metrics
    expect(screen.getByText("27.0")).toBeInTheDocument(); // Planned points: 30 - 3
    expect(screen.getByText("25.0")).toBeInTheDocument(); // New work points: 30 - 5
    expect(screen.getByText("92.6%")).toBeInTheDocument(); // Percent complete: (25/27) * 100
    expect(screen.getByText("0.481")).toBeInTheDocument(); // Velocity: 25/52
  });

  it("should validate required fields", async () => {
    render(<SprintForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", { name: /save sprint/i });
    await userEvent.click(submitButton);

    expect(screen.getByText("Sprint name is required")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should validate that at least one team member is selected", async () => {
    render(<SprintForm {...defaultProps} />);

    // Uncheck all team members
    const johnCheckbox = screen.getByLabelText("John Doe");
    const janeCheckbox = screen.getByLabelText("Jane Smith");
    await userEvent.click(johnCheckbox);
    await userEvent.click(janeCheckbox);

    // Fill in required fields
    const sprintNameInput = screen.getByLabelText(/sprint name/i);
    await userEvent.type(sprintNameInput, "Test Sprint");

    const submitButton = screen.getByRole("button", { name: /save sprint/i });
    await userEvent.click(submitButton);

    expect(
      screen.getByText("At least one team member must be selected")
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should validate that carry over completed does not exceed carry over total", async () => {
    render(<SprintForm {...defaultProps} />);

    const sprintNameInput = screen.getByLabelText(/sprint name/i);
    const carryOverTotalInput = screen.getByLabelText(
      /carry over points \(total\)/i
    );
    const carryOverCompletedInput = screen.getByLabelText(
      /carry over points completed/i
    );

    await userEvent.type(sprintNameInput, "Test Sprint");
    await userEvent.clear(carryOverTotalInput);
    await userEvent.type(carryOverTotalInput, "5");
    await userEvent.clear(carryOverCompletedInput);
    await userEvent.type(carryOverCompletedInput, "10");

    const submitButton = screen.getByRole("button", { name: /save sprint/i });
    await userEvent.click(submitButton);

    expect(
      screen.getByText("Carry over completed cannot exceed carry over total")
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should call onSave with correct sprint data when form is valid", async () => {
    render(<SprintForm {...defaultProps} />);

    // Fill in form data
    const sprintNameInput = screen.getByLabelText(/sprint name/i);
    const businessDaysInput = screen.getByLabelText(/business days/i);
    const totalPointsInput = screen.getByLabelText(/total points in sprint/i);
    const carryOverTotalInput = screen.getByLabelText(
      /carry over points \(total\)/i
    );
    const carryOverCompletedInput = screen.getByLabelText(
      /carry over points completed/i
    );
    const pointsCompletedInput = screen.getByLabelText(
      /points completed \(new work\)/i
    );

    await userEvent.type(sprintNameInput, "Test Sprint");
    await userEvent.clear(businessDaysInput);
    await userEvent.type(businessDaysInput, "10");
    await userEvent.clear(totalPointsInput);
    await userEvent.type(totalPointsInput, "30");
    await userEvent.clear(carryOverTotalInput);
    await userEvent.type(carryOverTotalInput, "5");
    await userEvent.clear(carryOverCompletedInput);
    await userEvent.type(carryOverCompletedInput, "3");
    await userEvent.clear(pointsCompletedInput);
    await userEvent.type(pointsCompletedInput, "25");

    const submitButton = screen.getByRole("button", { name: /save sprint/i });
    await userEvent.click(submitButton);

    expect(mockOnSave).toHaveBeenCalledWith(
      expect.objectContaining({
        sprintName: "Test Sprint",
        businessDays: 10,
        numberOfPeople: 2, // Both team members selected
        workingHours: 52, // John: 32h + Jane: 20h
        totalPointsInSprint: 30,
        carryOverPointsTotal: 5,
        carryOverPointsCompleted: 3,
        newWorkPoints: 25, // 30 - 5
        pointsCompleted: 25,
        plannedPoints: 27, // 30 - 3
        percentComplete: expect.closeTo(92.59, 1), // (25/27) * 100
        velocity: expect.closeTo(0.481, 2), // 25/52
      })
    );
  });

  it("should call onCancel when cancel button is clicked", async () => {
    render(<SprintForm {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should show warning when no team members are configured", () => {
    const configWithNoTeam: AppConfig = {
      ...sampleConfig,
      teamMembers: [],
    };

    render(<SprintForm {...defaultProps} config={configWithNoTeam} />);

    expect(
      screen.getByText(
        "No team members configured. Please add team members in the team management section first."
      )
    ).toBeInTheDocument();
  });

  it("should handle team members with zero net hours", async () => {
    const teamWithZeroHours: TeamMember[] = [
      {
        name: "Overbooked User",
        totalGrossHours: 40,
        onCallHours: 40,
        meetingHours: 0,
        timeOffHours: 0,
        netHours: 0,
      },
    ];

    const configWithZeroHours: AppConfig = {
      ...sampleConfig,
      teamMembers: teamWithZeroHours,
    };

    render(<SprintForm {...defaultProps} config={configWithZeroHours} />);

    expect(screen.getByText("0.0h")).toBeInTheDocument(); // Total working hours

    // Try to submit form
    const sprintNameInput = screen.getByLabelText(/sprint name/i);
    await userEvent.type(sprintNameInput, "Test Sprint");

    const submitButton = screen.getByRole("button", { name: /save sprint/i });
    await userEvent.click(submitButton);

    expect(
      screen.getByText(
        "Total working hours must be greater than 0. Check team member configurations."
      )
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });
});
