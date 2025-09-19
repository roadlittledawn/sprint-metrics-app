import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CurrentSprintStatusCard from "../metrics/CurrentSprintStatusCard";

describe("CurrentSprintStatusCard", () => {
  const defaultProps = {
    sprintName: "Sprint 24.1",
    percentComplete: 85.5,
    pointsCompleted: 25.5,
    plannedPoints: 30.0,
  };

  it("renders sprint name and completion details", () => {
    render(<CurrentSprintStatusCard {...defaultProps} />);

    expect(screen.getByText("CURRENT SPRINT STATUS")).toBeInTheDocument();
    expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
    expect(
      screen.getByText("25.5 of 30.0 points completed")
    ).toBeInTheDocument();
  });

  it("shows excellent progress trend for high completion rate", () => {
    render(
      <CurrentSprintStatusCard {...defaultProps} percentComplete={95.0} />
    );

    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("excellent progress")).toBeInTheDocument();
  });

  it("shows on track trend for moderate completion rate", () => {
    render(
      <CurrentSprintStatusCard {...defaultProps} percentComplete={75.0} />
    );

    expect(screen.getByText("75.0%")).toBeInTheDocument();
    expect(screen.getByText("on track")).toBeInTheDocument();
  });

  it("shows needs attention trend for low completion rate", () => {
    render(
      <CurrentSprintStatusCard {...defaultProps} percentComplete={45.0} />
    );

    expect(screen.getByText("45.0%")).toBeInTheDocument();
    expect(screen.getByText("needs attention")).toBeInTheDocument();
  });

  it("handles zero completion rate", () => {
    render(<CurrentSprintStatusCard {...defaultProps} percentComplete={0} />);

    expect(screen.getByText("Sprint 24.1")).toBeInTheDocument();
    expect(
      screen.getByText("25.5 of 30.0 points completed")
    ).toBeInTheDocument();
    // Should not show trend when percentComplete is 0
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  it("renders loading state", () => {
    render(<CurrentSprintStatusCard {...defaultProps} isLoading={true} />);

    // Should show loading skeleton
    const loadingElements = document.querySelectorAll(".animate-pulse");
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <CurrentSprintStatusCard {...defaultProps} className="custom-class" />
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-class");
  });

  it("formats decimal values correctly", () => {
    render(
      <CurrentSprintStatusCard
        sprintName="Sprint 24.2"
        percentComplete={87.33}
        pointsCompleted={26.75}
        plannedPoints={30.5}
      />
    );

    expect(
      screen.getByText("26.8 of 30.5 points completed")
    ).toBeInTheDocument();
    expect(screen.getByText("87.3%")).toBeInTheDocument();
  });

  it("handles edge case with zero planned points", () => {
    render(
      <CurrentSprintStatusCard
        sprintName="Empty Sprint"
        percentComplete={0}
        pointsCompleted={0}
        plannedPoints={0}
      />
    );

    expect(screen.getByText("Empty Sprint")).toBeInTheDocument();
    expect(screen.getByText("0.0 of 0.0 points completed")).toBeInTheDocument();
  });
});
