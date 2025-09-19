import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import VelocityTrendChart from "../VelocityTrendChart";
import { Sprint } from "@/lib/types";

// Mock Recharts components
vi.mock("recharts", () => ({
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ name }: any) => <div data-testid="line">{name}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  ReferenceLine: ({ label }: any) => (
    <div data-testid="reference-line">{label?.value}</div>
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

describe("VelocityTrendChart", () => {
  it("renders chart with sprint data", () => {
    render(<VelocityTrendChart sprints={mockSprints} />);

    expect(screen.getByText("Velocity Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
  });

  it("displays empty state when no sprints provided", () => {
    render(<VelocityTrendChart sprints={[]} />);

    expect(screen.getByText("Velocity Trend")).toBeInTheDocument();
    expect(screen.getByText("No sprint data available")).toBeInTheDocument();
    expect(
      screen.getByText("Add sprint data to see velocity trends")
    ).toBeInTheDocument();
  });

  it("displays empty state when sprints is null", () => {
    render(<VelocityTrendChart sprints={null as any} />);

    expect(screen.getByText("No sprint data available")).toBeInTheDocument();
  });

  it("renders time range selector with default options", () => {
    render(<VelocityTrendChart sprints={mockSprints} />);

    const select = screen.getByLabelText("Show last:");
    expect(select).toBeInTheDocument();

    // Check default options
    expect(screen.getByText("6 sprints")).toBeInTheDocument();
    expect(screen.getByText("12 sprints")).toBeInTheDocument();
    expect(screen.getByText("18 sprints")).toBeInTheDocument();
    expect(screen.getByText("24 sprints")).toBeInTheDocument();
  });

  it("allows custom time range options", () => {
    render(
      <VelocityTrendChart
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

  it("updates chart when time range is changed", () => {
    render(<VelocityTrendChart sprints={mockSprints} />);

    const select = screen.getByLabelText("Show last:");
    fireEvent.change(select, { target: { value: "6" } });

    expect(select).toHaveValue("6");
  });

  it("displays chart insights with current and average velocity", () => {
    render(<VelocityTrendChart sprints={mockSprints} />);

    expect(screen.getByText("Current Velocity:")).toBeInTheDocument();
    expect(screen.getByText("Average Velocity:")).toBeInTheDocument();
    expect(screen.getByText("Sprints Shown:")).toBeInTheDocument();
  });

  it("renders chart components when data is available", () => {
    render(<VelocityTrendChart sprints={mockSprints} />);

    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.getByTestId("x-axis")).toBeInTheDocument();
    expect(screen.getByTestId("y-axis")).toBeInTheDocument();
    expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
    expect(screen.getByTestId("tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("legend")).toBeInTheDocument();
    expect(screen.getByText("Sprint Velocity")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(
      <VelocityTrendChart sprints={mockSprints} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("uses custom height", () => {
    render(<VelocityTrendChart sprints={mockSprints} height={300} />);

    const chartContainer = screen.getByTestId(
      "responsive-container"
    ).parentElement;
    expect(chartContainer).toHaveStyle({ height: "300px" });
  });

  it("handles sprints with zero velocity", () => {
    const sprintsWithZeroVelocity = [
      ...mockSprints,
      {
        ...mockSprints[0],
        id: "4",
        sprintName: "Sprint 4",
        velocity: 0,
        pointsCompleted: 0,
        createdAt: "2024-02-15T00:00:00Z",
      },
    ];

    render(<VelocityTrendChart sprints={sprintsWithZeroVelocity} />);

    expect(screen.getByText("Velocity Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("sorts sprints by creation date", () => {
    const unsortedSprints = [mockSprints[2], mockSprints[0], mockSprints[1]];

    render(<VelocityTrendChart sprints={unsortedSprints} />);

    // Chart should still render properly with sorted data
    expect(screen.getByText("Velocity Trend")).toBeInTheDocument();
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
  });

  it("limits data to selected time range", () => {
    const manySprints = Array.from({ length: 20 }, (_, i) => ({
      ...mockSprints[0],
      id: `sprint-${i}`,
      sprintName: `Sprint ${i + 1}`,
      createdAt: new Date(2024, 0, i + 1).toISOString(),
    }));

    render(<VelocityTrendChart sprints={manySprints} defaultTimeRange={5} />);

    expect(screen.getByText("Velocity Trend")).toBeInTheDocument();
    // The chart should only show the last 5 sprints
    expect(screen.getByText("5 of 20")).toBeInTheDocument();
  });
});
