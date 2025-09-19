import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SettingsForm from "../SettingsForm";
import { AppConfig } from "@/lib/types";

// Mock config data
const mockConfig: AppConfig = {
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
  ],
};

describe("SettingsForm", () => {
  const mockOnConfigUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders settings form with current values", () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    expect(screen.getByDisplayValue("6")).toBeInTheDocument();
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
    expect(
      screen.getByText("Velocity Calculation Settings")
    ).toBeInTheDocument();
    expect(screen.getByText("Team Default Settings")).toBeInTheDocument();
  });

  it("validates velocity calculation sprints input", async () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );

    // Test invalid value (too low)
    fireEvent.change(velocityInput, { target: { value: "0" } });
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Must be a number between 1 and 20")
      ).toBeInTheDocument();
    });

    // Test invalid value (too high)
    fireEvent.change(velocityInput, { target: { value: "25" } });
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Must be a number between 1 and 20")
      ).toBeInTheDocument();
    });
  });

  it("validates meeting percentage input", async () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const meetingInput = screen.getByLabelText(/default meeting percentage/i);

    // Test invalid value (negative)
    fireEvent.change(meetingInput, { target: { value: "-5" } });
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Must be a number between 0 and 100")
      ).toBeInTheDocument();
    });

    // Test invalid value (too high)
    fireEvent.change(meetingInput, { target: { value: "150" } });
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Must be a number between 0 and 100")
      ).toBeInTheDocument();
    });
  });

  it("submits valid form data", async () => {
    mockOnConfigUpdate.mockResolvedValue(undefined);

    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    const meetingInput = screen.getByLabelText(/default meeting percentage/i);

    // Change values
    fireEvent.change(velocityInput, { target: { value: "8" } });
    fireEvent.change(meetingInput, { target: { value: "25" } });

    // Submit form
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(mockOnConfigUpdate).toHaveBeenCalledWith({
        ...mockConfig,
        velocityCalculationSprints: 8,
        defaultMeetingPercentage: 25,
      });
    });
  });

  it("shows success message after successful save", async () => {
    mockOnConfigUpdate.mockResolvedValue(undefined);

    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    fireEvent.change(velocityInput, { target: { value: "8" } });

    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Settings saved successfully!")
      ).toBeInTheDocument();
    });
  });

  it("disables save button when form is not dirty", () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const saveButton = screen.getByText("Save Settings");
    expect(saveButton).toBeDisabled();
  });

  it("enables save button when form is dirty", () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    fireEvent.change(velocityInput, { target: { value: "8" } });

    const saveButton = screen.getByText("Save Settings");
    expect(saveButton).not.toBeDisabled();
  });

  it("resets form to original values when cancel is clicked", () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );

    // Change value
    fireEvent.change(velocityInput, { target: { value: "8" } });
    expect(velocityInput).toHaveValue(8);

    // Click cancel
    fireEvent.click(screen.getByText("Cancel Changes"));

    // Should reset to original value
    expect(velocityInput).toHaveValue(6);
  });

  it("resets form to default values when reset to defaults is clicked", () => {
    const customConfig: AppConfig = {
      velocityCalculationSprints: 10,
      defaultMeetingPercentage: 30,
      teamMembers: mockConfig.teamMembers,
    };

    render(
      <SettingsForm config={customConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    const meetingInput = screen.getByLabelText(/default meeting percentage/i);

    expect(velocityInput).toHaveValue(10);
    expect(meetingInput).toHaveValue(30);

    // Click reset to defaults
    fireEvent.click(screen.getByText("Reset to Defaults"));

    // Should reset to default values
    expect(velocityInput).toHaveValue(6);
    expect(meetingInput).toHaveValue(20);
  });

  it("shows loading state during form submission", async () => {
    // Mock a delayed response
    mockOnConfigUpdate.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    fireEvent.change(velocityInput, { target: { value: "8" } });

    fireEvent.click(screen.getByText("Save Settings"));

    // Should show loading state
    expect(screen.getByText("Saving...")).toBeInTheDocument();

    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText("Save Settings")).toBeInTheDocument();
    });
  });

  it("displays current configuration summary", () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    expect(screen.getByText("6 sprints")).toBeInTheDocument();
    expect(screen.getByText("20%")).toBeInTheDocument();
    expect(screen.getByText("1 configured")).toBeInTheDocument();
    expect(screen.getByText("Local JSON Files")).toBeInTheDocument();
  });

  it("clears field errors when user starts typing", async () => {
    render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );

    // Set invalid value and trigger validation
    fireEvent.change(velocityInput, { target: { value: "0" } });
    fireEvent.click(screen.getByText("Save Settings"));

    await waitFor(() => {
      expect(
        screen.getByText("Must be a number between 1 and 20")
      ).toBeInTheDocument();
    });

    // Start typing a valid value
    fireEvent.change(velocityInput, { target: { value: "5" } });

    // Error should be cleared
    await waitFor(() => {
      expect(
        screen.queryByText("Must be a number between 1 and 20")
      ).not.toBeInTheDocument();
    });
  });

  it("updates form when config prop changes", () => {
    const { rerender } = render(
      <SettingsForm config={mockConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    const velocityInput = screen.getByLabelText(
      /number of sprints for velocity calculation/i
    );
    expect(velocityInput).toHaveValue(6);

    // Update config prop
    const newConfig: AppConfig = {
      ...mockConfig,
      velocityCalculationSprints: 8,
    };

    rerender(
      <SettingsForm config={newConfig} onConfigUpdate={mockOnConfigUpdate} />
    );

    expect(velocityInput).toHaveValue(8);
  });
});
