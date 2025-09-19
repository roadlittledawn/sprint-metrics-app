import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MetricsCard, { MetricsCardProps, TrendDirection } from "../MetricsCard";

describe("MetricsCard", () => {
  const defaultProps: MetricsCardProps = {
    title: "Test Metric",
    value: 42,
  };

  it("renders basic card with title and value", () => {
    render(<MetricsCard {...defaultProps} />);

    expect(screen.getByText("TEST METRIC")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(
      <MetricsCard {...defaultProps} subtitle="This is a test subtitle" />
    );

    expect(screen.getByText("This is a test subtitle")).toBeInTheDocument();
  });

  it("renders time period badge when provided", () => {
    render(<MetricsCard {...defaultProps} timePeriod="Last 6 sprints" />);

    expect(screen.getByText("Last 6 sprints")).toBeInTheDocument();
  });

  describe("trend indicators", () => {
    it("renders up trend with green color", () => {
      render(
        <MetricsCard
          {...defaultProps}
          trend={{
            direction: "up",
            value: 5.2,
            label: "vs last sprint",
          }}
        />
      );

      expect(screen.getByText("5.2")).toBeInTheDocument();
      expect(screen.getByText("vs last sprint")).toBeInTheDocument();

      // Check for up arrow SVG
      const trendIcon = screen
        .getByText("5.2")
        .parentElement?.querySelector("svg");
      expect(trendIcon).toHaveClass("text-green-500");
    });

    it("renders down trend with red color", () => {
      render(
        <MetricsCard
          {...defaultProps}
          trend={{
            direction: "down",
            value: -2.1,
            label: "vs last sprint",
          }}
        />
      );

      expect(screen.getByText("-2.1")).toBeInTheDocument();

      // Check for down arrow SVG
      const trendIcon = screen
        .getByText("-2.1")
        .parentElement?.querySelector("svg");
      expect(trendIcon).toHaveClass("text-red-500");
    });

    it("renders neutral trend with gray color", () => {
      render(
        <MetricsCard
          {...defaultProps}
          trend={{
            direction: "neutral",
            value: 0,
            label: "no change",
          }}
        />
      );

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("no change")).toBeInTheDocument();

      // Check for neutral icon SVG
      const trendIcon = screen
        .getByText("0")
        .parentElement?.querySelector("svg");
      expect(trendIcon).toHaveClass("text-gray-400");
    });

    it("renders trend without label", () => {
      render(
        <MetricsCard
          {...defaultProps}
          trend={{
            direction: "up",
            value: 3.5,
          }}
        />
      );

      expect(screen.getByText("3.5")).toBeInTheDocument();
      expect(screen.queryByText("vs last sprint")).not.toBeInTheDocument();
    });
  });

  describe("value formatting", () => {
    it("formats integer values without decimals", () => {
      render(<MetricsCard {...defaultProps} value={100} />);
      expect(screen.getByText("100")).toBeInTheDocument();
    });

    it("formats decimal values with one decimal place", () => {
      render(<MetricsCard {...defaultProps} value={42.567} />);
      expect(screen.getByText("42.6")).toBeInTheDocument();
    });

    it("formats small decimal values with three decimal places", () => {
      render(<MetricsCard {...defaultProps} value={0.123456} />);
      expect(screen.getByText("0.123")).toBeInTheDocument();
    });

    it("formats string values as-is", () => {
      render(<MetricsCard {...defaultProps} value="85%" />);
      expect(screen.getByText("85%")).toBeInTheDocument();
    });

    it("uses custom value formatter when provided", () => {
      const customFormatter = (value: string | number) => `$${value}`;
      render(
        <MetricsCard
          {...defaultProps}
          value={1234.56}
          valueFormatter={customFormatter}
        />
      );
      expect(screen.getByText("$1234.56")).toBeInTheDocument();
    });
  });

  describe("loading state", () => {
    it("renders loading skeleton when isLoading is true", () => {
      render(<MetricsCard {...defaultProps} isLoading={true} />);

      // Should not render the actual content
      expect(screen.queryByText("TEST METRIC")).not.toBeInTheDocument();
      expect(screen.queryByText("42")).not.toBeInTheDocument();

      // Should render loading skeleton
      const skeletonElements = document.querySelectorAll(
        ".animate-pulse .bg-gray-200"
      );
      expect(skeletonElements.length).toBeGreaterThan(0);
    });

    it("renders normal content when isLoading is false", () => {
      render(<MetricsCard {...defaultProps} isLoading={false} />);

      expect(screen.getByText("TEST METRIC")).toBeInTheDocument();
      expect(screen.getByText("42")).toBeInTheDocument();
    });
  });

  describe("styling and accessibility", () => {
    it("applies custom className", () => {
      const { container } = render(
        <MetricsCard {...defaultProps} className="custom-class" />
      );

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("custom-class");
    });

    it("has proper base styling classes", () => {
      const { container } = render(<MetricsCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("bg-white", "rounded-lg", "shadow-md", "p-6");
    });

    it("has hover effects", () => {
      const { container } = render(<MetricsCard {...defaultProps} />);

      const card = container.firstChild as HTMLElement;
      expect(card).toHaveClass("hover:shadow-lg", "transition-shadow");
    });
  });

  describe("complex scenarios", () => {
    it("renders card with all props", () => {
      render(
        <MetricsCard
          title="Velocity"
          value={2.45}
          subtitle="Points per hour"
          trend={{
            direction: "up",
            value: 0.15,
            label: "vs last 3 sprints",
          }}
          timePeriod="Last 6 sprints"
          className="test-class"
          valueFormatter={(val) => `${val} pts/hr`}
        />
      );

      expect(screen.getByText("VELOCITY")).toBeInTheDocument();
      expect(screen.getByText("2.45 pts/hr")).toBeInTheDocument();
      expect(screen.getByText("Points per hour")).toBeInTheDocument();
      expect(screen.getByText("0.15")).toBeInTheDocument();
      expect(screen.getByText("vs last 3 sprints")).toBeInTheDocument();
      expect(screen.getByText("Last 6 sprints")).toBeInTheDocument();
    });

    it("handles zero values correctly", () => {
      render(<MetricsCard {...defaultProps} value={0} />);
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles negative values correctly", () => {
      render(<MetricsCard {...defaultProps} value={-5.5} />);
      expect(screen.getByText("-5.5")).toBeInTheDocument();
    });
  });
});
