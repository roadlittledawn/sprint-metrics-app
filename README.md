# Sprint Data Tracker

A local web application for tracking and analyzing sprint data, built with Next.js and TypeScript.

## Project Structure

```
sprint-data-tracker/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # Reusable React components
│   └── lib/          # Utility functions and data management
├── data/             # Local JSON data storage
└── public/           # Static assets
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Storage**: Local JSON files

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features

- Admin interface for sprint data entry
- Dashboard with sprint metrics and visualizations
- Local data storage with JSON files
- Responsive design with Tailwind CSS
- TypeScript for type safety
