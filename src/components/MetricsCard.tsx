"use client";

import React from "react";

export type TrendDirection = "up" | "down" | "neutral";

export interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: TrendDirection;
    value: string | number;
    label?: string;
  };
  timePeriod?: string;
  isLoading?: boolean;
  className?: string;
  valueFormatter?: (value: string | number) => string;
}

const TrendIcon: React.FC<{ direction: TrendDirection }> = ({ direction }) => {
  const baseClasses = "w-4 h-4 ml-1";

  switch (direction) {
    case "up":
      return (
        <svg
          className={`${baseClasses} text-green-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 17l9.2-9.2M17 17V7H7"
          />
        </svg>
      );
    case "down":
      return (
        <svg
          className={`${baseClasses} text-red-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 7l-9.2 9.2M7 7v10h10"
          />
        </svg>
      );
    case "neutral":
    default:
      return (
        <svg
          className={`${baseClasses} text-gray-500`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        </svg>
      );
  }
};

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
  </div>
);

export default function MetricsCard({
  title,
  value,
  subtitle,
  trend,
  timePeriod,
  isLoading = false,
  className = "",
  valueFormatter,
}: MetricsCardProps) {
  const formatValue = (val: string | number): string => {
    if (valueFormatter) {
      return valueFormatter(val);
    }

    if (typeof val === "number") {
      // Format numbers with appropriate precision
      if (val % 1 === 0) {
        return val.toString();
      } else if (val < 1) {
        return val.toFixed(3);
      } else {
        return val.toFixed(1);
      }
    }

    return val.toString();
  };

  const getTrendColor = (direction: TrendDirection): string => {
    switch (direction) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      case "neutral":
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-200 ${className}`}
    >
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
              {title}
            </h3>
            {timePeriod && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {timePeriod}
              </span>
            )}
          </div>

          {/* Main Value */}
          <div className="flex items-baseline mb-2">
            <span className="text-3xl font-bold text-gray-900">
              {formatValue(value)}
            </span>
            {trend && (
              <div className="flex items-center ml-2">
                <TrendIcon direction={trend.direction} />
                <span
                  className={`text-sm font-medium ml-1 ${getTrendColor(
                    trend.direction
                  )}`}
                >
                  {formatValue(trend.value)}
                </span>
              </div>
            )}
          </div>

          {/* Subtitle and Trend Label */}
          <div className="space-y-1">
            {subtitle && <p className="text-sm text-gray-700">{subtitle}</p>}
            {trend?.label && (
              <p className="text-xs text-gray-600">{trend.label}</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
