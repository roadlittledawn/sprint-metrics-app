/**
 * Confirmation dialog component for destructive actions
 */

import React from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
      icon: "⚠️",
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500",
      icon: "⚠️",
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: "ℹ️",
    },
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onCancel();
    } else if (e.key === "Enter") {
      onConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-message"
      >
        <div className="flex items-center mb-4">
          <span className="text-2xl mr-3" aria-hidden="true">
            {variantStyles[variant].icon}
          </span>
          <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>

        <p id="dialog-message" className="text-gray-700 mb-6">
          {message}
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            autoFocus
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantStyles[variant].button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
