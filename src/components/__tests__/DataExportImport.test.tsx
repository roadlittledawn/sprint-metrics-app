import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DataExportImport from "../DataExportImport";
import { AppData } from "@/lib/types";
import * as exportUtils from "@/lib/exportUtils";

// Mock the export utils
vi.mock("@/lib/exportUtils", () => ({
  exportToCSV: vi.fn(),
  exportToJSON: vi.fn(),
  downloadFile: vi.fn(),
  generateFilename: vi.fn(),
  parseCSV: vi.fn(),
  parseJSON: vi.fn(),
  createBackup: vi.fn(),
  readFileContent: vi.fn(),
}));

describe("DataExportImport", () => {
  const mockOnImport = vi.fn();

  const sampleAppData: AppData = {
    sprints: [
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
    ],
    config: {
      velocityCalculationSprints: 6,
      teamMembers: [
        {
          name: "Eric",
          totalGrossHours: 40,
          onCallHours: 0,
          meetingHours: 8,
          timeOffHours: 0,
          netHours: 32,
        },
      ],
      defaultMeetingPercentage: 20,
    },
  };

  const defaultProps = {
    appData: sampleAppData,
    onImport: mockOnImport,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render export and import sections", () => {
    render(<DataExportImport {...defaultProps} />);

    expect(screen.getByText("Data Export & Import")).toBeInTheDocument();
    expect(screen.getByText("Export Data")).toBeInTheDocument();
    expect(screen.getByText("Import Data")).toBeInTheDocument();
    expect(screen.getByText("Export to CSV")).toBeInTheDocument();
    expect(screen.getByText("Export to JSON")).toBeInTheDocument();
    expect(screen.getByText("Create Backup")).toBeInTheDocument();
    expect(screen.getByText("Import Data")).toBeInTheDocument();
  });

  it("should display current data summary", () => {
    render(<DataExportImport {...defaultProps} />);

    expect(screen.getByText("Current Data")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 sprint
    expect(screen.getByText("1")).toBeInTheDocument(); // 1 team member
  });

  it("should handle CSV export", async () => {
    const mockExportToCSV = vi.mocked(exportUtils.exportToCSV);
    const mockGenerateFilename = vi.mocked(exportUtils.generateFilename);
    const mockDownloadFile = vi.mocked(exportUtils.downloadFile);

    mockExportToCSV.mockReturnValue("csv content");
    mockGenerateFilename.mockReturnValue("sprint-data_2024-01-01.csv");

    render(<DataExportImport {...defaultProps} />);

    const csvButton = screen.getByText("Export to CSV");
    await userEvent.click(csvButton);

    expect(mockExportToCSV).toHaveBeenCalledWith(sampleAppData.sprints);
    expect(mockGenerateFilename).toHaveBeenCalledWith("sprint-data", "csv");
    expect(mockDownloadFile).toHaveBeenCalledWith(
      "csv content",
      "sprint-data_2024-01-01.csv",
      "text/csv"
    );
  });

  it("should handle JSON export", async () => {
    const mockExportToJSON = vi.mocked(exportUtils.exportToJSON);
    const mockGenerateFilename = vi.mocked(exportUtils.generateFilename);
    const mockDownloadFile = vi.mocked(exportUtils.downloadFile);

    mockExportToJSON.mockReturnValue("json content");
    mockGenerateFilename.mockReturnValue("sprint-data_2024-01-01.json");

    render(<DataExportImport {...defaultProps} />);

    const jsonButton = screen.getByText("Export to JSON");
    await userEvent.click(jsonButton);

    expect(mockExportToJSON).toHaveBeenCalledWith(sampleAppData);
    expect(mockGenerateFilename).toHaveBeenCalledWith("sprint-data", "json");
    expect(mockDownloadFile).toHaveBeenCalledWith(
      "json content",
      "sprint-data_2024-01-01.json",
      "application/json"
    );
  });

  it("should handle backup creation", async () => {
    const mockCreateBackup = vi.mocked(exportUtils.createBackup);

    render(<DataExportImport {...defaultProps} />);

    const backupButton = screen.getByText("Create Backup");
    await userEvent.click(backupButton);

    expect(mockCreateBackup).toHaveBeenCalledWith(sampleAppData);
  });

  it("should handle CSV import", async () => {
    const mockReadFileContent = vi.mocked(exportUtils.readFileContent);
    const mockParseCSV = vi.mocked(exportUtils.parseCSV);
    const mockCreateBackup = vi.mocked(exportUtils.createBackup);

    mockReadFileContent.mockResolvedValue("csv content");
    mockParseCSV.mockReturnValue([sampleAppData.sprints[0]]);

    render(<DataExportImport {...defaultProps} />);

    const importButton = screen.getByText("Import Data");
    await userEvent.click(importButton);

    // Get the hidden file input
    const fileInput = screen
      .getByRole("button", { name: /import data/i })
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    expect(fileInput).toBeInTheDocument();

    // Create a mock CSV file
    const csvFile = new File(["csv content"], "test.csv", { type: "text/csv" });

    // Simulate file selection
    await userEvent.upload(fileInput, csvFile);

    await waitFor(() => {
      expect(mockReadFileContent).toHaveBeenCalledWith(csvFile);
    });

    await waitFor(() => {
      expect(mockParseCSV).toHaveBeenCalledWith("csv content");
      expect(mockCreateBackup).toHaveBeenCalledWith(sampleAppData);
      expect(mockOnImport).toHaveBeenCalledWith({
        sprints: [sampleAppData.sprints[0]],
        config: sampleAppData.config,
      });
    });

    expect(
      screen.getByText(/Successfully imported 1 sprints from CSV/)
    ).toBeInTheDocument();
  });

  it("should handle JSON import", async () => {
    const mockReadFileContent = vi.mocked(exportUtils.readFileContent);
    const mockParseJSON = vi.mocked(exportUtils.parseJSON);
    const mockCreateBackup = vi.mocked(exportUtils.createBackup);

    mockReadFileContent.mockResolvedValue("json content");
    mockParseJSON.mockReturnValue(sampleAppData);

    render(<DataExportImport {...defaultProps} />);

    const importButton = screen.getByText("Import Data");
    await userEvent.click(importButton);

    const fileInput = screen
      .getByRole("button", { name: /import data/i })
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    // Create a mock JSON file
    const jsonFile = new File(["json content"], "test.json", {
      type: "application/json",
    });

    await userEvent.upload(fileInput, jsonFile);

    await waitFor(() => {
      expect(mockReadFileContent).toHaveBeenCalledWith(jsonFile);
    });

    await waitFor(() => {
      expect(mockParseJSON).toHaveBeenCalledWith("json content");
      expect(mockCreateBackup).toHaveBeenCalledWith(sampleAppData);
      expect(mockOnImport).toHaveBeenCalledWith(sampleAppData);
    });

    expect(
      screen.getByText(
        /Successfully imported 1 sprints and configuration from JSON/
      )
    ).toBeInTheDocument();
  });

  it("should handle import errors", async () => {
    const mockReadFileContent = vi.mocked(exportUtils.readFileContent);
    mockReadFileContent.mockRejectedValue(new Error("File read error"));

    render(<DataExportImport {...defaultProps} />);

    const importButton = screen.getByText("Import Data");
    await userEvent.click(importButton);

    const fileInput = screen
      .getByRole("button", { name: /import data/i })
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const csvFile = new File(["csv content"], "test.csv", { type: "text/csv" });
    await userEvent.upload(fileInput, csvFile);

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
      expect(screen.getByText("File read error")).toBeInTheDocument();
    });

    expect(mockOnImport).not.toHaveBeenCalled();
  });

  it("should handle unsupported file formats", async () => {
    const mockReadFileContent = vi.mocked(exportUtils.readFileContent);
    mockReadFileContent.mockResolvedValue("content");

    render(<DataExportImport {...defaultProps} />);

    const importButton = screen.getByText("Import Data");
    await userEvent.click(importButton);

    const fileInput = screen
      .getByRole("button", { name: /import data/i })
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const txtFile = new File(["content"], "test.txt", { type: "text/plain" });
    await userEvent.upload(fileInput, txtFile);

    await waitFor(() => {
      expect(screen.getByText("Import Failed")).toBeInTheDocument();
      expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    });
  });

  it("should show loading state during import", async () => {
    const mockReadFileContent = vi.mocked(exportUtils.readFileContent);
    mockReadFileContent.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<DataExportImport {...defaultProps} />);

    const importButton = screen.getByText("Import Data");
    await userEvent.click(importButton);

    const fileInput = screen
      .getByRole("button", { name: /import data/i })
      .parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    const csvFile = new File(["csv content"], "test.csv", { type: "text/csv" });
    await userEvent.upload(fileInput, csvFile);

    expect(screen.getByText("Importing...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /importing/i })).toBeDisabled();
  });

  it("should handle export errors gracefully", async () => {
    const mockExportToCSV = vi.mocked(exportUtils.exportToCSV);
    mockExportToCSV.mockImplementation(() => {
      throw new Error("Export failed");
    });

    // Mock alert
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    render(<DataExportImport {...defaultProps} />);

    const csvButton = screen.getByText("Export to CSV");
    await userEvent.click(csvButton);

    expect(alertSpy).toHaveBeenCalledWith(
      "Failed to export CSV: Export failed"
    );

    alertSpy.mockRestore();
  });
});
