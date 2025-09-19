import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamManagement from "../TeamManagement";
import { AppConfig, TeamMember } from "@/lib/types";

// Mock the child components
vi.mock("../TeamMemberForm", () => ({
  default: ({ onSave, onCancel, teamMember }: any) => (
    <div data-testid="team-member-form">
      <h3>{teamMember ? "Edit Team Member" : "Add Team Member"}</h3>
      <button
        onClick={() =>
          onSave({
            name: "Test User",
            totalGrossHours: 40,
            onCallHours: 0,
            meetingHours: 8,
            timeOffHours: 0,
            netHours: 32,
          })
        }
      >
        Save
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../TeamMemberList", () => ({
  default: ({ teamMembers, onEdit, onDelete, onAdd }: any) => (
    <div data-testid="team-member-list">
      <h3>Team Members</h3>
      <button onClick={onAdd}>Add Team Member</button>
      {teamMembers.map((member: TeamMember, index: number) => (
        <div key={index}>
          <span>{member.name}</span>
          <button onClick={() => onEdit(member, index)}>Edit</button>
          <button onClick={() => onDelete(index)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

describe("TeamManagement", () => {
  const mockOnConfigUpdate = vi.fn();

  const sampleConfig: AppConfig = {
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
  };

  const defaultProps = {
    config: sampleConfig,
    onConfigUpdate: mockOnConfigUpdate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render team member list by default", () => {
    render(<TeamManagement {...defaultProps} />);

    expect(screen.getByTestId("team-member-list")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-form")).not.toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("should show form when add button is clicked", async () => {
    render(<TeamManagement {...defaultProps} />);

    const addButton = screen.getByText("Add Team Member");
    await userEvent.click(addButton);

    expect(screen.getByTestId("team-member-form")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-list")).not.toBeInTheDocument();
    expect(screen.getByText("Add Team Member")).toBeInTheDocument();
  });

  it("should show form when edit button is clicked", async () => {
    render(<TeamManagement {...defaultProps} />);

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    expect(screen.getByTestId("team-member-form")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-list")).not.toBeInTheDocument();
    expect(screen.getByText("Edit Team Member")).toBeInTheDocument();
  });

  it("should add new team member when form is saved", async () => {
    render(<TeamManagement {...defaultProps} />);

    // Click add button to show form
    const addButton = screen.getByText("Add Team Member");
    await userEvent.click(addButton);

    // Click save button in form
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    expect(mockOnConfigUpdate).toHaveBeenCalledWith({
      ...sampleConfig,
      teamMembers: [
        ...sampleConfig.teamMembers,
        {
          name: "Test User",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        },
      ],
    });

    // Should return to list view
    expect(screen.getByTestId("team-member-list")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-form")).not.toBeInTheDocument();
  });

  it("should update existing team member when form is saved", async () => {
    render(<TeamManagement {...defaultProps} />);

    // Click edit button for first member
    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    // Click save button in form
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    const expectedUpdatedMembers = [...sampleConfig.teamMembers];
    expectedUpdatedMembers[0] = {
      name: "Test User",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 8,
      timeOffHours: 0,
      netHours: 32,
    };

    expect(mockOnConfigUpdate).toHaveBeenCalledWith({
      ...sampleConfig,
      teamMembers: expectedUpdatedMembers,
    });

    // Should return to list view
    expect(screen.getByTestId("team-member-list")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-form")).not.toBeInTheDocument();
  });

  it("should delete team member when delete is clicked", async () => {
    render(<TeamManagement {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    const expectedUpdatedMembers = [sampleConfig.teamMembers[1]]; // Remove first member

    expect(mockOnConfigUpdate).toHaveBeenCalledWith({
      ...sampleConfig,
      teamMembers: expectedUpdatedMembers,
    });
  });

  it("should return to list when form is cancelled", async () => {
    render(<TeamManagement {...defaultProps} />);

    // Click add button to show form
    const addButton = screen.getByText("Add Team Member");
    await userEvent.click(addButton);

    expect(screen.getByTestId("team-member-form")).toBeInTheDocument();

    // Click cancel button in form
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(screen.getByTestId("team-member-list")).toBeInTheDocument();
    expect(screen.queryByTestId("team-member-form")).not.toBeInTheDocument();
    expect(mockOnConfigUpdate).not.toHaveBeenCalled();
  });

  it("should update local state when config prop changes", () => {
    const { rerender } = render(<TeamManagement {...defaultProps} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    const updatedConfig: AppConfig = {
      ...sampleConfig,
      teamMembers: [
        {
          name: "New User",
          totalGrossHours: 35,
          onCallHours: 0,
          meetingHours: 7,
          timeOffHours: 0,
          netHours: 28,
        },
      ],
    };

    rerender(
      <TeamManagement
        config={updatedConfig}
        onConfigUpdate={mockOnConfigUpdate}
      />
    );

    expect(screen.getByText("New User")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("should handle empty team members list", () => {
    const emptyConfig: AppConfig = {
      ...sampleConfig,
      teamMembers: [],
    };

    render(
      <TeamManagement
        config={emptyConfig}
        onConfigUpdate={mockOnConfigUpdate}
      />
    );

    expect(screen.getByTestId("team-member-list")).toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("should maintain form state correctly during edit operations", async () => {
    render(<TeamManagement {...defaultProps} />);

    // Edit first member
    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Team Member")).toBeInTheDocument();

    // Cancel and try editing second member
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    const newEditButtons = screen.getAllByText("Edit");
    await userEvent.click(newEditButtons[1]);

    expect(screen.getByText("Edit Team Member")).toBeInTheDocument();
  });
});
