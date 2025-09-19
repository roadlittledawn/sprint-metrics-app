# Design Document

## Overview

The Sprint Data Tracker is a local web application built with Next.js that replaces spreadsheet-based sprint tracking. The application consists of two main interfaces: an admin panel for data entry and a dashboard for metrics visualization. Data is stored locally in JSON format for simplicity and portability.

## Architecture

### Technology Stack

- **Framework**: Next.js (React-based with built-in routing and API routes)
- **Styling**: Tailwind CSS for responsive design
- **Data Storage**: JSON files in the project directory
- **Charts/Visualization**: Chart.js or Recharts for dashboard metrics
- **Development**: TypeScript for type safety

### Application Structure

```
sprint-data-tracker/
├── pages/
│   ├── index.js          # Dashboard (main page)
│   ├── admin.js          # Admin data entry page
│   └── api/
│       ├── sprints.js    # API for sprint CRUD operations
│       └── metrics.js    # API for calculated metrics
├── components/
│   ├── SprintForm.js     # Form for entering sprint data
│   ├── Dashboard.js      # Main dashboard component
│   ├── MetricsCard.js    # Individual metric display
│   └── SprintHistory.js  # Historical data table
├── data/
│   └── sprints.json      # Local data storage
├── lib/
│   ├── dataManager.js    # Data persistence utilities
│   └── calculations.js   # Velocity and forecasting logic
└── styles/
    └── globals.css       # Global styles
```

## Components and Interfaces

### Data Models

#### Sprint Data Structure

```typescript
interface Sprint {
  id: string;
  sprintName: string;
  taskeiLink?: string;
  businessDays: number;
  numberOfPeople: number;
  workingHours: number; // Net hours after subtracting on-call, meetings, PTO
  totalPointsInSprint: number; // All points on tickets
  carryOverPointsTotal: number; // Remaining estimates from previous sprint
  carryOverPointsCompleted: number; // Carry over points finished this sprint
  newWorkPoints: number; // Calculated: totalPointsInSprint - carryOverPointsTotal
  unplannedPointsBroughtIn: number; // Mid-sprint additions
  pointsCompleted: number; // Calculated: total completed - carryOverPointsCompleted
  plannedPoints: number; // Calculated: totalPointsInSprint - carryOverPointsCompleted
  percentComplete: number; // Calculated: (pointsCompleted / plannedPoints) * 100
  velocity: number; // Calculated: pointsCompleted / workingHours
  predictedCapacity: number; // Forecasted based on average velocity
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  name: string;
  totalGrossHours: number;
  onCallHours: number;
  meetingHours: number; // 20% of gross hours by default
  timeOffHours: number;
  netHours: number; // Calculated
}

interface AppConfig {
  velocityCalculationSprints: number; // Default: 6
  teamMembers: TeamMember[];
  defaultMeetingPercentage: number; // Default: 20
}
```

### Admin Interface Components

#### SprintForm Component

- Form fields for all sprint data points
- Validation for numeric inputs
- Auto-calculation of derived fields where possible
- Save/Update/Delete functionality
- Form pre-population for editing existing sprints

#### SprintHistory Component

- Table view of all previous sprints
- Sortable columns
- Edit/Delete actions per row
- Search and filter capabilities

### Dashboard Components

#### MetricsCard Component

- Reusable card for displaying individual metrics
- Support for trend indicators (up/down arrows)
- Configurable time periods

#### Dashboard Layout

- Grid layout with key metrics cards:
  - Current Sprint Status
  - Average Velocity (configurable period)
  - Forecasted Capacity for Next Sprint
  - Capacity Utilization
  - Sprint Completion Rate
  - Points per Hour Efficiency

#### Charts and Visualizations

- Velocity trend line chart
- Sprint completion comparison (planned vs actual)
- Capacity utilization over time
- Burndown-style visualization for current sprint

## Data Models

### Core Calculations

#### Working Hours Calculation

```javascript
// Calculate net working hours for team
const calculateWorkingHours = (teamMembers, defaultMeetingPercentage = 20) => {
  return teamMembers.reduce((total, member) => {
    const meetingHours =
      member.meetingHours ||
      (member.totalGrossHours * defaultMeetingPercentage) / 100;
    const netHours =
      member.totalGrossHours -
      member.onCallHours -
      meetingHours -
      member.timeOffHours;
    return total + Math.max(0, netHours);
  }, 0);
};
```

#### Planned Points Calculation

```javascript
// Planned points = Total points in sprint - Carry over points already completed
const calculatePlannedPoints = (
  totalPointsInSprint,
  carryOverPointsCompleted
) => {
  return totalPointsInSprint - carryOverPointsCompleted;
};
```

#### New Work Points Calculation

```javascript
// New work points = Total points in sprint - Total carry over points
const calculateNewWorkPoints = (totalPointsInSprint, carryOverPointsTotal) => {
  return totalPointsInSprint - carryOverPointsTotal;
};
```

#### Points Completed Calculation

```javascript
// Points completed = Total completed points - Carry over points completed
const calculatePointsCompleted = (
  totalCompletedPoints,
  carryOverPointsCompleted
) => {
  return totalCompletedPoints - carryOverPointsCompleted;
};
```

#### Percent Complete Calculation

```javascript
// Percent complete = (Points completed / Planned points) * 100
const calculatePercentComplete = (pointsCompleted, plannedPoints) => {
  return plannedPoints > 0 ? (pointsCompleted / plannedPoints) * 100 : 0;
};
```

#### Velocity Calculation

```javascript
// Velocity = Points completed / Working hours
const calculateVelocity = (pointsCompleted, workingHours) => {
  return workingHours > 0 ? pointsCompleted / workingHours : 0;
};
```

#### Average Velocity Calculation

```javascript
// Average velocity over last N sprints
const calculateAverageVelocity = (sprints, numberOfSprints = 6) => {
  const recentSprints = sprints.slice(-numberOfSprints);
  if (recentSprints.length === 0) return 0;

  const totalVelocity = recentSprints.reduce(
    (sum, sprint) => sum + sprint.velocity,
    0
  );
  return totalVelocity / recentSprints.length;
};
```

#### Predicted Capacity Calculation

```javascript
// Predicted capacity = Average velocity * Working hours for upcoming sprint
const calculatePredictedCapacity = (averageVelocity, upcomingWorkingHours) => {
  return averageVelocity * upcomingWorkingHours;
};
```

### Data Persistence

#### JSON Storage Structure

```json
{
  "sprints": [
    {
      "id": "sprint-001",
      "sprintName": "Sprint 1",
      "taskeiLink": "https://taskei.com/sprint/1",
      "businessDays": 5,
      "numberOfPeople": 5,
      "workingHours": 120,
      "totalPointsInSprint": 30,
      "carryOverPointsTotal": 5,
      "carryOverPointsCompleted": 3,
      "newWorkPoints": 25,
      "unplannedPointsBroughtIn": 2,
      "pointsCompleted": 25,
      "plannedPoints": 27,
      "percentComplete": 92.6,
      "velocity": 0.208,
      "predictedCapacity": 25.0
    }
  ],
  "config": {
    "velocityCalculationSprints": 6,
    "teamMembers": [
      {
        "name": "Eric",
        "totalGrossHours": 40,
        "onCallHours": 0,
        "meetingHours": 8,
        "timeOffHours": 0,
        "netHours": 32
      },
      {
        "name": "Eron",
        "totalGrossHours": 40,
        "onCallHours": 40,
        "meetingHours": 0,
        "timeOffHours": 0,
        "netHours": 0
      }
    ],
    "defaultMeetingPercentage": 20
  }
}
```

## Error Handling

### Data Validation

- Client-side validation for all form inputs
- Server-side validation in API routes
- Type checking with TypeScript
- Graceful handling of missing or corrupted data files

### Error States

- Empty state when no sprint data exists
- Loading states for calculations
- Error messages for failed operations
- Fallback values for incomplete data

### Data Recovery

- Automatic backup creation before modifications
- Data export functionality
- Import functionality for data migration

## Testing Strategy

### Unit Testing

- Test calculation functions with various data scenarios
- Test data validation logic
- Test component rendering with different props

### Integration Testing

- Test API routes with various payloads
- Test data persistence and retrieval
- Test form submission and data updates

### Manual Testing Scenarios

- Create new sprint with all data fields
- Edit existing sprint and verify calculations update
- Delete sprint and verify data integrity
- Test with empty data state
- Test with large datasets (50+ sprints)
- Test calculation accuracy against spreadsheet formulas

### Performance Considerations

- Lazy loading for large datasets
- Memoization of expensive calculations
- Efficient JSON file operations
- Client-side caching of frequently accessed data
