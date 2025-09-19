"use client";

import React, { useState, useRef } from "react";
import { AppData } from "@/lib/types";
import {
  exportToCSV,
  exportToJSON,
  downloadFile,
  generateFilename,
  parseCSV,
  parseJSON,
  createBackup,
  readFileContent,
} from "@/lib/exportUtils";

interface DataExportImportProps {
  appData: AppData;
  onImport: (data: AppData) => void;
}

export default function DataExportImport({
  appData,
  onImport,
}: DataExportImportProps) {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCSV = () => {
    try {
      const csvContent = exportToCSV(appData.sprints);
      const filename = generateFilename("sprint-data", "csv");
      downloadFile(csvContent, filename, "text/csv");
    } catch (error) {
      console.error("Export CSV failed:", error);
      alert(
        "Failed to export CSV: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleExportJSON = () => {
    try {
      const jsonContent = exportToJSON(appData);
      const filename = generateFilename("sprint-data", "json");
      downloadFile(jsonContent, filename, "application/json");
    } catch (error) {
      console.error("Export JSON failed:", error);
      alert(
        "Failed to export JSON: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleCreateBackup = () => {
    try {
      createBackup(appData);
    } catch (error) {
      console.error("Create backup failed:", error);
      alert(
        "Failed to create backup: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const content = await readFileContent(file);
      let importedData: AppData;

      if (file.name.toLowerCase().endsWith(".csv")) {
        // Import CSV (sprints only)
        const sprints = parseCSV(content);
        importedData = {
          sprints,
          config: appData.config, // Keep existing config
        };
        setImportSuccess(
          `Successfully imported ${sprints.length} sprints from CSV`
        );
      } else if (file.name.toLowerCase().endsWith(".json")) {
        // Import JSON (complete data)
        importedData = parseJSON(content);
        setImportSuccess(
          `Successfully imported ${importedData.sprints.length} sprints and configuration from JSON`
        );
      } else {
        throw new Error(
          "Unsupported file format. Please use .csv or .json files."
        );
      }

      // Create backup before importing
      createBackup(appData);

      // Call the import handler
      onImport(importedData);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Unknown import error"
      );
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Data Export & Import</h3>

      {/* Export Section */}
      <div className="mb-6">
        <h4 className="text-md font-medium mb-3 text-gray-700">Export Data</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export to CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export to JSON
          </button>

          <button
            onClick={handleCreateBackup}
            className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 flex items-center"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            Create Backup
          </button>
        </div>

        <p className="text-sm text-gray-600 mt-2">
          CSV exports sprint data only. JSON exports complete data including
          team configuration.
        </p>
      </div>

      {/* Import Section */}
      <div className="mb-4">
        <h4 className="text-md font-medium mb-3 text-gray-700">Import Data</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImportClick}
            disabled={importing}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Import Data
              </>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        <p className="text-sm text-gray-600 mt-2">
          Supports CSV and JSON files. A backup will be created automatically
          before importing.
        </p>
      </div>

      {/* Status Messages */}
      {importError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-red-800">
                Import Failed
              </h4>
              <p className="text-sm text-red-700 mt-1">{importError}</p>
            </div>
          </div>
        </div>
      )}

      {importSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-green-400 mr-2 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-green-800">
                Import Successful
              </h4>
              <p className="text-sm text-green-700 mt-1">{importSuccess}</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Summary */}
      <div className="bg-gray-50 rounded-md p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Data</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Sprints:</span>
            <span className="ml-2 font-medium">{appData.sprints.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Team Members:</span>
            <span className="ml-2 font-medium">
              {appData.config.teamMembers.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
