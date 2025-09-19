/**
 * Accessible navigation component with keyboard support
 */

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationItem {
  href: string;
  label: string;
  icon?: string;
}

interface NavigationProps {
  items: NavigationItem[];
  className?: string;
}

export default function Navigation({ items, className = "" }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isMenuOpen) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsMenuOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsMenuOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
        break;
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % items.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
        break;
      case "Home":
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (focusedIndex >= 0) {
          // Navigate to the focused item
          window.location.href = items[focusedIndex].href;
        }
        break;
    }
  };

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={`relative ${className}`} ref={menuRef}>
      {/* Mobile menu button */}
      <button
        ref={buttonRef}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        onKeyDown={handleKeyDown}
        className="md:hidden flex items-center px-3 py-2 border rounded text-gray-500 border-gray-600 hover:text-white hover:border-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-expanded={isMenuOpen}
        aria-haspopup="true"
        aria-label="Toggle navigation menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>

      {/* Desktop navigation */}
      <div className="hidden md:flex md:space-x-8">
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              isActive(item.href)
                ? "bg-blue-700 text-white"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.icon && (
              <span className="mr-2" aria-hidden="true">
                {item.icon}
              </span>
            )}
            {item.label}
          </Link>
        ))}
      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 md:hidden"
          role="menu"
          aria-orientation="vertical"
          onKeyDown={handleKeyDown}
        >
          {items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-700 hover:bg-gray-100"
              } ${focusedIndex === index ? "bg-gray-100" : ""}`}
              role="menuitem"
              onClick={() => {
                setIsMenuOpen(false);
                setFocusedIndex(-1);
              }}
              onMouseEnter={() => setFocusedIndex(index)}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              {item.icon && (
                <span className="mr-2" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
