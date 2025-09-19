/**
 * Skip link component for keyboard navigation accessibility
 */

import React from "react";

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function SkipLink({
  href,
  children,
  className = "",
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium z-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
    >
      {children}
    </a>
  );
}
