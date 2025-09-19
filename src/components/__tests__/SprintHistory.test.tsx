import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SprintHistory from "../SprintHistory";
import { Sprint } from "@/lib/types";

describe("SprintHistory", () => {
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  const sampleSprints: Sprint[] = [
    {
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
      velocity: 0.481,
      predictedCapacity: 25,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "sprint-2",
      sprintName: "Sprint 24.2",
      businessDays: 8,
      numberOfPeople: 3,
      workingHours: 60,
      totalPointsInSprint: 35,
      carryOverPointsTotal: 8,
      carryOverPointsCompleted: 5,
      newWorkPoints: 27,
      unplannedPointsBroughtIn: 1,
      pointsCompleted: 30,
      plannedPoints: 30,
      percentComplete: 100.0,
      velocity: 0.5,
      predictedCapacity: 30,
      createdAt: "2024-01-15T00:00:00.000Z",
      updatedAt: "2024-01-15T00:00:00.000Z",
    },
  ];

  const defaultProps = {
    sprints: sampleSprints,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render sprint history table with data", () => {
    render(<SprintHistory {...defaultProps} />);

    expect(screen.getByText("Sprint History")).toBeInTheDocument();
    expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
    expect(screen.getByText("Sprint 24.2")).toBeInTheDocument();
    expect(screen.getByText("92.6%")).toBeInTheDocument();
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("should show empty state when no sprints exist", () => {
    render(<SprintHistory {...defaultProps} sprints={[]} />);

    expect(screen.getByText("Sprint History")).toBeInTheDocument();
    expect(
      screen.getByText(
        "No sprints found. Create your first sprint to get started!"
      )
    ).toBeInTheDocument();
  });

  it("should filter sprints based on search term", async () => {
    render(<SprintHistory {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search sprints...");
    await userEvent.type(searchInput, "24.1");

    expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
    expect(screen.queryByText("Sprint 24.2")).not.toBeInTheDocument();
  });

  it("should show no results message when search yields no matches", async () => {
    render(<SprintHistory {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search sprints...");
    await userEvent.type(searchInput, "nonexistent");

    expect(
      screen.getByText('No sprints found matching "nonexistent"')
    ).toBeInTheDocument();
  });

  it("should sort sprints by clicking column headers", async () => {
    render(<SprintHistory {...defaultProps} />);

    // Initially sorted by updatedAt desc, so Sprint 24.2 should be first
    const rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Sprint 24.2");
    expect(rows[2]).toHaveTextContent("Sprint 24.1");

    // Click on Sprint Name header to sort by name
    const sprintNameHeader = screen.getByText(/Sprint Name/);
    await userEvent.click(sprintNameHeader);

    // Now Sprint 24.1 should be first (ascending order)
    const updatedRows = screen.getAllByRole("row");
    expect(updatedRows[1]).toHaveTextContent("Sprint 24.1");
    expect(updatedRows[2]).toHaveTextContent("Sprint 24.2");
  });

  it("should toggle sort direction when clicking same column header twice", async () => {
    render(<SprintHistory {...defaultProps} />);

    const sprintNameHeader = screen.getByText(/Sprint Name/);

    // First click - ascending
    await userEvent.click(sprintNameHeader);
    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Sprint 24.1");

    // Second click - descending
    await userEvent.click(sprintNameHeader);
    rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("Sprint 24.2");
  });

  it("should call onEdit when edit button is clicked", async () => {
    render(<SprintHistory {...defaultProps} />);

    const editButtons = screen.getAllByText("Edit");
    await userEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledWith(sampleSprints[1]); // Sprint 24.2 is first due to default sort
  });

  it("should show delete confirmation modal when delete button is clicked", async () => {
    render(<SprintHistory {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Are you sure you want to delete this sprint? This action cannot be undone."
      )
    ).toBeInTheDocument();
  });

  it("should call onDelete when delete is confirmed", async () => {
    render(<SprintHistory {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    const confirmButton = screen.getByRole("button", { name: /delete/i });
    await userEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith("sprint-2"); // Sprint 24.2 is first due to default sort
  });

  it("should close delete confirmation modal when cancel is clicked", async () => {
    render(<SprintHistory {...defaultProps} />);

    const deleteButtons = screen.getAllByText("Delete");
    await userEvent.click(deleteButtons[0]);

    expect(screen.getByText("Confirm Delete")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(screen.queryByText("Confirm Delete")).not.toBeInTheDocument();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it("should display formatted dates correctly", () => {
    render(<SprintHistory {...defaultProps} />);

    // Check that dates are formatted as locale strings
    expect(screen.getByText("1/1/2024")).toBeInTheDocument();
    expect(screen.getByText("1/15/2024")).toBeInTheDocument();
  });

  it("should display numeric values with correct precision", () => {
    render(<SprintHistory {...defaultProps} />);

    // Check working hours (1 decimal)
    expect(screen.getByText("52.0h")).toBeInTheDocument();
    expect(screen.getByText("60.0h")).toBeInTheDocument();

    // Check planned/completed points (1 decimal)
    expect(screen.getByText("27.0")).toBeInTheDocument();
    expect(screen.getByText("25.0")).toBeInTheDocument();

    // Check velocity (3 decimals)
    expect(screen.getByText("0.481")).toBeInTheDocument();
    expect(screen.getByText("0.500")).toBeInTheDocument();
  });

  it("should show sort indicators in column headers", () => {
    render(<SprintHistory {...defaultProps} />);

    // Default sort is by updatedAt desc, so should show down arrow
    expect(screen.getByText(/Updated ↓/)).toBeInTheDocument();

    // Other columns should show neutral indicator
    expect(screen.getByText(/Sprint Name ↕️/)).toBeInTheDocument();
  });

  it("should handle empty search gracefully", async () => {
    render(<SprintHistory {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText("Search sprints...");
    await userEvent.type(searchInput, "test");
    await userEvent.clear(searchInput);

    // Should show all sprints again
    expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
    expect(screen.getByText("Sprint 24.2")).toBeInTheDocument();
  });
});
