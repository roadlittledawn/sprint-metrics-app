import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  exportToCSV,
  exportToJSON,
  parseCSV,
  parseJSON,
  generateFilename,
  downloadFile,
  readFileContent,
} from "../exportUtils";
import { Sprint, AppData } from "../types";

describe("exportUtils", () => {
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

  const sampleAppData: AppData = {
    sprints: sampleSprints,
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

  describe("exportToCSV", () => {
    it("should export sprints to CSV format", () => {
      const csv = exportToCSV(sampleSprints);

      expect(csv).toContain("Sprint Name,Business Days");
      expect(csv).toContain('"Sprint 24.1"');
      expect(csv).toContain('"Sprint 24.2"');
      expect(csv).toContain("10,2,52");
      expect(csv).toContain("8,3,60");
    });

    it("should handle empty sprint array", () => {
      const csv = exportToCSV([]);
      expect(csv).toBe("No data to export");
    });

    it("should properly quote string values", () => {
      const csv = exportToCSV(sampleSprints);
      expect(csv).toContain('"Sprint 24.1"');
      expect(csv).toContain('"2024-01-01T00:00:00.000Z"');
    });
  });

  describe("exportToJSON", () => {
    it("should export app data to JSON format", () => {
      const json = exportToJSON(sampleAppData);
      const parsed = JSON.parse(json);

      expect(parsed.sprints).toHaveLength(2);
      expect(parsed.config.velocityCalculationSprints).toBe(6);
      expect(parsed.config.teamMembers).toHaveLength(1);
    });

    it("should format JSON with proper indentation", () => {
      const json = exportToJSON(sampleAppData);
      expect(json).toContain('  "sprints": [');
      expect(json).toContain("    {");
    });
  });

  describe("parseCSV", () => {
    it("should parse CSV content back to sprint data", () => {
      const csv = exportToCSV(sampleSprints);
      const parsed = parseCSV(csv);

      expect(parsed).toHaveLength(2);
      expect(parsed[0].sprintName).toBe("Sprint 24.1");
      expect(parsed[0].businessDays).toBe(10);
      expect(parsed[0].numberOfPeople).toBe(2);
      expect(parsed[1].sprintName).toBe("Sprint 24.2");
    });

    it("should handle quoted values correctly", () => {
      const csvWithQuotes = `Sprint Name,Business Days,Number of People,Working Hours,Total Points in Sprint,Carry Over Points Total,Carry Over Points Completed,New Work Points,Unplanned Points Brought In,Points Completed,Planned Points,Percent Complete,Velocity,Predicted Capacity,Created At,Updated At
"Test Sprint, with comma",5,2,40,20,5,3,15,1,18,17,105.9,0.45,22.5,"2024-01-01T00:00:00.000Z","2024-01-01T00:00:00.000Z"`;

      const parsed = parseCSV(csvWithQuotes);
      expect(parsed[0].sprintName).toBe("Test Sprint, with comma");
    });

    it("should throw error for invalid CSV format", () => {
      expect(() => parseCSV("")).toThrow("Invalid CSV format");
      expect(() => parseCSV("header only")).toThrow("Invalid CSV format");
    });

    it("should throw error for insufficient columns", () => {
      const invalidCsv = `Sprint Name,Business Days
"Test",5`;
      expect(() => parseCSV(invalidCsv)).toThrow("insufficient columns");
    });

    it("should throw error for invalid numeric data", () => {
      const invalidCsv = `Sprint Name,Business Days,Number of People,Working Hours,Total Points in Sprint,Carry Over Points Total,Carry Over Points Completed,New Work Points,Unplanned Points Brought In,Points Completed,Planned Points,Percent Complete,Velocity,Predicted Capacity,Created At,Updated At
"Test",invalid,2,40,20,5,3,15,1,18,17,105.9,0.45,22.5,"2024-01-01T00:00:00.000Z","2024-01-01T00:00:00.000Z"`;
      expect(() => parseCSV(invalidCsv)).toThrow(
        "Required numeric fields are missing or invalid"
      );
    });
  });

  describe("parseJSON", () => {
    it("should parse JSON content back to app data", () => {
      const json = exportToJSON(sampleAppData);
      const parsed = parseJSON(json);

      expect(parsed.sprints).toHaveLength(2);
      expect(parsed.config.velocityCalculationSprints).toBe(6);
      expect(parsed.config.teamMembers[0].name).toBe("Eric");
    });

    it("should throw error for invalid JSON syntax", () => {
      expect(() => parseJSON("invalid json")).toThrow("Invalid JSON format");
    });

    it("should throw error for missing sprints array", () => {
      const invalidJson = JSON.stringify({ config: {} });
      expect(() => parseJSON(invalidJson)).toThrow(
        "Missing or invalid sprints array"
      );
    });

    it("should throw error for missing config object", () => {
      const invalidJson = JSON.stringify({ sprints: [] });
      expect(() => parseJSON(invalidJson)).toThrow(
        "Missing or invalid config object"
      );
    });
  });

  describe("generateFilename", () => {
    it("should generate filename with timestamp", () => {
      const filename = generateFilename("test", "csv");
      expect(filename).toMatch(
        /^test_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.csv$/
      );
    });

    it("should handle different prefixes and extensions", () => {
      const filename = generateFilename("backup", "json");
      expect(filename).toMatch(
        /^backup_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/
      );
    });
  });

  describe("downloadFile", () => {
    let mockCreateObjectURL: ReturnType<typeof vi.fn>;
    let mockRevokeObjectURL: ReturnType<typeof vi.fn>;
    let mockClick: ReturnType<typeof vi.fn>;
    let mockAppendChild: ReturnType<typeof vi.fn>;
    let mockRemoveChild: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      // Mock URL methods
      mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
      mockRevokeObjectURL = vi.fn();
      global.URL = {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      } as any;

      // Mock DOM methods
      mockClick = vi.fn();
      mockAppendChild = vi.fn();
      mockRemoveChild = vi.fn();

      const mockLink = {
        href: "",
        download: "",
        click: mockClick,
      };

      vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
      vi.spyOn(document.body, "appendChild").mockImplementation(
        mockAppendChild
      );
      vi.spyOn(document.body, "removeChild").mockImplementation(
        mockRemoveChild
      );
    });

    it("should create and trigger download", () => {
      downloadFile("test content", "test.txt", "text/plain");

      expect(mockCreateObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    });
  });

  describe("readFileContent", () => {
    it("should read file content successfully", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      // Mock FileReader
      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: vi.fn(),
        result: "test content",
      };

      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as any
      );

      const promise = readFileContent(mockFile);

      // Simulate successful read
      mockFileReader.onload({ target: { result: "test content" } });

      const result = await promise;
      expect(result).toBe("test content");
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
    });

    it("should handle file read errors", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: vi.fn(),
      };

      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as any
      );

      const promise = readFileContent(mockFile);

      // Simulate error
      mockFileReader.onerror();

      await expect(promise).rejects.toThrow("Error reading file");
    });

    it("should handle empty result", async () => {
      const mockFile = new File(["test content"], "test.txt", {
        type: "text/plain",
      });

      const mockFileReader = {
        onload: null as any,
        onerror: null as any,
        readAsText: vi.fn(),
      };

      vi.spyOn(global, "FileReader").mockImplementation(
        () => mockFileReader as any
      );

      const promise = readFileContent(mockFile);

      // Simulate empty result
      mockFileReader.onload({ target: { result: null } });

      await expect(promise).rejects.toThrow("Failed to read file content");
    });
  });
});
