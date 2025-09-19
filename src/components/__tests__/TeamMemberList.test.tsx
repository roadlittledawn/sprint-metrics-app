import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeamMemberList from "../TeamMemberList";
import { TeamMember } from "@/lib/types";

describe("TeamMemberList", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnAdd = vi.fn();

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

  const defaultProps = {
    teamMembers: sampleTeamMembers,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
    onAdd: mockOnAdd,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render team members list with data", () => {
    render(<TeamMemberList {...defaultProps} />);

    expect(screen.getByText("Team Members")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add team member/i })
    ).toBeInTheDocument();
  });

  it("should display team capacity summary", () => {
    render(<TeamMemberList {...defaultProps} />);

    // Total net hours: 32 + 20 = 52
    expect(screen.getByText("52.0")).toBeInTheDocument();
    expect(screen.getByText(/net hours/i)).toBeInTheDocument();

    // Total gross hours: 40 + 40 = 80
    expect(screen.getByText("80.0")).toBeInTheDocument();
    expect(screen.getByText(/gross hours/i)).toBeInTheDocument();
  });

  it("should render empty state when no team members", () => {
    render(<TeamMemberList {...defaultProps} teamMembers={[]} />);

    expect(screen.getByText("No team members added yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add team members to start tracking sprint capacity")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("should display all team member data in table", () => {
    render(<TeamMemberList {...defaultProps} />);

    // Check table headers
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Gross Hours")).toBeInTheDocument();
    expect(screen.getByText("On-Call")).toBeInTheDocument();
    expect(screen.getByText("Meetings")).toBeInTheDocument();
    expect(screen.getByText("Time Off")).toBeInTheDocument();
    expect(screen.getByText("Net Hours")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();

    // Check John Doe's data
    const johnRow = screen.getByText("John Doe").closest("tr");
    expect(johnRow).toHaveTextContent("40"); // gross hours
    expect(johnRow).toHaveTextContent("0"); // on-call hours
    expect(johnRow).toHaveTextContent("8"); // meeting hours
    expect(johnRow).toHaveTextContent("0"); // time off hours
    expect(johnRow).toHaveTextContent("32.0"); // net hours

    // Check Jane Smith's data
    const janeRow = screen.getByText("Jane Smith").closest("tr");
    expect(janeRow).toHaveTextContent("40"); // gross hours
    expect(janeRow).toHaveTextContent("8"); // on-call hours
    expect(janeRow).toHaveTextContent("8"); // meeting hours
    expect(janeRow).toHaveTextContent("4"); // time off hours
    expect(janeRow).toHaveTextContent("20.0"); // net hours
  });

  it("should call onAdd when add button is clicked", async () => {
    render(<TeamMemberList {...defaultProps} />);

    const addButton = screen.getByRole("button", { name: /add team member/i });
    await userEvent.click(addButton);

    expect(mockOnAdd).toHaveBeenCalled();
  });

  it("should call onEdit when edit button is clicked", async () => {
    render(<TeamMemberList {...defaultProps} />);

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(sampleTeamMembers[0], 0);
  });

  it("should show delete confirmation when delete button is clicked", async () => {
    render(<TeamMemberList {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("should call onDelete when delete is confirmed", async () => {
    render(<TeamMemberList {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByText("Confirm");
    await userEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith(0);
  });

  it("should cancel delete when cancel button is clicked", async () => {
    render(<TeamMemberList {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    expect(screen.queryByText("Confirm")).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should handle multiple team members correctly", () => {
    const manyMembers: TeamMember[] = [
      ...sampleTeamMembers,
      {
        name: "Bob Johnson",
        totalGrossHours: 35,
        onCallHours: 5,
        meetingHours: 7,
        timeOffHours: 3,
        netHours: 20,
      },
    ];

    render(<TeamMemberList {...defaultProps} teamMembers={manyMembers} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();

    // Total net hours: 32 + 20 + 20 = 72
    expect(screen.getByText("72.0")).toBeInTheDocument();

    // Total gross hours: 40 + 40 + 35 = 115
    expect(screen.getByText("115.0")).toBeInTheDocument();
  });

  it("should show correct edit and delete buttons for each member", () => {
    render(<TeamMemberList {...defaultProps} />);

    const editButtons = screen.getAllByText("Edit");
    const deleteButtons = screen.getAllByText("Delete");

    expect(editButtons).toHaveLength(2);
    expect(deleteButtons).toHaveLength(2);
  });

  it("should handle zero net hours display correctly", () => {
    const membersWithZeroNet: TeamMember[] = [
      {
        name: "Overbooked User",
        totalGrossHours: 40,
        onCallHours: 40,
        meetingHours: 0,
        timeOffHours: 0,
        netHours: 0,
      },
    ];

    render(
      <TeamMemberList {...defaultProps} teamMembers={membersWithZeroNet} />
    );

    expect(screen.getByText("0.0")).toBeInTheDocument();
  });

  it("should not show capacity summary when no team members", () => {
    render(<TeamMemberList {...defaultProps} teamMembers={[]} />);

    expect(screen.queryByText(/total team capacity/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/total gross hours/i)).not.toBeInTheDocument();
  });
});
