/**
 * Empty state component for when there's no data to display
 */

import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon = "📊",
  title,
  description,
  actionText,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-700 mb-6 max-w-md mx-auto">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
