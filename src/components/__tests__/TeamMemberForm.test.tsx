import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamMemberForm from "../TeamMemberForm";
import { TeamMember } from "@/lib/types";

describe("TeamMemberForm", () => {
  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    onSave: mockOnSave,
    onCancel: mockOnCancel,
    defaultMeetingPercentage: 20,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render form for adding new team member", () => {
    render(<TeamMemberForm {...defaultProps} />);

    expect(screen.getByText("Add Team Member")).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total gross hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/on-call hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time off hours/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add team member/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("should render form for editing existing team member", () => {
    const existingMember: TeamMember = {
      name: "John Doe",
      totalGrossHours: 40,
      onCallHours: 8,
      meetingHours: 8,
      timeOffHours: 4,
      netHours: 20,
    };

    render(<TeamMemberForm {...defaultProps} teamMember={existingMember} />);

    expect(screen.getByText("Edit Team Member")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("40")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8")).toBeInTheDocument();
    expect(screen.getByDisplayValue("4")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /update team member/i })
    ).toBeInTheDocument();
  });

  it("should calculate net hours automatically", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const onCallHoursInput = screen.getByLabelText(/on-call hours/i);
    const timeOffHoursInput = screen.getByLabelText(/time off hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.clear(onCallHoursInput);
    await userEvent.type(onCallHoursInput, "8");
    await userEvent.clear(timeOffHoursInput);
    await userEvent.type(timeOffHoursInput, "4");

    // Net hours should be 40 - 8 - 8 (20% meeting) - 4 = 20
    expect(screen.getByText(/net working hours: 20.0/i)).toBeInTheDocument();
  });

  it("should use default meeting percentage when checkbox is checked", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");

    // Should show meeting hours as 20% of 40 = 8 hours
    expect(
      screen.getByText(/meeting hours: 8.0 hours \(20% of gross hours\)/i)
    ).toBeInTheDocument();
  });

  it("should allow custom meeting hours when checkbox is unchecked", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const meetingPercentageCheckbox = screen.getByLabelText(
      /use default meeting percentage/i
    );
    await userEvent.click(meetingPercentageCheckbox);

    // Should now show meeting hours input field
    expect(screen.getByLabelText(/meeting hours/i)).toBeInTheDocument();
  });

  it("should validate required name field", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(screen.getByText("Name is required")).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should validate positive gross hours", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "0");

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(
      screen.getByText("Total gross hours must be greater than 0")
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should validate that on-call hours do not exceed gross hours", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const onCallHoursInput = screen.getByLabelText(/on-call hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.clear(onCallHoursInput);
    await userEvent.type(onCallHoursInput, "50");

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(
      screen.getByText("On-call hours cannot exceed total gross hours")
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should validate that total deductions do not exceed gross hours", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const onCallHoursInput = screen.getByLabelText(/on-call hours/i);
    const timeOffHoursInput = screen.getByLabelText(/time off hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.clear(onCallHoursInput);
    await userEvent.type(onCallHoursInput, "20");
    await userEvent.clear(timeOffHoursInput);
    await userEvent.type(timeOffHoursInput, "25"); // 20 + 8 (meeting) + 25 = 53 > 40

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(
      screen.getByText(/total deductions.*cannot exceed total gross hours/i)
    ).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it("should call onSave with correct data when form is valid", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const onCallHoursInput = screen.getByLabelText(/on-call hours/i);
    const timeOffHoursInput = screen.getByLabelText(/time off hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.clear(onCallHoursInput);
    await userEvent.type(onCallHoursInput, "8");
    await userEvent.clear(timeOffHoursInput);
    await userEvent.type(timeOffHoursInput, "4");

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      name: "Test User",
      totalGrossHours: 40,
      onCallHours: 8,
      meetingHours: 8, // 20% of 40
      timeOffHours: 4,
      netHours: 20, // 40 - 8 - 8 - 4
    });
  });

  it("should call onCancel when cancel button is clicked", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("should handle custom meeting hours correctly", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const meetingPercentageCheckbox = screen.getByLabelText(
      /use default meeting percentage/i
    );

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.click(meetingPercentageCheckbox); // Uncheck to use custom hours

    const meetingHoursInput = screen.getByLabelText(/meeting hours/i);
    await userEvent.clear(meetingHoursInput);
    await userEvent.type(meetingHoursInput, "10");

    const submitButton = screen.getByRole("button", {
      name: /add team member/i,
    });
    await userEvent.click(submitButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      name: "Test User",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 10,
      timeOffHours: 0,
      netHours: 30, // 40 - 0 - 10 - 0
    });
  });

  it("should prevent negative net hours by clamping to 0", async () => {
    render(<TeamMemberForm {...defaultProps} />);

    const nameInput = screen.getByLabelText(/name/i);
    const grossHoursInput = screen.getByLabelText(/total gross hours/i);
    const onCallHoursInput = screen.getByLabelText(/on-call hours/i);

    await userEvent.type(nameInput, "Test User");
    await userEvent.clear(grossHoursInput);
    await userEvent.type(grossHoursInput, "40");
    await userEvent.clear(onCallHoursInput);
    await userEvent.type(onCallHoursInput, "40"); // This will result in negative net hours

    // Net hours should show 0.0 (40 - 40 - 8 - 0 = -8, clamped to 0)
    expect(screen.getByText(/net working hours: 0.0/i)).toBeInTheDocument();
  });
});
