import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TeamCapacityBreakdown from "../TeamCapacityBreakdown";
import { TeamMember } from "@/lib/types";

describe("TeamCapacityBreakdown", () => {
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
    defaultMeetingPercentage: 20,
  };

  it("should render team capacity summary", () => {
    render(<TeamCapacityBreakdown {...defaultProps} />);

    expect(screen.getByText("Team Capacity Breakdown")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument(); // Team members count
    expect(screen.getByText("52.0h")).toBeInTheDocument(); // Net hours (32 + 20)
    expect(screen.getByText("80.0h")).toBeInTheDocument(); // Gross hours (40 + 40)
    expect(screen.getByText("65.0%")).toBeInTheDocument(); // Efficiency (52/80 * 100)
  });

  it("should render custom title when provided", () => {
    render(
      <TeamCapacityBreakdown {...defaultProps} title="Sprint Team Capacity" />
    );

    expect(screen.getByText("Sprint Team Capacity")).toBeInTheDocument();
  });

  it("should display hours allocation breakdown", () => {
    render(<TeamCapacityBreakdown {...defaultProps} />);

    expect(screen.getByText("Hours Allocation")).toBeInTheDocument();
    expect(screen.getByText("Net (52.0h)")).toBeInTheDocument();
    expect(screen.getByText("On-Call (8.0h)")).toBeInTheDocument();
    expect(screen.getByText("Meetings (16.0h)")).toBeInTheDocument();
    expect(screen.getByText("Time Off (4.0h)")).toBeInTheDocument();
  });

  it("should display individual member breakdown when showDetails is true", () => {
    render(<TeamCapacityBreakdown {...defaultProps} showDetails={true} />);

    expect(screen.getByText("Individual Breakdown")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();

    // Check John's data
    const johnRow = screen.getByText("John Doe").closest("tr");
    expect(johnRow).toHaveTextContent("40.0h"); // gross hours
    expect(johnRow).toHaveTextContent("0.0h"); // on-call hours
    expect(johnRow).toHaveTextContent("8.0h"); // meeting hours
    expect(johnRow).toHaveTextContent("0.0h"); // time off hours
    expect(johnRow).toHaveTextContent("32.0h"); // net hours
    expect(johnRow).toHaveTextContent("80.0%"); // efficiency

    // Check Jane's data
    const janeRow = screen.getByText("Jane Smith").closest("tr");
    expect(janeRow).toHaveTextContent("40.0h"); // gross hours
    expect(janeRow).toHaveTextContent("8.0h"); // on-call hours
    expect(janeRow).toHaveTextContent("8.0h"); // meeting hours
    expect(janeRow).toHaveTextContent("4.0h"); // time off hours
    expect(janeRow).toHaveTextContent("20.0h"); // net hours
    expect(janeRow).toHaveTextContent("50.0%"); // efficiency
  });

  it("should hide individual breakdown when showDetails is false", () => {
    render(<TeamCapacityBreakdown {...defaultProps} showDetails={false} />);

    expect(screen.queryByText("Individual Breakdown")).not.toBeInTheDocument();
    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Jane Smith")).not.toBeInTheDocument();
  });

  it("should handle empty team members array", () => {
    render(<TeamCapacityBreakdown {...defaultProps} teamMembers={[]} />);

    expect(screen.getByText("No team members configured")).toBeInTheDocument();
    expect(screen.queryByText("Hours Allocation")).not.toBeInTheDocument();
    expect(screen.queryByText("Individual Breakdown")).not.toBeInTheDocument();
  });

  it("should handle team member with zero gross hours", () => {
    const teamWithZeroHours: TeamMember[] = [
      {
        name: "Zero Hours User",
        totalGrossHours: 0,
        onCallHours: 0,
        meetingHours: 0,
        timeOffHours: 0,
        netHours: 0,
      },
    ];

    render(
      <TeamCapacityBreakdown
        {...defaultProps}
        teamMembers={teamWithZeroHours}
        showDetails={true}
      />
    );

    expect(screen.getByText("0")).toBeInTheDocument(); // Efficiency should be 0%
    const zeroHoursRow = screen.getByText("Zero Hours User").closest("tr");
    expect(zeroHoursRow).toHaveTextContent("0.0%"); // efficiency
  });

  it("should color-code efficiency ratings", () => {
    const teamWithVariedEfficiency: TeamMember[] = [
      {
        name: "High Efficiency",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32, // 80% efficiency
      },
      {
        name: "Medium Efficiency",
        totalGrossHours: 40,
        onCallHours: 10,
        meetingHours: 8,
        timeOffHours: 2,
        netHours: 20, // 50% efficiency
      },
      {
        name: "Low Efficiency",
        totalGrossHours: 40,
        onCallHours: 20,
        meetingHours: 8,
        timeOffHours: 8,
        netHours: 4, // 10% efficiency
      },
    ];

    render(
      <TeamCapacityBreakdown
        {...defaultProps}
        teamMembers={teamWithVariedEfficiency}
        showDetails={true}
      />
    );

    // Check that efficiency percentages are displayed
    expect(screen.getByText("80.0%")).toBeInTheDocument();
    expect(screen.getByText("50.0%")).toBeInTheDocument();
    expect(screen.getByText("10.0%")).toBeInTheDocument();
  });

  it("should calculate totals correctly with multiple team members", () => {
    const largeTeam: TeamMember[] = [
      {
        name: "Member 1",
        totalGrossHours: 40,
        onCallHours: 0,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 32,
      },
      {
        name: "Member 2",
        totalGrossHours: 35,
        onCallHours: 5,
        meetingHours: 7,
        timeOffHours: 3,
        netHours: 20,
      },
      {
        name: "Member 3",
        totalGrossHours: 30,
        onCallHours: 0,
        meetingHours: 6,
        timeOffHours: 4,
        netHours: 20,
      },
    ];

    render(<TeamCapacityBreakdown {...defaultProps} teamMembers={largeTeam} />);

    expect(screen.getByText("3")).toBeInTheDocument(); // Team members count
    expect(screen.getByText("72.0h")).toBeInTheDocument(); // Net hours (32 + 20 + 20)
    expect(screen.getByText("105.0h")).toBeInTheDocument(); // Gross hours (40 + 35 + 30)
    expect(screen.getByText("68.6%")).toBeInTheDocument(); // Efficiency (72/105 * 100)
  });

  it("should handle team member with overbooked hours (negative net)", () => {
    const overbookedTeam: TeamMember[] = [
      {
        name: "Overbooked User",
        totalGrossHours: 40,
        onCallHours: 40,
        meetingHours: 8,
        timeOffHours: 0,
        netHours: 0, // Should be negative but clamped to 0
      },
    ];

    render(
      <TeamCapacityBreakdown
        {...defaultProps}
        teamMembers={overbookedTeam}
        showDetails={true}
      />
    );

    expect(screen.getByText("0.0h")).toBeInTheDocument(); // Net hours should be 0
    expect(screen.getByText("0.0%")).toBeInTheDocument(); // Efficiency should be 0%
  });
});
