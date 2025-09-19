/**
 * Data persistence layer for Sprint Data Tracker
 * Handles reading/writing sprint data to/from JSON files
 */

import { promises as fs } from "fs";
import path from "path";
import { AppData, Sprint, AppConfig } from "./types";
import {
  validateSprint,
  validateDataIntegrity,
  isDataCorrupted,
} from "./validation";
import {
  withErrorHandling,
  handleDataCorruptionError,
  createFallbackData,
  logError,
} from "./errorHandling";

// File paths for data storage
const DATA_DIR = path.join(process.cwd(), "data");
const SPRINTS_FILE = path.join(DATA_DIR, "sprints.json");

// Default configuration
const DEFAULT_CONFIG: AppConfig = {
  velocityCalculationSprints: 6,
  teamMembers: [],
  defaultMeetingPercentage: 20,
};

// Default empty data structure
const DEFAULT_DATA: AppData = {
  sprints: [],
  config: DEFAULT_CONFIG,
};

/**
 * Ensures the data directory exists
 */
async function ensureDataDirectory(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

// Validation functions are now imported from validation.ts module

/**
 * Reads sprint data from JSON file
 * Returns default data if file doesn't exist or is corrupted
 */
export async function readSprintData(): Promise<AppData> {
  const result = await withErrorHandling(async () => {
    await ensureDataDirectory();

    try {
      const fileContent = await fs.readFile(SPRINTS_FILE, "utf-8");
      const data = JSON.parse(fileContent);

      // Check for data corruption
      if (isDataCorrupted(data)) {
        const error = handleDataCorruptionError(
          { file: SPRINTS_FILE, data: typeof data },
          "readSprintData"
        );
        logError(error);

        // Create backup of corrupted file
        const backupFile = path.join(
          DATA_DIR,
          `sprints.corrupted.${Date.now()}.json`
        );
        await fs.copyFile(SPRINTS_FILE, backupFile);
        console.warn(`Corrupted data backed up to: ${backupFile}`);

        return createFallbackData("full");
      }

      // Validate data structure
      const validation = validateDataIntegrity(data);
      if (!validation.isValid) {
        console.warn(
          "Data validation failed, using fallback data:",
          validation.errors
        );
        return createFallbackData("full");
      }

      return data;
    } catch (parseError) {
      if ((parseError as NodeJS.ErrnoException).code === "ENOENT") {
        console.log(
          "No existing data file found, initializing with default data"
        );
        return DEFAULT_DATA;
      } else {
        console.warn("Error reading/parsing data file:", parseError);
        return createFallbackData("full");
      }
    }
  }, "readSprintData");

  if (result.success) {
    return result.data;
  } else {
    // If all else fails, return default data
    console.error(
      "Failed to read sprint data, using default:",
      result.error.message
    );
    return DEFAULT_DATA;
  }
}

/**
 * Writes sprint data to JSON file
 * Validates data before saving
 */
export async function writeSprintData(data: AppData): Promise<void> {
  const result = await withErrorHandling(async () => {
    // Validate data before saving
    const validation = validateDataIntegrity(data);
    if (!validation.isValid) {
      throw new Error(
        `Data validation failed: ${validation.errors.join(", ")}`
      );
    }

    await ensureDataDirectory();

    // Create backup of existing file if it exists
    try {
      await fs.access(SPRINTS_FILE);
      const backupFile = path.join(
        DATA_DIR,
        `sprints.backup.${Date.now()}.json`
      );
      await fs.copyFile(SPRINTS_FILE, backupFile);
      console.log(`Backup created: ${backupFile}`);
    } catch {
      // No existing file to backup, continue
    }

    // Write new data with pretty formatting
    const jsonContent = JSON.stringify(data, null, 2);
    await fs.writeFile(SPRINTS_FILE, jsonContent, "utf-8");

    // Verify the write was successful by reading it back
    const verification = await fs.readFile(SPRINTS_FILE, "utf-8");
    const parsedVerification = JSON.parse(verification);

    if (isDataCorrupted(parsedVerification)) {
      throw new Error("Data corruption detected after write operation");
    }
  }, "writeSprintData");

  if (!result.success) {
    throw new Error(`Failed to save sprint data: ${result.error.userMessage}`);
  }
}

/**
 * Reads only sprint records
 */
export async function readSprints(): Promise<Sprint[]> {
  const data = await readSprintData();
  return data.sprints;
}

/**
 * Reads only app configuration
 */
export async function readConfig(): Promise<AppConfig> {
  const data = await readSprintData();
  return data.config;
}

/**
 * Updates sprint records while preserving config
 */
export async function writeSprints(sprints: Sprint[]): Promise<void> {
  const data = await readSprintData();
  data.sprints = sprints;
  await writeSprintData(data);
}

/**
 * Updates app configuration while preserving sprints
 */
export async function writeConfig(config: AppConfig): Promise<void> {
  const data = await readSprintData();
  data.config = config;
  await writeSprintData(data);
}

/**
 * Adds a new sprint to the data
 */
export async function addSprint(sprint: Sprint): Promise<void> {
  const sprints = await readSprints();

  // Check for duplicate ID
  if (sprints.some((s) => s.id === sprint.id)) {
    throw new Error(`Sprint with ID ${sprint.id} already exists`);
  }

  sprints.push(sprint);
  await writeSprints(sprints);
}

/**
 * Updates an existing sprint
 */
export async function updateSprint(
  sprintId: string,
  updatedSprint: Sprint
): Promise<void> {
  const sprints = await readSprints();
  const index = sprints.findIndex((s) => s.id === sprintId);

  if (index === -1) {
    throw new Error(`Sprint with ID ${sprintId} not found`);
  }

  sprints[index] = updatedSprint;
  await writeSprints(sprints);
}

/**
 * Deletes a sprint by ID
 */
export async function deleteSprint(sprintId: string): Promise<void> {
  const sprints = await readSprints();
  const filteredSprints = sprints.filter((s) => s.id !== sprintId);

  if (filteredSprints.length === sprints.length) {
    throw new Error(`Sprint with ID ${sprintId} not found`);
  }

  await writeSprints(filteredSprints);
}

/**
 * Gets a single sprint by ID
 */
export async function getSprint(sprintId: string): Promise<Sprint | null> {
  const sprints = await readSprints();
  return sprints.find((s) => s.id === sprintId) || null;
}

/**
 * Replaces all sprint data (used for bulk import)
 */
export async function writeSprintsData(sprints: Sprint[]): Promise<void> {
  // Validate all sprints
  for (const sprint of sprints) {
    const validation = validateSprint(sprint);
    if (!validation.isValid) {
      throw new Error(
        `Invalid sprint data structure for sprint: ${
          sprint.id || "unknown"
        }: ${validation.errors.join(", ")}`
      );
    }
  }

  await writeSprints(sprints);
}

/**
 * Initializes data storage with default values if no data exists
 */
export async function initializeDataStorage(): Promise<void> {
  try {
    await readSprintData(); // This will create default data if none exists
    console.log("Data storage initialized successfully");
  } catch (error) {
    console.error("Failed to initialize data storage:", error);
    throw error;
  }
}
