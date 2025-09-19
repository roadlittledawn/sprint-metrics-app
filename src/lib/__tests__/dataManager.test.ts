/**
 * Unit tests for data persistence layer
 */

import { promises as fs } from "fs";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  readSprintData,
  writeSprintData,
  readSprints,
  readConfig,
  writeSprints,
  writeConfig,
  addSprint,
  updateSprint,
  deleteSprint,
  getSprint,
  initializeDataStorage,
} from "../dataManager";
import { AppData, Sprint, AppConfig } from "../types";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    access: vi.fn(),
    mkdir: vi.fn(),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    copyFile: vi.fn(),
  },
}));

const mockFs = fs as any;

// Test data
const mockSprint: Sprint = {
  id: "test-sprint-1",
  sprintName: "Test Sprint 1",
  taskeiLink: "https://taskei.com/sprint/1",
  businessDays: 10,
  numberOfPeople: 5,
  workingHours: 200,
  totalPointsInSprint: 50,
  carryOverPointsTotal: 10,
  carryOverPointsCompleted: 5,
  newWorkPoints: 40,
  unplannedPointsBroughtIn: 3,
  pointsCompleted: 45,
  plannedPoints: 45,
  percentComplete: 100,
  velocity: 0.225,
  predictedCapacity: 45,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockConfig: AppConfig = {
  velocityCalculationSprints: 6,
  teamMembers: [
    {
      name: "Test User",
      totalGrossHours: 40,
      onCallHours: 0,
      meetingHours: 8,
      timeOffHours: 0,
      netHours: 32,
    },
  ],
  defaultMeetingPercentage: 20,
};

const mockAppData: AppData = {
  sprints: [mockSprint],
  config: mockConfig,
};

describe("Data Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("readSprintData", () => {
    it("should return default data when file does not exist", async () => {
      mockFs.access.mockRejectedValue(new Error("Directory not found"));
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.readFile.mockRejectedValue({ code: "ENOENT" });

      const result = await readSprintData();

      expect(result.sprints).toEqual([]);
      expect(result.config.velocityCalculationSprints).toBe(6);
      expect(result.config.defaultMeetingPercentage).toBe(20);
      expect(mockFs.mkdir).toHaveBeenCalled();
    });

    it("should return parsed data when file exists and is valid", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      const result = await readSprintData();

      expect(result).toEqual(mockAppData);
    });

    it("should return default data when file contains invalid JSON", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue("invalid json");

      const result = await readSprintData();

      expect(result.sprints).toEqual([]);
      expect(result.config.velocityCalculationSprints).toBe(6);
    });

    it("should return default data when file contains invalid data structure", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify({ invalid: "data" }));

      const result = await readSprintData();

      expect(result.sprints).toEqual([]);
      expect(result.config.velocityCalculationSprints).toBe(6);
    });

    it("should throw error when data directory cannot be created", async () => {
      mockFs.access.mockRejectedValue(new Error("Directory not found"));
      mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(readSprintData()).rejects.toThrow(
        "Failed to initialize data storage"
      );
    });
  });

  describe("writeSprintData", () => {
    it("should write valid data to file", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await writeSprintData(mockAppData);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("sprints.json"),
        JSON.stringify(mockAppData, null, 2),
        "utf-8"
      );
    });

    it("should create backup before writing when file exists", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.copyFile.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);

      await writeSprintData(mockAppData);

      expect(mockFs.copyFile).toHaveBeenCalled();
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it("should throw error for invalid data structure", async () => {
      const invalidData = { invalid: "data" } as any;

      await expect(writeSprintData(invalidData)).rejects.toThrow(
        "Failed to save sprint data"
      );
    });

    it("should throw error when file write fails", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.writeFile.mockRejectedValue(new Error("Write failed"));

      await expect(writeSprintData(mockAppData)).rejects.toThrow(
        "Failed to save sprint data"
      );
    });
  });

  describe("readSprints", () => {
    it("should return sprints array from data", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      const result = await readSprints();

      expect(result).toEqual([mockSprint]);
    });
  });

  describe("readConfig", () => {
    it("should return config from data", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      const result = await readConfig();

      expect(result).toEqual(mockConfig);
    });
  });

  describe("writeSprints", () => {
    it("should update sprints while preserving config", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newSprints = [mockSprint, { ...mockSprint, id: "test-sprint-2" }];
      await writeSprints(newSprints);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("sprints.json"),
        expect.stringContaining('"test-sprint-2"'),
        "utf-8"
      );
    });
  });

  describe("writeConfig", () => {
    it("should update config while preserving sprints", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newConfig = { ...mockConfig, velocityCalculationSprints: 8 };
      await writeConfig(newConfig);

      const writeCall = mockFs.writeFile.mock.calls[0];
      expect(writeCall[0]).toContain("sprints.json");
      expect(writeCall[1]).toContain('"velocityCalculationSprints": 8');
      expect(writeCall[2]).toBe("utf-8");
    });
  });

  describe("addSprint", () => {
    it("should add new sprint to existing data", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const newSprint = { ...mockSprint, id: "test-sprint-2" };
      await addSprint(newSprint);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("sprints.json"),
        expect.stringContaining('"test-sprint-2"'),
        "utf-8"
      );
    });

    it("should throw error for duplicate sprint ID", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      await expect(addSprint(mockSprint)).rejects.toThrow(
        "Sprint with ID test-sprint-1 already exists"
      );
    });
  });

  describe("updateSprint", () => {
    it("should update existing sprint", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));
      mockFs.writeFile.mockResolvedValue(undefined);

      const updatedSprint = { ...mockSprint, sprintName: "Updated Sprint" };
      await updateSprint("test-sprint-1", updatedSprint);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("sprints.json"),
        expect.stringContaining('"Updated Sprint"'),
        "utf-8"
      );
    });

    it("should throw error for non-existent sprint ID", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      await expect(updateSprint("non-existent", mockSprint)).rejects.toThrow(
        "Sprint with ID non-existent not found"
      );
    });
  });

  describe("deleteSprint", () => {
    it("should delete existing sprint", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));
      mockFs.writeFile.mockResolvedValue(undefined);

      await deleteSprint("test-sprint-1");

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("sprints.json"),
        expect.not.stringContaining('"test-sprint-1"'),
        "utf-8"
      );
    });

    it("should throw error for non-existent sprint ID", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      await expect(deleteSprint("non-existent")).rejects.toThrow(
        "Sprint with ID non-existent not found"
      );
    });
  });

  describe("getSprint", () => {
    it("should return sprint by ID", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      const result = await getSprint("test-sprint-1");

      expect(result).toEqual(mockSprint);
    });

    it("should return null for non-existent sprint ID", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      const result = await getSprint("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("initializeDataStorage", () => {
    it("should initialize data storage successfully", async () => {
      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(mockAppData));

      await expect(initializeDataStorage()).resolves.not.toThrow();
    });

    it("should throw error when initialization fails", async () => {
      mockFs.access.mockRejectedValue(new Error("Directory not found"));
      mockFs.mkdir.mockRejectedValue(new Error("Permission denied"));

      await expect(initializeDataStorage()).rejects.toThrow();
    });
  });
});
