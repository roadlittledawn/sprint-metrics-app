import { Sprint, AppData } from "./types";

/**
 * Export sprint data to CSV format
 */
export function exportToCSV(sprints: Sprint[]): string {
  if (sprints.length === 0) {
    return "No data to export";
  }

  // Define CSV headers
  const headers = [
    "Sprint Name",
    "Business Days",
    "Number of People",
    "Working Hours",
    "Total Points in Sprint",
    "Carry Over Points Total",
    "Carry Over Points Completed",
    "New Work Points",
    "Unplanned Points Brought In",
    "Points Completed",
    "Planned Points",
    "Percent Complete",
    "Velocity",
    "Predicted Capacity",
    "Created At",
    "Updated At",
  ];

  // Convert sprints to CSV rows
  const rows = sprints.map((sprint) => [
    `"${sprint.sprintName}"`,
    sprint.businessDays.toString(),
    sprint.numberOfPeople.toString(),
    sprint.workingHours.toString(),
    sprint.totalPointsInSprint.toString(),
    sprint.carryOverPointsTotal.toString(),
    sprint.carryOverPointsCompleted.toString(),
    sprint.newWorkPoints.toString(),
    sprint.unplannedPointsBroughtIn.toString(),
    sprint.pointsCompleted.toString(),
    sprint.plannedPoints.toString(),
    sprint.percentComplete.toString(),
    sprint.velocity.toString(),
    sprint.predictedCapacity.toString(),
    `"${sprint.createdAt}"`,
    `"${sprint.updatedAt}"`,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export complete app data to JSON format
 */
export function exportToJSON(appData: AppData): string {
  return JSON.stringify(appData, null, 2);
}

/**
 * Download data as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  return `${prefix}_${timestamp}.${extension}`;
}

/**
 * Parse CSV content back to sprint data
 */
export function parseCSV(csvContent: string): Sprint[] {
  const lines = csvContent.trim().split("\n");

  if (lines.length < 2) {
    throw new Error("Invalid CSV format: No data rows found");
  }

  // Skip header row
  const dataLines = lines.slice(1);

  const sprints: Sprint[] = [];

  for (let i = 0; i < dataLines.length; i++) {
    const line = dataLines[i];
    const values = parseCSVLine(line);

    if (values.length < 16) {
      throw new Error(
        `Invalid CSV format: Row ${i + 2} has insufficient columns`
      );
    }

    try {
      const sprint: Sprint = {
        id: `imported-${Date.now()}-${i}`,
        sprintName: values[0].replace(/^"|"$/g, ""), // Remove quotes
        businessDays: parseFloat(values[1]),
        numberOfPeople: parseFloat(values[2]),
        workingHours: parseFloat(values[3]),
        totalPointsInSprint: parseFloat(values[4]),
        carryOverPointsTotal: parseFloat(values[5]),
        carryOverPointsCompleted: parseFloat(values[6]),
        newWorkPoints: parseFloat(values[7]),
        unplannedPointsBroughtIn: parseFloat(values[8]),
        pointsCompleted: parseFloat(values[9]),
        plannedPoints: parseFloat(values[10]),
        percentComplete: parseFloat(values[11]),
        velocity: parseFloat(values[12]),
        predictedCapacity: parseFloat(values[13]),
        createdAt: values[14].replace(/^"|"$/g, ""),
        updatedAt: values[15].replace(/^"|"$/g, ""),
      };

      // Validate required fields
      if (
        isNaN(sprint.businessDays) ||
        isNaN(sprint.numberOfPeople) ||
        isNaN(sprint.workingHours)
      ) {
        throw new Error(
          `Invalid data in row ${
            i + 2
          }: Required numeric fields are missing or invalid`
        );
      }

      sprints.push(sprint);
    } catch (error) {
      throw new Error(
        `Error parsing row ${i + 2}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return sprints;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Parse JSON content back to app data
 */
export function parseJSON(jsonContent: string): AppData {
  try {
    const data = JSON.parse(jsonContent);

    // Validate structure
    if (!data.sprints || !Array.isArray(data.sprints)) {
      throw new Error("Invalid JSON format: Missing or invalid sprints array");
    }

    if (!data.config || typeof data.config !== "object") {
      throw new Error("Invalid JSON format: Missing or invalid config object");
    }

    return data as AppData;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Invalid JSON format: " + error.message);
    }
    throw error;
  }
}

/**
 * Create a backup of current data before modifications
 */
export function createBackup(appData: AppData): void {
  const backupData = exportToJSON(appData);
  const filename = generateFilename("sprint-data-backup", "json");
  downloadFile(backupData, filename, "application/json");
}

/**
 * Read file content from File object
 */
export function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error("Failed to read file content"));
      }
    };

    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };

    reader.readAsText(file);
  });
}
