import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SkipLink from "@/components/ui/SkipLink";
import Navigation from "@/components/ui/Navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sprint Data Tracker",
  description:
    "Track and analyze sprint performance with comprehensive metrics and forecasting",
};

const navigationItems = [
  { href: "/", label: "Dashboard", icon: "📊" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <div className="antialiased bg-gray-50 min-h-screen flex flex-col">
          <SkipLink href="#main-content">Skip to main content</SkipLink>

          <header className="bg-blue-600 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold">Sprint Data Tracker</h1>
                </div>
                <Navigation items={navigationItems} />
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1"
          >
            {children}
          </main>

          <footer className="bg-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <p className="text-center text-sm text-gray-300">
                Sprint Data Tracker - Track your team's performance
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
