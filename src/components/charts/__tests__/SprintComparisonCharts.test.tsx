import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import SprintComparisonCharts from "../SprintComparisonCharts";
import { Sprint } from "@/lib/types";

// Mock Recharts components
vi.mock("recharts", () => ({
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: ({ name }: any) => <div data-testid="bar">{name}</div>,
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ name }: any) => <div data-testid="line">{name}</div>,
  AreaChart: ({ children }: any) => (
    <div data-testid="area-chart">{children}</div>
  ),
  Area: ({ name }: any) => <div data-testid="area">{name}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const mockSprints: Sprint[] = [
  {
    id: "1",
    sprintName: "Sprint 1",
    businessDays: 10,
    numberOfPeople: 5,
    workingHours: 200,
    totalPointsInSprint: 50,
    carryOverPointsTotal: 5,
    carryOverPointsCompleted: 3,
    newWorkPoints: 45,
    unplannedPointsBroughtIn: 2,
    pointsCompleted: 40,
    plannedPoints: 47,
    percentComplete: 85.1,
    velocity: 0.2,
    predictedCapacity: 40,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    sprintName: "Sprint 2",
    businessDays: 10,
    numberOfPeople: 5,
    workingHours: 180,
    totalPointsInSprint: 45,
    carryOverPointsTotal: 7,
    carryOverPointsCompleted: 4,
    newWorkPoints: 38,
    unplannedPointsBroughtIn: 1,
    pointsCompleted: 35,
    plannedPoints: 41,
    percentComplete: 85.4,
    velocity: 0.194,
    predictedCapacity: 35,
    createdAt: "2024-01-15T00:00:00Z",
    updatedAt: "2024-01-15T00:00:00Z",
  },
  {
    id: "3",
    sprintName: "Sprint 3",
    businessDays: 10,
    numberOfPeople: 5,
    workingHours: 190,
    totalPointsInSprint: 48,
    carryOverPointsTotal: 6,
    carryOverPointsCompleted: 2,
    newWorkPoints: 42,
    unplannedPointsBroughtIn: 3,
    pointsCompleted: 42,
    plannedPoints: 46,
    percentComplete: 91.3,
    velocity: 0.221,
    predictedCapacity: 42,
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
];

describe("SprintComparisonCharts", () => {
  it("renders chart with sprint data", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("displays empty state when no sprints provided", () => {
    render(<SprintComparisonCharts sprints={[]} />);

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
    expect(screen.getByText("No sprint data available")).toBeInTheDocument();
    expect(
      screen.getByText("Add sprint data to see comparisons")
    ).toBeInTheDocument();
  });

  it("displays empty state when sprints is null", () => {
    render(<SprintComparisonCharts sprints={null as any} />);

    expect(screen.getByText("No sprint data available")).toBeInTheDocument();
  });

  it("renders chart type selector with all options", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");
    expect(chartSelect).toBeInTheDocument();

    expect(screen.getByText("Planned vs Actual")).toBeInTheDocument();
    expect(screen.getByText("Capacity Utilization")).toBeInTheDocument();
    expect(screen.getByText("Sprint Progress")).toBeInTheDocument();
  });

  it("renders time range selector with default options", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const select = screen.getByLabelText("Show last:");
    expect(select).toBeInTheDocument();

    expect(screen.getByText("6 sprints")).toBeInTheDocument();
    expect(screen.getByText("12 sprints")).toBeInTheDocument();
    expect(screen.getByText("18 sprints")).toBeInTheDocument();
    expect(screen.getByText("24 sprints")).toBeInTheDocument();
  });

  it("allows custom time range options", () => {
    render(
      <SprintComparisonCharts
        sprints={mockSprints}
        timeRangeOptions={[3, 6, 9]}
        defaultTimeRange={6}
      />
    );

    expect(screen.getByText("3 sprints")).toBeInTheDocument();
    expect(screen.getByText("6 sprints")).toBeInTheDocument();
    expect(screen.getByText("9 sprints")).toBeInTheDocument();
    expect(screen.queryByText("12 sprints")).not.toBeInTheDocument();
  });

  it("switches between chart types", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");

    // Default should be planned vs actual (bar chart)
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();

    // Switch to capacity utilization (line chart)
    fireEvent.change(chartSelect, { target: { value: "capacity" } });
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();

    // Switch to burndown (area chart)
    fireEvent.change(chartSelect, { target: { value: "burndown" } });
    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
  });

  it("updates chart when time range is changed", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const select = screen.getByLabelText("Show last:");
    fireEvent.change(select, { target: { value: "6" } });

    expect(select).toHaveValue("6");
  });

  it("displays chart insights for planned vs actual", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    expect(screen.getByText("Avg Completion Rate:")).toBeInTheDocument();
    expect(screen.getByText("Best Sprint:")).toBeInTheDocument();
    expect(screen.getByText("Sprints Shown:")).toBeInTheDocument();
  });

  it("displays chart insights for capacity utilization", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");
    fireEvent.change(chartSelect, { target: { value: "capacity" } });

    expect(screen.getByText("Avg Utilization:")).toBeInTheDocument();
    expect(screen.getByText("Target Range:")).toBeInTheDocument();
    expect(screen.getByText("80-100%")).toBeInTheDocument();
  });

  it("displays chart insights for burndown", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");
    fireEvent.change(chartSelect, { target: { value: "burndown" } });

    expect(screen.getByText("Latest Sprint:")).toBeInTheDocument();
    expect(screen.getByText("Latest Progress:")).toBeInTheDocument();
  });

  it("renders bar chart components for planned vs actual", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
    expect(screen.getByText("Planned Points")).toBeInTheDocument();
    expect(screen.getByText("Actual Points")).toBeInTheDocument();
  });

  it("renders line chart components for capacity utilization", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");
    fireEvent.change(chartSelect, { target: { value: "capacity" } });

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByText("Capacity Utilization")).toBeInTheDocument();
    expect(screen.getByText("Target (100%)")).toBeInTheDocument();
  });

  it("renders area chart components for burndown", () => {
    render(<SprintComparisonCharts sprints={mockSprints} />);

    const chartSelect = screen.getByLabelText("Chart:");
    fireEvent.change(chartSelect, { target: { value: "burndown" } });

    expect(screen.getByTestId("area-chart")).toBeInTheDocument();
    expect(screen.getByText("Completed Points")).toBeInTheDocument();
    expect(screen.getByText("Remaining Points")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <SprintComparisonCharts sprints={mockSprints} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("uses custom height", () => {
    render(<SprintComparisonCharts sprints={mockSprints} height={300} />);

    const chartContainer = screen.getByTestId(
      "responsive-container"
    ).parentElement;
    expect(chartContainer).toHaveStyle({ height: "300px" });
  });

  it("handles sprints with zero values", () => {
    const sprintsWithZeroValues = [
      ...mockSprints,
      {
        ...mockSprints[0],
        id: "4",
        sprintName: "Sprint 4",
        pointsCompleted: 0,
        plannedPoints: 0,
        percentComplete: 0,
        velocity: 0,
        createdAt: "2024-02-15T00:00:00Z",
      },
    ];

    render(<SprintComparisonCharts sprints={sprintsWithZeroValues} />);

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("sorts sprints by creation date", () => {
    const unsortedSprints = [mockSprints[2], mockSprints[0], mockSprints[1]];

    render(<SprintComparisonCharts sprints={unsortedSprints} />);

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
    expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
  });

  it("limits data to selected time range", () => {
    const manySprints = Array.from({ length: 20 }, (_, i) => ({
      ...mockSprints[0],
      id: `sprint-${i}`,
      sprintName: `Sprint ${i + 1}`,
      createdAt: new Date(2024, 0, i + 1).toISOString(),
    }));

    render(
      <SprintComparisonCharts sprints={manySprints} defaultTimeRange={5} />
    );

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
    expect(screen.getByText("5 of 20")).toBeInTheDocument();
  });

  it("calculates capacity utilization correctly", () => {
    const sprintWithHighCapacity = {
      ...mockSprints[0],
      pointsCompleted: 60, // More than planned
      plannedPoints: 50,
    };

    render(<SprintComparisonCharts sprints={[sprintWithHighCapacity]} />);

    const chartSelect = screen.getByLabelText("Chart:");
    fireEvent.change(chartSelect, { target: { value: "capacity" } });

    expect(screen.getByText("Sprint Comparison")).toBeInTheDocument();
  });
});
